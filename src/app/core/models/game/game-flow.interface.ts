export interface QuestionOption {
  id: number;
  text: string;
  is_correct?: boolean;
}

export interface QuestionFull {
  id: number;
  statement: string;
  difficulty: number;
  category_id?: number;
  options?: QuestionOption[];
  is_ai_generated?: boolean;
  admin_verified?: boolean;
}

export interface QuestionFullResponse {
  ok: boolean;
  question?: QuestionFull;
  error?: string;
}

export interface AnswerSubmitResponse {
  ok: boolean;
  is_correct?: boolean;
  score?: number;
  lives?: number;
  status?: 'active' | 'game_over';
  next_difficulty?: number;
  explanation?: string;
  correct_option_id?: number;
  error?: string;
}

export interface GameSession {
  session_id: number;
  current_difficulty: number;
  status: 'active' | 'game_over' | string;
  score?: number;
  lives?: number;
}
