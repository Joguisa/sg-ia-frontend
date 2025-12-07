/**
 * Response from GET /admin/questions
 * Backend: AdminController::getQuestions()
 */
export interface GetQuestionsResponse {
  ok: boolean;
  questions: AdminQuestion[];
  error?: string;
}

/**
 * Pregunta con información de categoría (usado en admin)
 */
export interface AdminQuestion {
  id: number;
  statement: string;
  difficulty: number;
  category_id: number;
  category_name: string;
  is_ai_generated: boolean;
  admin_verified: boolean;
}
