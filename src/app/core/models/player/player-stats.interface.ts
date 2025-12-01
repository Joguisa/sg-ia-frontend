export interface PlayerGlobalStats {
  total_games: number;
  high_score: number;
  total_score: number;
  avg_score: number;
  avg_difficulty: number;
}

export interface PlayerTopicStats {
  category_id: number;
  category_name: string;
  answers: number;
  accuracy: number;
  avg_time_sec: number;
}

export interface PlayerStatsResponse {
  ok: boolean;
  player_id?: number;
  global?: PlayerGlobalStats;
  topics?: PlayerTopicStats[];
  error?: string;
}
