/**
 * Room Interfaces
 *
 * Interfaces para el sistema de salas de juego.
 */

/**
 * Modelo de una sala de juego
 */
export interface GameRoom {
  id: number;
  room_code: string;
  name: string;
  description?: string | null;
  admin_id: number;
  filter_categories?: number[] | null;
  filter_difficulties?: number[] | null;
  max_players: number;
  language: 'es' | 'en';
  status: 'active' | 'paused' | 'closed';
  started_at?: string | null;
  ended_at?: string | null;
  created_at: string;
  active_players?: number;
}

/**
 * Payload para crear una sala
 */
export interface CreateRoomPayload {
  name: string;
  description?: string;
  filter_categories?: number[];
  filter_difficulties?: number[];
  max_players?: number;
  language?: 'es' | 'en';
}

/**
 * Payload para actualizar una sala
 */
export interface UpdateRoomPayload {
  name?: string;
  description?: string;
  filter_categories?: number[];
  filter_difficulties?: number[];
  max_players?: number;
  language?: 'es' | 'en';
}

/**
 * Respuesta al crear una sala
 */
export interface CreateRoomResponse {
  ok: boolean;
  message?: string;
  room?: GameRoom;
  error?: string;
}

/**
 * Respuesta al obtener una sala
 */
export interface GetRoomResponse {
  ok: boolean;
  room?: GameRoom;
  error?: string;
}

/**
 * Respuesta al listar salas
 */
export interface ListRoomsResponse {
  ok: boolean;
  rooms?: GameRoom[];
  total?: number;
  error?: string;
}

/**
 * Respuesta al actualizar una sala
 */
export interface UpdateRoomResponse {
  ok: boolean;
  message?: string;
  room?: GameRoom;
  error?: string;
}

/**
 * Respuesta al eliminar una sala
 */
export interface DeleteRoomResponse {
  ok: boolean;
  message?: string;
  error?: string;
}

/**
 * Respuesta al validar código de sala (público)
 */
export interface ValidateRoomCodeResponse {
  ok: boolean;
  valid: boolean;
  reason?: string;
  room?: GameRoom;
  error?: string;
}

/**
 * Jugador activo en una sala
 */
export interface RoomActivePlayer {
  id: number;
  name: string;
  age: number;
  score: number;
  session_status: string;
  started_at: string;
}

/**
 * Respuesta al obtener jugadores activos
 */
export interface RoomPlayersResponse {
  ok: boolean;
  room_id: number;
  players: RoomActivePlayer[];
  total: number;
  error?: string;
}

/**
 * Estadísticas generales de una sala
 */
export interface RoomStatistics {
  total_sessions: number;
  unique_players: number;
  total_answers: number;
  avg_accuracy: number;
  avg_time_sec: number;
  highest_score: number;
  avg_score: number;
}

/**
 * Respuesta de estadísticas de sala
 */
export interface RoomStatsResponse {
  ok: boolean;
  data?: {
    room: GameRoom;
    statistics: RoomStatistics | null;
    message?: string;
  };
  error?: string;
}

/**
 * Estadísticas de un jugador en la sala
 */
export interface RoomPlayerStats {
  room_id: number;
  room_code: string;
  player_id: number;
  player_name: string;
  player_age: number;
  total_sessions: number;
  high_score: number;
  avg_score: number;
  total_answers: number;
  accuracy: number;
  avg_time_sec: number;
}

/**
 * Respuesta de estadísticas de jugadores en sala
 */
export interface RoomPlayerStatsResponse {
  ok: boolean;
  room_id: number;
  players: RoomPlayerStats[];
  total: number;
  error?: string;
}

/**
 * Estadísticas de una pregunta en la sala
 */
export interface RoomQuestionStats {
  room_id: number;
  room_code: string;
  question_id: number;
  statement: string;
  category_name: string;
  difficulty: number;
  times_answered: number;
  correct_count: number;
  error_count: number;
  error_rate: number;
  avg_time_sec: number;
}

/**
 * Respuesta de estadísticas de preguntas en sala
 */
export interface RoomQuestionStatsResponse {
  ok: boolean;
  room_id: number;
  questions: RoomQuestionStats[];
  total: number;
  error?: string;
}

/**
 * Estadísticas por categoría en la sala
 */
export interface RoomCategoryStats {
  room_id: number;
  room_code: string;
  category_id: number;
  category_name: string;
  total_answers: number;
  accuracy_percent: number;
  avg_time_sec: number;
}

/**
 * Respuesta de estadísticas por categoría en sala
 */
export interface RoomCategoryStatsResponse {
  ok: boolean;
  room_id: number;
  categories: RoomCategoryStats[];
  total: number;
  error?: string;
}

/**
 * Pregunta con tasa de éxito para análisis
 */
export interface QuestionAnalysis {
  id: number;
  statement: string;
  times_answered: number;
  success_rate: number;
}

/**
 * Respuesta del análisis de preguntas (Top 5 difíciles/fáciles)
 */
export interface RoomQuestionAnalysisResponse {
  ok: boolean;
  room_id: number;
  top_hardest: QuestionAnalysis[];
  top_easiest: QuestionAnalysis[];
  error?: string;
}
