export interface Question {
  id: number;
  statement: string;
  difficulty: number;
  category_id: number;
  is_ai_generated?: boolean;
  admin_verified?: boolean;
  batch_id?: number;
  language?: 'es' | 'en';
  is_active?: boolean | number;
}

export interface QuestionResponse {
  ok: boolean;
  question?: Question;
  error?: string;
}

export interface QuestionsResponse {
  ok: boolean;
  questions: Question[];
  error?: string;
}