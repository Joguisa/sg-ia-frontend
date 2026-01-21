import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Player, PlayerResponse, PlayersListResponse, PlayerStatsResponse, PlayerStreaksResponse, SessionStreaksResponse, PlayerSessionsResponse } from '../models/player';
import { SessionAnswersResponse } from '../models/game/session-stats.interface';

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

  /**
   * Obtiene las rachas (streaks) de un jugador
   *
   * Backend: GET /stats/player/{id}/streaks
   * Incluye: racha actual, racha máxima, estadísticas
   * @param playerId ID del jugador
   * @returns Observable con rachas del jugador
   */
  getPlayerStreaks(playerId: number): Observable<PlayerStreaksResponse> {
    return this.http.get<PlayerStreaksResponse>(
      `${this.apiUrl}${environment.apiEndpoints.stats.playerStreaks(playerId)}`
    );
  }

  /**
   * Obtiene las rachas (streaks) de una sesión
   *
   * Backend: GET /stats/session/{id}/streaks
   * Incluye: racha máxima de la sesión, racha final, todas las rachas
   * @param sessionId ID de la sesión
   * @returns Observable con rachas de la sesión
   */
  getSessionStreaks(sessionId: number): Observable<SessionStreaksResponse> {
    return this.http.get<SessionStreaksResponse>(
      `${this.apiUrl}${environment.apiEndpoints.stats.sessionStreaks(sessionId)}`
    );
  }

  /**
   * Obtiene el historial de respuestas de una sesión
   *
   * Backend: GET /stats/session/{id}/answers
   * Incluye: pregunta, opciones, respuesta seleccionada, respuesta correcta, explicación
   * @param sessionId ID de la sesión
   * @param errorsOnly Si true, solo devuelve respuestas incorrectas
   * @returns Observable con historial de respuestas
   */
  getSessionAnswers(sessionId: number, errorsOnly: boolean = false): Observable<SessionAnswersResponse> {
    const url = errorsOnly
      ? `${this.apiUrl}${environment.apiEndpoints.stats.sessionAnswers(sessionId)}?errors_only=1`
      : `${this.apiUrl}${environment.apiEndpoints.stats.sessionAnswers(sessionId)}`;
    return this.http.get<SessionAnswersResponse>(url);
  }

  /**
   * Obtiene las sesiones recientes de un jugador
   *
   * Backend: GET /stats/player/{id}/sessions
   * Incluye: lista de sesiones con score, status, dificultad, estadísticas
   * @param playerId ID del jugador
   * @param limit Número máximo de sesiones (default: 10)
   * @returns Observable con sesiones del jugador
   */
  getPlayerSessions(playerId: number, limit: number = 10): Observable<PlayerSessionsResponse> {
    return this.http.get<PlayerSessionsResponse>(
      `${this.apiUrl}${environment.apiEndpoints.stats.playerSessions(playerId)}?limit=${limit}`
    );
  }
}
