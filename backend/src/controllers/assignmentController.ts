import { Request, Response } from 'express';
import { z } from 'zod';
import { AssignmentModel } from '../models/Assignment';
import { TemplateModel } from '../models/Template';
import { cacheGet, cacheSet, cacheDel } from '../utils/redis';
import { calibrateDifficultyFromPaper, generateVariantB, generateAssessment } from '../services/aiService';
import { AssignmentInput } from '../types';
import { AuthRequest } from '../middleware/auth';
import { wsManager } from '../utils/websocket';
import { v4 as uuidv4 } from 'uuid';
import pdfParse from 'pdf-parse';

const QTSchema = z.object({
  type: z.enum(['mcq','short_answer','long_answer','true_false','fill_blank','numerical','diagram']),
  count: z.number().int().min(1).max(50),
  marksPerQuestion: z.number().min(0.5).max(100),
});

const InputSchema = z.object({
  title: z.string().min(2).max(200),
  subject: z.string().min(1).max(100),
  gradeLevel: z.string().min(1),
  schoolName: z.string().optional(),
  dueDate: z.string(),
  questionTypes: z.array(QTSchema).min(1),
  difficultyDistribution: z.object({ easy: z.number(), medium: z.number(), hard: z.number() }),
  additionalInstructions: z.string().max(2000).optional(),
  language: z.enum(['english','hindi','hinglish']).optional(),
});

function parseBody(req: Request): any {
  const raw = req.body;
  if (!raw) return {};
  return {
    ...raw,
    questionTypes: typeof raw.questionTypes === 'string' ? JSON.parse(raw.questionTypes) : raw.questionTypes,
    difficultyDistribution: typeof raw.difficultyDistribution === 'string' ? JSON.parse(raw.difficultyDistribution) : raw.difficultyDistribution,
  };
}

async function runGeneration(assignmentId: string, body: AssignmentInput) {
  try {
    await AssignmentModel.findByIdAndUpdate(assignmentId, { status: 'processing' });
    wsManager.broadcast(assignmentId, {
      type: 'JOB_STATUS', jobId: assignmentId, assignmentId,
      status: 'processing', progress: 5, message: 'Starting generation...',
    });

    const result = await generateAssessment(body, async (progress: number, message: string) => {
      wsManager.broadcast(assignmentId, {
        type: 'JOB_PROGRESS', jobId: assignmentId, assignmentId,
        status: 'processing', progress, message,
      });
    });

    await AssignmentModel.findByIdAndUpdate(assignmentId, { status: 'completed', result });
    wsManager.broadcast(assignmentId, {
      type: 'JOB_COMPLETE', jobId: assignmentId, assignmentId,
      status: 'completed', progress: 100, message: 'Paper ready!', result,
    });
    console.log(`✅ Assignment ${assignmentId} generated`);
  } catch (err: any) {
    console.error(`❌ Generation failed:`, err.message);
    await AssignmentModel.findByIdAndUpdate(assignmentId, { status: 'failed', error: err.message });
    wsManager.broadcast(assignmentId, {
      type: 'JOB_ERROR', jobId: assignmentId, assignmentId,
      status: 'failed', error: err.message,
    });
  }
}

export const createAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = parseBody(req);

    if (parsed.questionTypes) {
      parsed.questionTypes = parsed.questionTypes.map((qt: any) => ({
        ...qt,
        count: Number(qt.count),
        marksPerQuestion: Number(qt.marksPerQuestion),
      }));
    }
    if (parsed.difficultyDistribution) {
      parsed.difficultyDistribution = {
        easy: Number(parsed.difficultyDistribution.easy),
        medium: Number(parsed.difficultyDistribution.medium),
        hard: Number(parsed.difficultyDistribution.hard),
      };
    }

    const body = InputSchema.parse(parsed) as AssignmentInput;

    if (req.file) {
      try {
        body.fileContent = req.file.mimetype === 'application/pdf'
          ? (await pdfParse(req.file.buffer)).text
          : req.file.buffer.toString('utf-8');
      } catch {}
    }

    body.totalMarks = body.questionTypes.reduce((s, qt) => s + qt.count * qt.marksPerQuestion, 0);
    const shareToken = uuidv4().replace(/-/g, '').substring(0, 12);
    const assignment = await AssignmentModel.create({ input: body, status: 'pending', shareToken });
    const assignmentId = assignment._id.toString();

    res.status(201).json({
      success: true,
      data: { assignmentId, jobId: assignmentId, shareToken, status: 'pending' }
    });

    setImmediate(() => runGeneration(assignmentId, body));

  } catch (err: any) {
    console.error('createAssignment error:', err.message);
    res.status(400).json({ success: false, error: err.message || 'Failed' });
  }
};

export const getAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const cached = await cacheGet(`assignment:${id}`);
    if (cached) { res.json({ success: true, data: cached, fromCache: true }); return; }
    const assignment = await AssignmentModel.findById(id).lean();
    if (!assignment) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    if (assignment.status === 'completed') await cacheSet(`assignment:${id}`, assignment, 3600);
    res.json({ success: true, data: assignment });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getSharedAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const assignment = await AssignmentModel.findOne({ shareToken: token, status: 'completed' }).lean();
    if (!assignment) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    res.json({ success: true, data: assignment });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const listAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const [assignments, total] = await Promise.all([
      AssignmentModel.find({}, { 'input.fileContent': 0, result: 0, variants: 0 })
        .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      AssignmentModel.countDocuments(),
    ]);
    res.json({ success: true, data: assignments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const regenerateAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const assignment = await AssignmentModel.findById(id);
    if (!assignment) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    await cacheDel(`assignment:${id}`);
    await AssignmentModel.findByIdAndUpdate(id, { status: 'pending', result: undefined, error: undefined, variants: undefined });
    res.json({ success: true, data: { assignmentId: id, jobId: id } });
    setImmediate(() => runGeneration(id, assignment.input as AssignmentInput));
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const generateVariants = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const assignment = await AssignmentModel.findById(id);
    if (!assignment?.result) { res.status(400).json({ success: false, error: 'No result yet' }); return; }
    const variantB = generateVariantB((assignment.result as any).sections);
    const variants = [
      { variant: 'A', sections: (assignment.result as any).sections },
      { variant: 'B', sections: variantB },
    ];
    await AssignmentModel.findByIdAndUpdate(id, { variants });
    await cacheDel(`assignment:${id}`);
    res.json({ success: true, data: { variants } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const calibrateDifficulty = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) { res.status(400).json({ success: false, error: 'No file provided' }); return; }
    let content = '';
    try {
      content = req.file.mimetype === 'application/pdf'
        ? (await pdfParse(req.file.buffer)).text
        : req.file.buffer.toString('utf-8');
    } catch { res.status(400).json({ success: false, error: 'Could not parse file' }); return; }
    const result = await calibrateDifficultyFromPaper(content);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    await AssignmentModel.findByIdAndDelete(req.params.id);
    await cacheDel(`assignment:${req.params.id}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, input } = req.body;
    if (!name?.trim()) { res.status(400).json({ success: false, error: 'Name required' }); return; }
    const template = await TemplateModel.create({ name, input });
    res.status(201).json({ success: true, data: template });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const listTemplates = async (_req: Request, res: Response): Promise<void> => {
  try {
    const templates = await TemplateModel.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: templates });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    await TemplateModel.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};