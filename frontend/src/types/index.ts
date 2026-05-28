export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'mcq' | 'short_answer' | 'long_answer' | 'true_false' | 'fill_blank' | 'numerical' | 'diagram';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
export type Language = 'english' | 'hindi' | 'hinglish';

export interface QuestionTypeConfig { type: QuestionType; count: number; marksPerQuestion: number; }
export interface AssignmentFormData {
  title: string; subject: string; gradeLevel: string; schoolName?: string;
  dueDate: string; questionTypes: QuestionTypeConfig[];
  difficultyDistribution: { easy: number; medium: number; hard: number; };
  additionalInstructions: string; language: Language; file?: File | null;
}

export interface Question {
  id: string; text: string; type: QuestionType; difficulty: Difficulty;
  bloom: BloomLevel; marks: number; options?: string[]; answer?: string; topic?: string;
}

export interface Section { id: string; title: string; instruction: string; questions: Question[]; totalMarks: number; }

export interface TopicGap { topic: string; questionsCount: number; suggestion: string; }

export interface GeneratedPaper {
  title: string; subject: string; gradeLevel: string; schoolName?: string;
  totalMarks: number; duration: string; sections: Section[];
  topicGaps: TopicGap[]; bloomDistribution: Record<BloomLevel, number>;
  generatedAt: string; language: Language;
}

export interface PaperVariant { variant: 'A' | 'B'; sections: Section[]; }

export interface Assignment {
  _id: string; input: AssignmentFormData & { totalMarks?: number };
  status: JobStatus; jobId?: string; result?: GeneratedPaper;
  variants?: PaperVariant[]; shareToken?: string;
  error?: string; createdAt: string; updatedAt: string;
}

export interface Template { _id: string; name: string; input: Partial<AssignmentFormData>; createdAt: string; }

export interface WSMessage {
  type: 'JOB_STATUS' | 'JOB_PROGRESS' | 'JOB_COMPLETE' | 'JOB_ERROR';
  jobId: string; assignmentId?: string; status?: JobStatus;
  progress?: number; message?: string; result?: GeneratedPaper; error?: string;
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mcq: 'Multiple Choice Questions', short_answer: 'Short Questions',
  long_answer: 'Long Answer Questions', true_false: 'True / False',
  fill_blank: 'Fill in the Blank', numerical: 'Numerical Problems',
  diagram: 'Diagram / Graph Based',
};

export const BLOOM_COLORS: Record<BloomLevel, string> = {
  remember: 'bloom-remember', understand: 'bloom-understand', apply: 'bloom-apply',
  analyze: 'bloom-analyze', evaluate: 'bloom-evaluate', create: 'bloom-create',
};

export const DIFF_COLORS: Record<Difficulty, string> = {
  easy: 'diff-easy', medium: 'diff-medium', hard: 'diff-hard',
};

export const GRADE_LEVELS = [
  'Grade 1–5 (Primary)', 'Grade 6–8 (Middle School)',
  'Grade 9–10 (Secondary)', 'Grade 11–12 (Senior Secondary)',
  'Undergraduate', 'Postgraduate', 'Professional',
];
