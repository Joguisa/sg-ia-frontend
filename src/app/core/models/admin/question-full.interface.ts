/**
 * QuestionFull Interface
 *
 * Representa una pregunta completa con opciones y explicaciones.
 * Backend: GET/PUT /admin/questions/{id}/full
 */
export interface QuestionFull {
  id: number;
  statement: string;
  difficulty: number;
  category_id: number;
  category_name: string;
  is_ai_generated: boolean;
  admin_verified: boolean;
  batch_id: number | null;
  options: QuestionOption[];
  explanations: QuestionExplanation[];
  language?: 'es' | 'en';
}

export interface QuestionOption {
  id?: number;
  text: string;
  is_correct: boolean;
}

export interface QuestionExplanation {
  id?: number;
  text: string;
  type: 'correct' | 'incorrect';
}

/**
 * Respuesta del endpoint GET /admin/questions/{id}/full
 */
export interface QuestionFullResponse {
  ok: boolean;
  question?: QuestionFull;
  error?: string;
}

/**
 * Payload para actualizar una pregunta completa
 * PUT /admin/questions/{id}/full
 */
export interface UpdateQuestionFullPayload {
  statement: string;
  difficulty: number;
  category_id: number;
  options: QuestionOption[];
  explanation_correct?: string;
  explanation_incorrect?: string;
}

/**
 * Respuesta del endpoint PUT /admin/questions/{id}/full
 */
export interface UpdateQuestionFullResponse {
  ok: boolean;
  message?: string;
  question?: QuestionFull;
  error?: string;
}
