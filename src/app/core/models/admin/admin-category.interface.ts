/**
 * Categoría de preguntas (usado en admin)
 * Backend: AdminController::getCategories()
 */
export interface AdminCategory {
  id?: number;
  name: string;
  description?: string | null;
}

export interface CategoryResponse {
  ok: boolean;
  category_id?: number;
  message?: string;
  error?: string;
}

export interface CategoriesResponse {
  ok: boolean;
  categories: AdminCategory[];
  error?: string;
}
