/**
 * BatchVerificationResponse Interface
 *
 * Respuesta del endpoint POST /admin/batch/{batchId}/verify
 */
export interface BatchVerificationResponse {
  ok: boolean;
  message: string;
  verified_count: number;
  batch_id: number;
  error?: string;
}

/**
 * EditExplanationResponse Interface
 *
 * Respuesta del endpoint PUT /admin/explanation/{explanationId}
 */
export interface EditExplanationResponse {
  ok: boolean;
  explanation_id: number;
  message: string;
  error?: string;
}
