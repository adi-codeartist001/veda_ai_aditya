import Groq from 'groq-sdk';
import { AssignmentInput, GeneratedPaper, Section, Question, QuestionType, Difficulty, BloomLevel, Language, TopicGap } from '../types';
import { v4 as uuidv4 } from 'uuid';

function getGroqClient() {
  return new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

const LANGUAGE_INSTRUCTIONS: Record<Language, string> = {
  english: 'Write all questions in English.',
  hindi: 'Write all questions in Hindi (Devanagari script).',
  hinglish: 'Write all questions in Hinglish (mix of Hindi and English, Roman script).',
};

function buildPrompt(input: AssignmentInput): string {
  const questionSummary = input.questionTypes
    .map(qt => `  - ${qt.count} ${qt.type.replace('_', ' ')} questions (${qt.marksPerQuestion} marks each)`)
    .join('\n');
  const totalMarks = input.questionTypes.reduce((s, qt) => s + qt.count * qt.marksPerQuestion, 0);
  const lang = input.language || 'english';

  return `You are an expert educator. Generate a complete structured question paper as a single valid JSON object.

SPECS:
- Title: ${input.title}
- Subject: ${input.subject}
- Grade: ${input.gradeLevel}
- School: ${input.schoolName || 'Not specified'}
- Total Marks: ${totalMarks}
- Language: ${LANGUAGE_INSTRUCTIONS[lang]}

QUESTION TYPES REQUIRED:
${questionSummary}

DIFFICULTY: Easy ${input.difficultyDistribution.easy}% | Medium ${input.difficultyDistribution.medium}% | Hard ${input.difficultyDistribution.hard}%

${input.additionalInstructions ? `TEACHER INSTRUCTIONS: ${input.additionalInstructions}` : ''}
${input.fileContent ? `REFERENCE MATERIAL (generate questions from this):\n${input.fileContent.substring(0, 2500)}` : ''}

OUTPUT FORMAT - respond ONLY with this JSON, nothing else, no markdown:
{
  "title": "string",
  "subject": "string",
  "gradeLevel": "string",
  "schoolName": "string",
  "totalMarks": number,
  "duration": "string e.g. 3 Hours",
  "language": "${lang}",
  "topicGaps": [{"topic": "string", "questionsCount": number, "suggestion": "string"}],
  "bloomDistribution": {"remember": number, "understand": number, "apply": number, "analyze": number, "evaluate": number, "create": number},
  "sections": [
    {
      "id": "section-a",
      "title": "Section A",
      "instruction": "Attempt all questions",
      "totalMarks": number,
      "questions": [
        {
          "id": "q1",
          "text": "question text",
          "type": "mcq|short_answer|long_answer|true_false|fill_blank|numerical|diagram",
          "difficulty": "easy|medium|hard",
          "bloom": "remember|understand|apply|analyze|evaluate|create",
          "marks": number,
          "topic": "topic name",
          "options": ["A. option1","B. option2","C. option3","D. option4"],
          "answer": "correct answer"
        }
      ]
    }
  ],
  "generatedAt": "${new Date().toISOString()}"
}

RULES:
- Group by question type into sections (Section A = MCQ, Section B = Short Answer, etc.)
- MCQ must always have 4 options array
- Include bloom taxonomy level for every question
- Include topic field for every question
- topicGaps should identify any syllabus areas not covered
- bloomDistribution should show % of each level used
- answers must be included for all questions
- Make questions specific, curriculum-appropriate, and educationally rigorous`;
}

export async function calibrateDifficultyFromPaper(fileContent: string): Promise<{ easy: number; medium: number; hard: number; analysis: string }> {
  const prompt = `Analyze this question paper and classify each question as easy, medium, or hard based on cognitive complexity, then return the percentage distribution.

Paper content:
${fileContent.substring(0, 3000)}

Respond ONLY with valid JSON, no markdown:
{
  "easy": number (percentage 0-100),
  "medium": number (percentage 0-100),
  "hard": number (percentage 0-100),
  "analysis": "brief explanation of your calibration"
}`;

  const response = await getGroqClient().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 300,
    temperature: 0.3,
  });

  const text = response.choices[0]?.message?.content || '';
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateVariantB(sections: Section[]): Section[] {
  return sections.map(section => ({
    ...section,
    questions: shuffleArray(section.questions).map(q => ({
      ...q,
      id: uuidv4(),
      options: q.options ? shuffleArray(q.options) : undefined,
    })),
  }));
}

function validateDifficulty(d: string): Difficulty {
  return (['easy', 'medium', 'hard'] as Difficulty[]).includes(d as Difficulty) ? d as Difficulty : 'medium';
}

function validateQuestionType(t: string): QuestionType {
  const valid: QuestionType[] = ['mcq', 'short_answer', 'long_answer', 'true_false', 'fill_blank', 'numerical', 'diagram'];
  return valid.includes(t as QuestionType) ? t as QuestionType : 'short_answer';
}

function validateBloom(b: string): BloomLevel {
  const valid: BloomLevel[] = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
  return valid.includes(b as BloomLevel) ? b as BloomLevel : 'understand';
}

function parseAIResponse(raw: string): GeneratedPaper {
  let cleaned = raw.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1) cleaned = cleaned.slice(start, end + 1);

  const parsed: GeneratedPaper = JSON.parse(cleaned);

  parsed.sections = (parsed.sections || []).map((section: Section, si: number) => ({
    ...section,
    id: section.id || `section-${si + 1}`,
    questions: (section.questions || []).map((q: Question, qi: number) => ({
      ...q,
      id: q.id || uuidv4(),
      difficulty: validateDifficulty(q.difficulty),
      type: validateQuestionType(q.type),
      bloom: validateBloom(q.bloom),
      marks: Number(q.marks) || 1,
      topic: q.topic || 'General',
    })),
    totalMarks: (section.questions || []).reduce((s: number, q: Question) => s + (Number(q.marks) || 1), 0),
  }));

  parsed.totalMarks = parsed.sections.reduce((s, sec) => s + sec.totalMarks, 0);
  parsed.topicGaps = parsed.topicGaps || [];
  parsed.bloomDistribution = parsed.bloomDistribution || {} as Record<BloomLevel, number>;
  parsed.language = parsed.language || 'english';
  parsed.generatedAt = new Date().toISOString();

  return parsed;
}

export async function generateAssessment(
  input: AssignmentInput,
  onProgress?: (progress: number, message: string) => void
): Promise<GeneratedPaper> {
  onProgress?.(10, 'Building assessment prompt...');
  const prompt = buildPrompt(input);
  onProgress?.(20, 'AI is crafting your question paper...');

  const response = await getGroqClient().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 4096,
    temperature: 0.7,
  });

  onProgress?.(80, 'Parsing and structuring paper...');
  const raw = response.choices[0]?.message?.content || '';
  const paper = parseAIResponse(raw);
  onProgress?.(95, 'Finalizing assessment...');
  return paper;
}
