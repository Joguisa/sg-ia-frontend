/**
 * Response from DELETE /admin/questions/{id}
 * Backend: AdminController::deleteQuestion()
 */
export interface DeleteQuestionResponse {
  ok: boolean;
  message: string;
  error?: string;
}
