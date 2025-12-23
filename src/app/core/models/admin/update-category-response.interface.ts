/**
 * Response from PUT /admin/categories/{id}
 * Backend: AdminController::updateCategory()
 */
export interface UpdateCategoryResponse {
  ok: boolean;
  message: string;
  error?: string;
}
