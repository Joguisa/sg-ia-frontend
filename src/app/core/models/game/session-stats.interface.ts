export interface SessionStats {
  session_id: number;
  player_id: number;
  score: number;
  accuracy: number;
  avg_time_sec: number;
  [key: string]: any;
}

export interface SessionStatsResponse {
  ok: boolean;
  stats?: SessionStats;
  error?: string;
}

/**
 * Option for a question in session answers
 */
export interface SessionAnswerOption {
  id: number;
  text: string;
  is_correct: boolean;
}

/**
 * Question details in session answer
 */
export interface SessionAnswerQuestion {
  id: number;
  statement: string;
  difficulty: number;
  category: string;
  options: SessionAnswerOption[];
}

/**
 * Selected/Correct option in session answer
 */
export interface SessionAnswerSelectedOption {
  id: number | null;
  text: string | null;
}

/**
 * Single answer in session history
 */
export interface SessionAnswer {
  answer_id: number;
  answered_at: string;
  is_correct: boolean;
  time_to_answer: number | null;
  question: SessionAnswerQuestion;
  selected_option: SessionAnswerSelectedOption;
  correct_option: SessionAnswerSelectedOption;
  explanation: string | null;
}

/**
 * Summary statistics for session answers
 */
export interface SessionAnswersSummary {
  total_answers: number;
  correct: number;
  incorrect: number;
  accuracy: number;
}

/**
 * Response from GET /stats/session/{id}/answers
 */
export interface SessionAnswersResponse {
  ok: boolean;
  session_id?: number;
  player_id?: number;
  score?: number;
  summary?: SessionAnswersSummary;
  filter?: 'all' | 'errors_only';
  answers?: SessionAnswer[];
  error?: string;
}
