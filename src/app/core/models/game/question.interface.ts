export interface Question {
  id: number;
  statement: string;
  difficulty: number;
  category_id: number;
  is_ai_generated?: boolean;
  admin_verified?: boolean;
}

export interface QuestionResponse {
  ok: boolean;
  question?: Question;
  error?: string;
}
