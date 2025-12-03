export interface DashboardSummary {
  total_players: number;
  total_sessions: number;
  total_questions: number;
  pending_verification: number;
}

export interface QuestionDifficulty {
  id: number;
  statement: string;
  difficulty: number;
  category_name: string;
  times_answered: number;
  success_rate: number;
}

export interface DashboardStatsResponse {
  ok: boolean;
  summary?: DashboardSummary;
  hardest_questions?: QuestionDifficulty[];
  easiest_questions?: QuestionDifficulty[];
  error?: string;
}

