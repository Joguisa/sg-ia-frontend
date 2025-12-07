/**
 * Response from POST /admin/categories
 * Backend: AdminController::createCategory()
 */
export interface CreateCategoryResponse {
  ok: boolean;
  category_id: number;
  message: string;
  error?: string;
}
