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

@Injectable({
  providedIn: 'root'
})
export class GameService {
  constructor(private http: HttpClient) {}

  startSession(playerId: number, startDifficulty?: number): Observable<SessionResponse> {
    const body = {
      player_id: playerId,
      ...(startDifficulty !== undefined && { start_difficulty: startDifficulty })
    };
    return this.http.post<SessionResponse>(
      `${environment.apiBaseUrl}${environment.apiEndpoints.games.start}`,
      body
    );
  }

  getNextQuestion(categoryId: number, difficulty: number): Observable<QuestionResponse> {
    const params = `category_id=${categoryId}&difficulty=${difficulty}`;
    return this.http.get<QuestionResponse>(
      `${environment.apiBaseUrl}${environment.apiEndpoints.games.next}?${params}`
    );
  }

  submitAnswer(
    sessionId: number,
    answerData: AnswerRequest
  ): Observable<AnswerResponse> {
    return this.http.post<AnswerResponse>(
      `${environment.apiBaseUrl}${environment.apiEndpoints.games.answer(sessionId)}`,
      answerData
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
