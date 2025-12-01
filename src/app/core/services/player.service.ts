import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Player, PlayerResponse, PlayersListResponse, PlayerStatsResponse } from '../models/player';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  constructor(private http: HttpClient) {}

  createPlayer(name: string, age: number): Observable<PlayerResponse> {
    const body = { name, age };
    return this.http.post<PlayerResponse>(
      `${environment.apiBaseUrl}${environment.apiEndpoints.players.create}`,
      body
    );
  }

  listPlayers(): Observable<PlayersListResponse> {
    return this.http.get<PlayersListResponse>(
      `${environment.apiBaseUrl}${environment.apiEndpoints.players.list}`
    );
  }

  getPlayerStats(playerId: number): Observable<PlayerStatsResponse> {
    return this.http.get<PlayerStatsResponse>(
      `${environment.apiBaseUrl}${environment.apiEndpoints.stats.playerStats(playerId)}`
    );
  }
}
