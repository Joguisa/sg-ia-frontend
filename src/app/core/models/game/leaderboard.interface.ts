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

export interface LeaderboardResponse {
  ok: boolean;
  leaderboard?: LeaderboardEntry[];
  error?: string;
}
