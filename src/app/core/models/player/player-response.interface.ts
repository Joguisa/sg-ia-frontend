import { Player } from './player.interface';

export interface PlayerResponse {
  ok: boolean;
  player?: Player;
  error?: string;
}

export interface PlayersListResponse {
  ok: boolean;
  players?: Player[];
  error?: string;
}
