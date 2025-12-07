import { AdminCategory } from './admin-category.interface';

/**
 * Response from GET /admin/categories
 * Backend: AdminController::getCategories()
 */
export interface GetCategoriesResponse {
  ok: boolean;
  categories: AdminCategory[];
  error?: string;
}
