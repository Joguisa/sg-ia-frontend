import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PromptConfigResponse,
  UpdatePromptConfigResponse,
  CategoryResponse,
  CreateCategoryResponse,
  UpdateCategoryResponse,
  DeleteCategoryResponse,
  DashboardStatsResponse,
  GenerateBatchResponse,
  GetQuestionsResponse,
  GetCategoriesResponse,
  AdminCategory,
  BatchStatisticsResponse,
  UnverifiedQuestionsResponse,
  BatchVerificationResponse,
  CsvImportResponse,
  EditExplanationResponse,
  QuestionFullResponse,
  UpdateQuestionFullPayload,
  UpdateQuestionFullResponse,
  AvailableProvidersResponse,
  Admin,
  CreateAdminDto,
  UpdateAdminDto,
  AdminResponse,
  AdminsListResponse
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
   * Verificación masiva de preguntas
   *
   * Backend: POST /admin/questions/verify-bulk
   * @param options Opciones: { verify_all_pending?: boolean, question_ids?: number[], batch_id?: number }
   * @returns Observable con el conteo de preguntas verificadas
   */
  verifyBulk(options: { verify_all_pending?: boolean; question_ids?: number[]; batch_id?: number }): Observable<{ ok: boolean; message: string; verified_count: number }> {
    return this.http.post<{ ok: boolean; message: string; verified_count: number }>(
      `${this.apiUrl}/admin/questions/verify-bulk`,
      options
    );
  }

  /**
   * Desverificación masiva de preguntas
   *
   * Backend: POST /admin/questions/unverify-bulk
   * @returns Observable con el conteo de preguntas desverificadas
   */
  unverifyBulk(): Observable<{ ok: boolean; message: string; unverified_count: number }> {
    return this.http.post<{ ok: boolean; message: string; unverified_count: number }>(
      `${this.apiUrl}/admin/questions/unverify-bulk`,
      {}
    );
  }

  /**
   * Eliminación masiva de preguntas
   *
   * Backend: POST /admin/questions/delete-bulk
   * @param options Opciones: { delete_all_pending?: boolean, question_ids?: number[], batch_id?: number }
   * @returns Observable con el conteo de preguntas eliminadas
   */
  deleteBulk(options: { delete_all_pending?: boolean; question_ids?: number[]; batch_id?: number }): Observable<{ ok: boolean; message: string; deleted_count: number }> {
    return this.http.post<{ ok: boolean; message: string; deleted_count: number }>(
      `${this.apiUrl}/admin/questions/delete-bulk`,
      options
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
   * Actualiza la configuración del prompt de IA (Multi-AI)
   *
   * Backend: PUT /admin/config/prompt
   * @param promptText Texto del prompt del sistema
   * @param temperature Temperatura del modelo (0.0 - 1.0)
   * @param preferredProvider Proveedor de IA preferido (opcional: auto, gemini, groq, deepseek, fireworks)
   * @param maxQuestionsPerGame Máximo de preguntas por juego (5-100)
   * @returns Observable con confirmación de actualización
   */
  updatePromptConfig(
    promptText: string,
    temperature: number,
    preferredProvider?: string,
    maxQuestionsPerGame?: number
  ): Observable<UpdatePromptConfigResponse> {
    const body: any = {
      prompt_text: promptText,
      temperature,
      max_questions_per_game: maxQuestionsPerGame || 15
    };
    if (preferredProvider) {
      body.preferred_ai_provider = preferredProvider;
    }
    return this.http.put<UpdatePromptConfigResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.updatePromptConfig}`,
      body
    );
  }

  /**
   * Obtiene los proveedores de IA disponibles y configurados
   *
   * Backend: GET /admin/available-providers
   * @returns Observable con lista de proveedores disponibles
   */
  getAvailableProviders(): Observable<AvailableProvidersResponse> {
    return this.http.get<AvailableProvidersResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.availableProviders}`
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
   * Actualiza una categoría de preguntas
   *
   * Backend: PUT /admin/categories/{id}
   * @param categoryId ID de la categoría a actualizar
   * @param name Nuevo nombre de la categoría (requerido)
   * @param description Nueva descripción opcional
   * @returns Observable con confirmación de actualización
   */
  updateCategory(categoryId: number, name: string, description?: string): Observable<UpdateCategoryResponse> {
    const body = { name, ...(description && { description }) };
    return this.http.put<UpdateCategoryResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.updateCategory(categoryId)}`,
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
   * @param language Idioma de las preguntas ('es' o 'en')
   * @returns Observable con resultado de generación (generadas y fallidas)
   */
  generateBatch(
    quantity: number,
    categoryId: number,
    difficulty: number,
    language: 'es' | 'en' = 'es'
  ): Observable<GenerateBatchResponse> {
    const body = { quantity, category_id: categoryId, difficulty, language };
    return this.http.post<GenerateBatchResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.generateBatch}`,
      body
    );
  }

  /**
   * Obtiene preguntas con filtro de estado activo/inactivo
   *
   * Backend: GET /admin/questions?status=active|inactive|all
   * @param status Filtro de estado: 'active' (default), 'inactive', o 'all'
   * @returns Observable con listado de preguntas
   */
  getQuestions(status: 'active' | 'inactive' | 'all' = 'active'): Observable<GetQuestionsResponse> {
    const params = status !== 'active' ? `?status=${status}` : '';
    return this.http.get<GetQuestionsResponse>(
      `${this.apiUrl}/admin/questions${params}`
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
   * Elimina una pregunta de la base de datos (soft delete)
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
   * Restaura una pregunta eliminada lógicamente
   *
   * Backend: PATCH /admin/questions/{id}/restore
   * @param questionId ID de la pregunta a restaurar
   * @returns Observable con confirmación de restauración
   */
  restoreQuestion(questionId: number): Observable<{ ok: boolean; message?: string }> {
    return this.http.patch<{ ok: boolean; message?: string }>(
      `${this.apiUrl}${environment.apiEndpoints.admin.restoreQuestion(questionId)}`,
      {}
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

  // ========== BATCH MANAGEMENT METHODS ==========

  /**
   * Obtiene estadísticas de todos los batches de preguntas
   *
   * Backend: GET /admin/batch-statistics
   * @returns Observable con listado de estadísticas de batches
   */
  getBatchStatistics(): Observable<BatchStatisticsResponse> {
    return this.http.get<BatchStatisticsResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.batchStatistics}`
    );
  }

  /**
   * Obtiene preguntas sin verificar, opcionalmente filtradas por batch
   *
   * Backend: GET /admin/unverified?batchId={batchId}
   * @param batchId ID del batch (opcional) para filtrar preguntas
   * @returns Observable con listado de preguntas sin verificar
   */
  getUnverifiedQuestions(batchId?: number): Observable<UnverifiedQuestionsResponse> {
    const url = batchId
      ? `${this.apiUrl}${environment.apiEndpoints.admin.unverifiedQuestions}?batchId=${batchId}`
      : `${this.apiUrl}${environment.apiEndpoints.admin.unverifiedQuestions}`;
    return this.http.get<UnverifiedQuestionsResponse>(url);
  }

  /**
   * Verifica todas las preguntas de un batch
   *
   * Backend: POST /admin/batch/{batchId}/verify
   * @param batchId ID del batch a verificar
   * @returns Observable con resultado de la verificación
   */
  verifyBatch(batchId: number): Observable<BatchVerificationResponse> {
    return this.http.post<BatchVerificationResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.verifyBatch(batchId)}`,
      {}
    );
  }

  /**
   * Importa preguntas desde un archivo CSV
   *
   * Backend: POST /admin/batch/import-csv
   * Headers del CSV requeridos: category_id, difficulty, statement, option_1, option_2,
   * option_3, option_4, correct_option_index, explanation_correct, explanation_incorrect, source_citation
   * @param file Archivo CSV a importar (máximo 5MB)
   * @returns Observable con resultado de la importación
   */
  importCsv(file: File): Observable<CsvImportResponse> {
    const formData = new FormData();
    formData.append('csv_file', file);
    return this.http.post<CsvImportResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.importCsv}`,
      formData
    );
  }

  /**
   * Descarga la plantilla CSV para importar preguntas
   *
   * Backend: GET /admin/csv-template
   * Devuelve un archivo CSV con headers y ejemplos
   * @returns Observable que completa cuando la descarga finaliza
   */
  downloadCsvTemplate(): Observable<void> {
    return new Observable(observer => {
      this.http.get(
        `${this.apiUrl}${environment.apiEndpoints.admin.csvTemplate}`,
        { responseType: 'blob' }
      ).subscribe({
        next: (blob) => {
          // Crear URL temporal para el blob
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'plantilla_preguntas.csv';
          link.click();

          // Limpiar
          window.URL.revokeObjectURL(url);
          observer.next();
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  /**
   * Edita el texto de una explicación
   *
   * Backend: PUT /admin/explanation/{explanationId}
   * @param explanationId ID de la explicación a editar
   * @param text Nuevo texto de la explicación
   * @returns Observable con resultado de la edición
   */
  editExplanation(explanationId: number, text: string): Observable<EditExplanationResponse> {
    return this.http.put<EditExplanationResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.editExplanation(explanationId)}`,
      { text }
    );
  }

  // ========== QUESTION FULL EDIT METHODS ==========

  /**
   * Obtiene una pregunta completa con opciones y explicaciones
   *
   * Backend: GET /admin/questions/{id}/full
   * @param questionId ID de la pregunta
   * @returns Observable con la pregunta completa
   */
  getQuestionFull(questionId: number): Observable<QuestionFullResponse> {
    return this.http.get<QuestionFullResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.getQuestionFull(questionId)}`
    );
  }

  /**
   * Actualiza una pregunta completa (enunciado, opciones, explicaciones)
   *
   * Backend: PUT /admin/questions/{id}/full
   * @param questionId ID de la pregunta a actualizar
   * @param data Datos de actualización
   * @returns Observable con la pregunta actualizada
   */
  updateQuestionFull(questionId: number, data: UpdateQuestionFullPayload): Observable<UpdateQuestionFullResponse> {
    return this.http.put<UpdateQuestionFullResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.updateQuestionFull(questionId)}`,
      data
    );
  }

  // ========== ADMIN USERS MANAGEMENT ==========

  /**
   * Lista todos los administradores del sistema
   *
   * Backend: GET /admin/admins
   * @returns Observable con listado de administradores
   */
  listAdmins(): Observable<AdminsListResponse> {
    return this.http.get<AdminsListResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.listAdmins}`
    );
  }

  /**
   * Obtiene un administrador por ID
   *
   * Backend: GET /admin/admins/:id
   * @param id ID del administrador
   * @returns Observable con datos del administrador
   */
  getAdmin(id: number): Observable<AdminResponse> {
    return this.http.get<AdminResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.getAdmin(id)}`
    );
  }

  /**
   * Crea un nuevo administrador (solo superadmin)
   *
   * Backend: POST /admin/admins
   * @param dto Datos del administrador a crear
   * @returns Observable con el administrador creado
   */
  createAdmin(dto: CreateAdminDto): Observable<AdminResponse> {
    return this.http.post<AdminResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.createAdmin}`,
      dto
    );
  }

  /**
   * Actualiza un administrador existente (solo superadmin)
   *
   * Backend: PUT /admin/admins/:id
   * @param id ID del administrador
   * @param dto Datos a actualizar
   * @returns Observable con el administrador actualizado
   */
  updateAdmin(id: number, dto: UpdateAdminDto): Observable<AdminResponse> {
    return this.http.put<AdminResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.updateAdmin(id)}`,
      dto
    );
  }

  /**
   * Elimina un administrador (borrado lógico) (solo superadmin)
   *
   * Backend: DELETE /admin/admins/:id
   * @param id ID del administrador
   * @returns Observable con confirmación de eliminación
   */
  deleteAdmin(id: number): Observable<AdminResponse> {
    return this.http.delete<AdminResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.deleteAdmin(id)}`
    );
  }

  /**
   * Activa o desactiva un administrador (solo superadmin)
   *
   * Backend: PATCH /admin/admins/:id/status
   * @param id ID del administrador
   * @param is_active Estado a establecer (true = activo, false = inactivo)
   * @returns Observable con el administrador actualizado
   */
  toggleAdminStatus(id: number, is_active: boolean): Observable<AdminResponse> {
    return this.http.patch<AdminResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.toggleAdminStatus(id)}`,
      { is_active }
    );
  }
}
