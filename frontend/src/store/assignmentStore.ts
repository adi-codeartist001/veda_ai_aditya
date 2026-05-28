import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { AssignmentFormData, GeneratedPaper, JobStatus, QuestionType, Template } from '../types';

interface GenerationState {
  jobId: string | null;
  assignmentId: string | null;
  shareToken: string | null;
  status: JobStatus | null;
  progress: number;
  message: string;
  result: GeneratedPaper | null;
  error: string | null;
}

interface AssignmentStore {
  formData: AssignmentFormData;
  updateFormData: (d: Partial<AssignmentFormData>) => void;
  resetFormData: () => void;
  generation: GenerationState;
  setGenerationStatus: (s: Partial<GenerationState>) => void;
  resetGeneration: () => void;
  wsConnected: boolean;
  setWsConnected: (c: boolean) => void;
  templates: Template[];
  setTemplates: (t: Template[]) => void;
  addTemplate: (t: Template) => void;
  removeTemplate: (id: string) => void;
}

const defaultForm: AssignmentFormData = {
  title: '',
  subject: '',
  gradeLevel: '',
  schoolName: '',
  dueDate: '',
  questionTypes: [{ type: 'mcq' as QuestionType, count: 5, marksPerQuestion: 1 }],
  difficultyDistribution: { easy: 33, medium: 34, hard: 33 },
  additionalInstructions: '',
  language: 'english',
  file: null,
};

const defaultGen: GenerationState = {
  jobId: null, assignmentId: null, shareToken: null,
  status: null, progress: 0, message: '', result: null, error: null,
};

export const useAssignmentStore = create<AssignmentStore>()(
  devtools(
    persist(
      (set) => ({
        formData: defaultForm,
        updateFormData: (d) => set(s => ({ formData: { ...s.formData, ...d } })),
        resetFormData: () => set({ formData: defaultForm }),
        generation: defaultGen,
        setGenerationStatus: (s) => set(st => ({ generation: { ...st.generation, ...s } })),
        resetGeneration: () => set({ generation: defaultGen }),
        wsConnected: false,
        setWsConnected: (c) => set({ wsConnected: c }),
        templates: [],
        setTemplates: (t) => set({ templates: t }),
        addTemplate: (t) => set(s => ({ templates: [t, ...s.templates] })),
        removeTemplate: (id) => set(s => ({ templates: s.templates.filter(t => t._id !== id) })),
      }),
      { name: 'vedaai-store', partialize: (s) => ({ templates: s.templates }) }
    )
  )
);
