import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Player, PlayerResponse, PlayersListResponse, PlayerStatsResponse } from '../models/player';

/**
 * PlayerService
 *
 * Servicio para gestionar jugadores y sus estadísticas.
 * NO requiere autenticación JWT (endpoints públicos).
 *
 * @see PlayerController Backend controller for player operations
 * @see StatisticsController Backend controller for player stats
 */
@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private readonly apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = environment.apiBaseUrl;
  }

  /**
   * Crea un nuevo jugador
   *
   * Backend: POST /players
   * @param name Nombre del jugador (trimmed)
   * @param age Edad del jugador (1-120)
   * @returns Observable con datos del jugador creado (id, name, age)
   */
  createPlayer(name: string, age: number): Observable<PlayerResponse> {
    const body = { name, age };
    return this.http.post<PlayerResponse>(
      `${this.apiUrl}${environment.apiEndpoints.players.create}`,
      body
    );
  }

  /**
   * Lista todos los jugadores registrados
   *
   * Backend: GET /players
   * @returns Observable con array de jugadores (id, name, age, created_at)
   */
  listPlayers(): Observable<PlayersListResponse> {
    return this.http.get<PlayersListResponse>(
      `${this.apiUrl}${environment.apiEndpoints.players.list}`
    );
  }

  /**
   * Obtiene estadísticas globales de un jugador
   *
   * Backend: GET /stats/player/{id}
   * Incluye: total_games, high_score, total_score, avg_difficulty,
   * estadísticas por categoría (accuracy, avg_time_sec)
   * @param playerId ID del jugador
   * @returns Observable con estadísticas completas del jugador
   */
  getPlayerStats(playerId: number): Observable<PlayerStatsResponse> {
    return this.http.get<PlayerStatsResponse>(
      `${this.apiUrl}${environment.apiEndpoints.stats.playerStats(playerId)}`
    );
  }
}
