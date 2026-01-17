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
  progress?: {
    total_answered: number;
    max_questions: number;
    locked_levels: number[];
  };
}

export interface QuestionFullResponse {
  ok: boolean;
  question?: QuestionFull;
  completed?: boolean;
  message?: string;
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

/**
 * Datos de sala retornados al iniciar sesión con room_code
 */
export interface SessionRoomData {
  id: number;
  room_code: string;
  name: string;
  filter_categories?: number[] | null;
  filter_difficulties?: number[] | null;
}

export interface GameSession {
  ok?: boolean;
  session_id: number;
  current_difficulty: number;
  status: 'active' | 'game_over' | 'completed' | string;
  score?: number;
  lives?: number;
  room?: SessionRoomData;
  error?: string;
}

/**
 * States for the game UI component
 */
export type GameState = 'loading' | 'playing' | 'feedback' | 'gameover' | 'completed' | 'no_questions';
