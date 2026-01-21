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

/**
 * Session data for a player
 */
export interface PlayerSession {
  session_id: number;
  score: number;
  status: string;
  difficulty: number;
  started_at: string;
  ended_at: string | null;
  room: {
    name: string;
    code: string;
  } | null;
  stats: {
    total_answers: number;
    correct_answers: number;
    incorrect_answers: number;
    accuracy: number;
  };
}

/**
 * Response from GET /stats/player/{id}/sessions
 */
export interface PlayerSessionsResponse {
  ok: boolean;
  player_id?: number;
  player_name?: string;
  sessions?: PlayerSession[];
  error?: string;
}

/**
 * Streak data for a player
 */
export interface PlayerStreaks {
  current: number;
  max: number;
  is_on_streak: boolean;
}

/**
 * Response from GET /stats/player/{id}/streaks
 */
export interface PlayerStreaksResponse {
  ok: boolean;
  player_id?: number;
  player_name?: string;
  streaks?: PlayerStreaks;
  stats?: {
    total_answers: number;
    correct_answers: number;
    accuracy: number;
  };
  error?: string;
}

/**
 * Session streak data
 */
export interface SessionStreaks {
  max: number;
  final: number;
  all_streaks: number[];
  streak_count: number;
}

/**
 * Response from GET /stats/session/{id}/streaks
 */
export interface SessionStreaksResponse {
  ok: boolean;
  session_id?: number;
  player_id?: number;
  player_name?: string;
  streaks?: SessionStreaks;
  stats?: {
    total_answers: number;
    correct_answers: number;
    accuracy: number;
  };
  error?: string;
}
