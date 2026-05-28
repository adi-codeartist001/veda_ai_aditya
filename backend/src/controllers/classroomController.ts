import { Request, Response } from 'express';
import { generateClassroomResponse, STUDENT_NAMES, ARCHETYPES, StudentPersona } from '../services/classroomService';
import { v4 as uuidv4 } from 'uuid';

export const startSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subject, topic, studentCount = 25, language = 'hinglish' } = req.body;
    if (!subject || !topic) { res.status(400).json({ success: false, error: 'Subject and topic required' }); return; }

    const students: StudentPersona[] = Array.from({ length: Math.min(studentCount, 30) }, (_, i) => ({
      id: `s${i + 1}`,
      name: STUDENT_NAMES[i] || `Student ${i + 1}`,
      archetype: ARCHETYPES[i % ARCHETYPES.length],
      row: Math.floor(i / 5),
      col: i % 5,
      expression: 'neutral' as const,
      engagementScore: 60 + Math.floor(Math.random() * 30),
    }));

    res.json({ success: true, data: { sessionId: uuidv4(), students, subject, topic, language } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const teachMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, subject, topic, students, conversationHistory = [], language = 'hinglish' } = req.body;
    if (!message) { res.status(400).json({ success: false, error: 'Message required' }); return; }

    const result = await generateClassroomResponse(message, subject, topic, students, conversationHistory, language);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
