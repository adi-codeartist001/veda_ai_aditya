export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'mcq' | 'short_answer' | 'long_answer' | 'true_false' | 'fill_blank' | 'numerical' | 'diagram';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
export type Language = 'english' | 'hindi' | 'hinglish';

export interface QuestionTypeConfig {
  type: QuestionType;
  count: number;
  marksPerQuestion: number;
}

export interface AssignmentInput {
  title: string;
  subject: string;
  gradeLevel: string;
  schoolName?: string;
  dueDate: string;
  questionTypes: QuestionTypeConfig[];
  difficultyDistribution: { easy: number; medium: number; hard: number };
  additionalInstructions?: string;
  fileContent?: string;
  totalMarks?: number;
  language?: Language;
  templateId?: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  difficulty: Difficulty;
  bloom: BloomLevel;
  marks: number;
  options?: string[];
  answer?: string;
  topic?: string;
}

export interface Section {
  id: string;
  title: string;
  instruction: string;
  questions: Question[];
  totalMarks: number;
}

export interface TopicGap {
  topic: string;
  questionsCount: number;
  suggestion: string;
}

export interface GeneratedPaper {
  title: string;
  subject: string;
  gradeLevel: string;
  schoolName?: string;
  totalMarks: number;
  duration: string;
  sections: Section[];
  topicGaps: TopicGap[];
  bloomDistribution: Record<BloomLevel, number>;
  generatedAt: string;
  language: Language;
}

export interface PaperVariant {
  variant: 'A' | 'B';
  sections: Section[];
}

export interface Assignment {
  _id?: string;
  input: AssignmentInput;
  status: JobStatus;
  jobId?: string;
  result?: GeneratedPaper;
  variants?: PaperVariant[];
  shareToken?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  _id?: string;
  name: string;
  input: Omit<AssignmentInput, 'title' | 'dueDate' | 'fileContent'>;
  createdAt: string;
}

export interface WSMessage {
  type: 'JOB_STATUS' | 'JOB_PROGRESS' | 'JOB_COMPLETE' | 'JOB_ERROR';
  jobId: string;
  assignmentId?: string;
  status?: JobStatus;
  progress?: number;
  message?: string;
  result?: GeneratedPaper;
  error?: string;
}
