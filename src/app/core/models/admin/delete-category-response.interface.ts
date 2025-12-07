/**
 * Response from DELETE /admin/categories/{id}
 * Backend: AdminController::deleteCategory()
 */
export interface DeleteCategoryResponse {
  ok: boolean;
  message: string;
  error?: string;
}
