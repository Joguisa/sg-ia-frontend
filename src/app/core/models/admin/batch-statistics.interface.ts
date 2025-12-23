/**
 * BatchStatistics Interface
 *
 * Representa las estadísticas de un batch de preguntas.
 * Backend: GET /admin/batch-statistics
 */
export interface BatchStatistics {
  id: number;
  batch_name: string;
  batch_type: 'ai_generated' | 'csv_imported' | 'manual';
  total_questions: number;
  verified_count: number;
  verification_percent: number | null;
  imported_at: string;
  status: 'pending' | 'partial' | 'complete';
  ai_provider_used?: string | null;
}

/**
 * Respuesta del endpoint GET /admin/batch-statistics
 */
export interface BatchStatisticsResponse {
  ok: boolean;
  batches: BatchStatistics[];
  count: number;
  error?: string;
}
