export interface AnswerRequest {
  question_id: number;
  is_correct: boolean;
  time_taken: number;
  selected_option_id?: number;
}

export interface AnswerResponse {
  ok: boolean;
  score?: number;
  lives?: number;
  currentDifficulty?: number;
  error?: string;
}
