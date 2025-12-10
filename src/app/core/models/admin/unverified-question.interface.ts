/**
 * UnverifiedQuestion Interface
 *
 * Representa una pregunta sin verificar por el administrador.
 * Backend: GET /admin/unverified
 */
export interface UnverifiedQuestion {
  id: number;
  statement: string;
  category_id: number;
  category_name: string;
  difficulty: number;
  batch_id: number | null;
  batch_name: string | null;
  batch_type: string | null;
  is_ai_generated: boolean;
  options?: UnverifiedQuestionOption[];
  explanations?: UnverifiedQuestionExplanation[];
}

/**
 * Opción de una pregunta sin verificar
 */
export interface UnverifiedQuestionOption {
  id: number;
  option_text: string;
  is_correct: boolean;
}

/**
 * Explicación de una pregunta sin verificar
 */
export interface UnverifiedQuestionExplanation {
  id: number;
  text: string;
  explanation_type: 'correct' | 'incorrect';
}

/**
 * Respuesta del endpoint GET /admin/unverified
 */
export interface UnverifiedQuestionsResponse {
  ok: boolean;
  questions: UnverifiedQuestion[];
  count: number;
  error?: string;
}
