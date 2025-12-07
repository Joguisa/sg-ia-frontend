import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PromptConfigResponse,
  UpdatePromptConfigResponse,
  CategoryResponse,
  CreateCategoryResponse,
  DeleteCategoryResponse,
  DashboardStatsResponse,
  GenerateBatchResponse,
  GetQuestionsResponse,
  GetCategoriesResponse,
  AdminCategory
} from '../models/admin';
import { Question, QuestionResponse, DeleteQuestionResponse } from '../models/game';

/**
 * AdminService
 *
 * Servicio para operaciones administrativas que requieren autenticación JWT.
 * Todas las peticiones son interceptadas por authInterceptor para agregar el token.
 *
 * @see AdminController Backend controller for API contract
 */
@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = environment.apiBaseUrl;
  }

  /**
   * Actualiza el enunciado de una pregunta
   *
   * Backend: PUT /admin/questions/{id}
   * @param questionId ID de la pregunta a actualizar
   * @param statement Nuevo enunciado (10-1000 caracteres)
   * @returns Observable con la respuesta del backend
   */
  updateQuestion(questionId: number, statement: string): Observable<QuestionResponse> {
    const body = { statement };
    return this.http.put<QuestionResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.updateQuestion(questionId)}`,
      body
    );
  }

  /**
   * Marca/desmarca una pregunta como verificada por administrador
   *
   * Backend: PATCH /admin/questions/{id}/verify
   * @param questionId ID de la pregunta
   * @param verified Estado de verificación (true/false)
   * @returns Observable con la respuesta del backend
   */
  verifyQuestion(questionId: number, verified: boolean): Observable<QuestionResponse> {
    const body = { verified };
    return this.http.patch<QuestionResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.verifyQuestion(questionId)}`,
      body
    );
  }

  /**
   * Obtiene la configuración actual del prompt de IA
   *
   * Backend: GET /admin/config/prompt
   * @returns Observable con el prompt activo y temperatura
   */
  getPromptConfig(): Observable<PromptConfigResponse> {
    return this.http.get<PromptConfigResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.getPromptConfig}`
    );
  }

  /**
   * Actualiza la configuración del prompt de IA (Gemini)
   *
   * Backend: PUT /admin/config/prompt
   * @param promptText Texto del prompt del sistema
   * @param temperature Temperatura del modelo (0.0 - 1.0)
   * @returns Observable con confirmación de actualización
   */
  updatePromptConfig(promptText: string, temperature: number): Observable<UpdatePromptConfigResponse> {
    const body = { prompt_text: promptText, temperature };
    return this.http.put<UpdatePromptConfigResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.updatePromptConfig}`,
      body
    );
  }

  /**
   * Crea una nueva categoría de preguntas
   *
   * Backend: POST /admin/categories
   * @param name Nombre de la categoría (requerido)
   * @param description Descripción opcional
   * @returns Observable con el ID de la categoría creada
   */
  createCategory(name: string, description?: string): Observable<CreateCategoryResponse> {
    const body = { name, ...(description && { description }) };
    return this.http.post<CreateCategoryResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.createCategory}`,
      body
    );
  }

  /**
   * Elimina una categoría de preguntas
   *
   * Backend: DELETE /admin/categories/{id}
   * @param categoryId ID de la categoría a eliminar
   * @returns Observable con confirmación de eliminación
   */
  deleteCategory(categoryId: number): Observable<DeleteCategoryResponse> {
    return this.http.delete<DeleteCategoryResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.deleteCategory(categoryId)}`
    );
  }

  /**
   * Genera preguntas en batch usando IA (Gemini)
   *
   * Backend: POST /admin/generate-batch
   * @param quantity Cantidad de preguntas a generar (1-50)
   * @param categoryId ID de la categoría
   * @param difficulty Nivel de dificultad (1-5)
   * @returns Observable con resultado de generación (generadas y fallidas)
   */
  generateBatch(
    quantity: number,
    categoryId: number,
    difficulty: number
  ): Observable<GenerateBatchResponse> {
    const body = { quantity, category_id: categoryId, difficulty };
    return this.http.post<GenerateBatchResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.generateBatch}`,
      body
    );
  }

  /**
   * Obtiene todas las preguntas activas con información de categoría
   *
   * Backend: GET /admin/questions
   * @returns Observable con listado de preguntas
   */
  getQuestions(): Observable<GetQuestionsResponse> {
    return this.http.get<GetQuestionsResponse>(
      `${this.apiUrl}/admin/questions`
    );
  }

  /**
   * Obtiene todas las categorías disponibles
   *
   * Backend: GET /admin/categories
   * @returns Observable con listado de categorías
   */
  getCategories(): Observable<GetCategoriesResponse> {
    return this.http.get<GetCategoriesResponse>(
      `${this.apiUrl}/admin/categories`
    );
  }

  /**
   * Elimina una pregunta de la base de datos
   *
   * Backend: DELETE /admin/questions/{id}
   * @param questionId ID de la pregunta a eliminar
   * @returns Observable con confirmación de eliminación
   */
  deleteQuestion(questionId: number): Observable<DeleteQuestionResponse> {
    return this.http.delete<DeleteQuestionResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.deleteQuestion(questionId)}`
    );
  }

  /**
   * Obtiene estadísticas del dashboard administrativo
   *
   * Backend: GET /admin/dashboard
   * Incluye: total de jugadores, sesiones, preguntas, pendientes de verificación,
   * top 5 preguntas más difíciles y más fáciles
   * @returns Observable con estadísticas del dashboard
   */
  getDashboardStats(): Observable<DashboardStatsResponse> {
    return this.http.get<DashboardStatsResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.dashboardStats}`
    );
  }
}
