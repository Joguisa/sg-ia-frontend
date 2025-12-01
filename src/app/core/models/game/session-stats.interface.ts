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
