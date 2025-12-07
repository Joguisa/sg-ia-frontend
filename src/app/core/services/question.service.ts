import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { QuestionResponse } from '../models/game';

/**
 * QuestionService
 *
 * Servicio para operaciones con preguntas individuales.
 * NO requiere autenticación JWT (endpoints públicos).
 *
 * @see QuestionController Backend controller for API contract
 */
@Injectable({
  providedIn: 'root'
})
export class QuestionService {
  private readonly apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = environment.apiBaseUrl;
  }

  /**
   * Obtiene una pregunta específica por ID
   *
   * Backend: GET /questions/{id}
   * @param id ID de la pregunta
   * @returns Observable con datos de la pregunta (id, statement, difficulty, category_id)
   */
  getQuestion(id: number): Observable<QuestionResponse> {
    return this.http.get<QuestionResponse>(
      `${this.apiUrl}${environment.apiEndpoints.questions.find(id)}`
    );
  }
}
