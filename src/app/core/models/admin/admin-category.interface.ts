export interface AdminCategory {
  id?: number;
  name: string;
  description?: string;
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
