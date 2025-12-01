export interface GameSession {
  id: number;
  playerId: number;
  currentDifficulty: number;
  status: 'active' | 'finished';
  score: number;
  lives: number;
}

export interface SessionResponse {
  ok: boolean;
  id?: number;
  playerId?: number;
  currentDifficulty?: number;
  status?: string;
  score?: number;
  lives?: number;
  error?: string;
}
