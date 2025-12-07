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

@Injectable({
  providedIn: 'root'
})
export class GameService {
  constructor(private http: HttpClient) {}

  /**
   * Inicia una nueva sesión de juego
   */
  startSession(playerId: number, startDifficulty: number = 1.0): Observable<GameSession> {
    const body = {
      player_id: playerId,
      start_difficulty: startDifficulty
    };
    return this.http.post<GameSession>(
      `${environment.apiBaseUrl}${environment.apiEndpoints.games.start}`,
      body
    );
  }

  /**
   * Obtiene la siguiente pregunta con todas sus opciones
   * Excluye preguntas ya respondidas en la sesión actual
   */
  getNextQuestion(
    sessionId: number,
    difficulty: number,
    categoryId: number = 1
  ): Observable<QuestionFullResponse> {
    const params = `category_id=${categoryId}&difficulty=${difficulty}&session_id=${sessionId}`;
    return this.http.get<QuestionFullResponse>(
      `${environment.apiBaseUrl}${environment.apiEndpoints.games.next}?${params}`
    );
  }

  /**
   * Envía la respuesta del jugador y recibe feedback educativo
   * SEGURIDAD: No envía is_correct, el backend lo calcula
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
      `${environment.apiBaseUrl}${environment.apiEndpoints.games.answer(sessionId)}`,
      body
    );
  }

  getSessionStats(sessionId: number): Observable<SessionStatsResponse> {
    return this.http.get<SessionStatsResponse>(
      `${environment.apiBaseUrl}${environment.apiEndpoints.stats.session(sessionId)}`
    );
  }

  getLeaderboard(): Observable<LeaderboardResponse> {
    return this.http.get<LeaderboardResponse>(
      `${environment.apiBaseUrl}${environment.apiEndpoints.stats.leaderboard}`
    );
  }
}
