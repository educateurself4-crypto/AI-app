
export enum AppTab {
  DASHBOARD = 'DASHBOARD',
  QUIZ = 'QUIZ',
  CURRENT_AFFAIRS = 'CURRENT_AFFAIRS',
  IMAGE_ANALYZE = 'IMAGE_ANALYZE',
  SYLLABUS = 'SYLLABUS',
  WORKFLOW = 'WORKFLOW'
}

export interface GroundingSource {
  title?: string;
  uri?: string;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  sources?: GroundingSource[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  isLive?: boolean;
  publishedDate?: string;
}

export interface WorkflowConfig {
  webhookUrl: string;
  lastSuccessfulSync: string | null;
  isAutoSync: boolean;
}
