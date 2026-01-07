import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SessionResponse,
  QuestionResponse,
  AnswerRequest,
  AnswerResponse,
  LeaderboardResponse,
  SessionStatsResponse
} from '../models/game';
import {
  GameSession,
  QuestionFullResponse,
  AnswerSubmitResponse
} from '../models/game/game-flow.interface';

/**
 * GameService
 *
 * Servicio para gestionar sesiones de juego, preguntas y respuestas.
 * NO requiere autenticación JWT (endpoints públicos).
 *
 * @see GameController Backend controller for API contract
 * @see StatisticsController Backend controller for stats endpoints
 */
@Injectable({
  providedIn: 'root'
})
export class GameService {
  private readonly apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = environment.apiBaseUrl;
  }

  /**
   * Inicia una nueva sesión de juego para un jugador
   *
   * Backend: POST /games/start
   * @param playerId ID del jugador (debe existir en DB)
   * @param startDifficulty Dificultad inicial (default: 1.0)
   * @param roomCode Código de sala opcional (6 caracteres)
   * @returns Observable con session_id, current_difficulty y datos de sala si aplica
   */
  startSession(playerId: number, startDifficulty: number = 1.0, roomCode?: string): Observable<GameSession> {
    const body: any = {
      player_id: playerId,
      start_difficulty: startDifficulty
    };

    // Agregar room_code solo si se proporciona
    if (roomCode && roomCode.trim()) {
      body.room_code = roomCode.trim().toUpperCase();
    }

    return this.http.post<GameSession>(
      `${this.apiUrl}${environment.apiEndpoints.games.start}`,
      body
    );
  }

  /**
   * Obtiene la siguiente pregunta con todas sus opciones
   * Por defecto busca preguntas de TODAS las categorías mezcladas
   *
   * Backend: GET /games/next?difficulty={float}&session_id={id}
   * Excluye preguntas ya respondidas en la sesión actual
   * @param sessionId ID de la sesión activa
   * @param difficulty Nivel de dificultad (se redondea al entero más cercano en backend)
   * @param categoryId ID de categoría (0 = todas las categorías, default: 0)
   * @returns Observable con pregunta completa y opciones de respuesta
   */
  getNextQuestion(
    sessionId: number,
    difficulty: number,
    categoryId: number = 0
  ): Observable<QuestionFullResponse> {
    // Solo incluir category_id en params si es mayor a 0 (para filtrar por categoría específica)
    const categoryParam = categoryId > 0 ? `category_id=${categoryId}&` : '';
    const params = `${categoryParam}difficulty=${difficulty}&session_id=${sessionId}`;
    return this.http.get<QuestionFullResponse>(
      `${this.apiUrl}${environment.apiEndpoints.games.next}?${params}`
    );
  }

  /**
   * Envía la respuesta del jugador y recibe feedback educativo
   *
   * Backend: POST /games/{sessionId}/answer
   * SEGURIDAD: No envía is_correct, el backend lo calcula en base a selected_option_id
   * @param sessionId ID de la sesión activa
   * @param questionId ID de la pregunta respondida
   * @param selectedOptionId ID de opción seleccionada (null si timeout)
   * @param timeTaken Tiempo tomado en segundos
   * @returns Observable con feedback, score actualizado, vidas restantes y dificultad adaptativa
   */
  submitAnswer(
    sessionId: number,
    questionId: number,
    selectedOptionId: number | null,
    timeTaken: number
  ): Observable<AnswerSubmitResponse> {
    const body = {
      question_id: questionId,
      time_taken: timeTaken,
      selected_option_id: selectedOptionId
    };
    return this.http.post<AnswerSubmitResponse>(
      `${this.apiUrl}${environment.apiEndpoints.games.answer(sessionId)}`,
      body
    );
  }

  /**
   * Obtiene estadísticas de una sesión específica
   *
   * Backend: GET /stats/session/{id}
   * @param sessionId ID de la sesión
   * @returns Observable con estadísticas de la sesión
   */
  getSessionStats(sessionId: number): Observable<SessionStatsResponse> {
    return this.http.get<SessionStatsResponse>(
      `${this.apiUrl}${environment.apiEndpoints.stats.session(sessionId)}`
    );
  }

  /**
   * Obtiene el top 10 de jugadores (leaderboard)
   *
   * Backend: GET /stats/leaderboard
   * @returns Observable con ranking de jugadores por high_score
   */
  getLeaderboard(): Observable<LeaderboardResponse> {
    return this.http.get<LeaderboardResponse>(
      `${this.apiUrl}${environment.apiEndpoints.stats.leaderboard}`
    );
  }
}
