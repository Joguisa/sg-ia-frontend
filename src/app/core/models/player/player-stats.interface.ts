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

/**
 * Response from GET /api/player/{id}/stats
 */
export interface PlayerStatsResponse {
  ok: boolean;
  player_id?: number;
  global?: PlayerGlobalStats;
  topics?: PlayerTopicStats[];
  error?: string;
}

/**
 * Alias for compatibility with PlayerProfileComponent
 * @deprecated Use PlayerStatsResponse instead
 */
export interface PlayerProfileResponse extends PlayerStatsResponse {}

/**
 * Entry for leaderboard ranking
 */
export interface LeaderboardEntry {
  rank: number;
  player_id: number;
  player_name: string;
  age: number;
  high_score: number;
  total_games: number;
  total_score: number;
  overall_accuracy: number;
}

/**
 * Response from GET /api/stats/leaderboard
 */
export interface LeaderboardResponse {
  ok: boolean;
  leaderboard?: LeaderboardEntry[];
  error?: string;
}
