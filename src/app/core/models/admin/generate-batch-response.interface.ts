/**
 * Response from POST /admin/generate-batch
 * Backend: AdminController::generateBatch()
 */
export interface GenerateBatchResponse {
  ok: boolean;
  batch_id: number;
  batch_name: string;
  language: 'es' | 'en';
  generated: number;
  failed: number;
  questions: GeneratedQuestion[];
  message: string;
  error?: string;
}

/**
 * Pregunta generada en batch
 */
export interface GeneratedQuestion {
  id: number;
  statement: string;
  difficulty: number;
  category_id: number;
  is_ai_generated: boolean;
  admin_verified: boolean;
  language?: 'es' | 'en';
}
