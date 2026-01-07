import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  GameRoom,
  CreateRoomPayload,
  UpdateRoomPayload,
  CreateRoomResponse,
  GetRoomResponse,
  ListRoomsResponse,
  UpdateRoomResponse,
  DeleteRoomResponse,
  ValidateRoomCodeResponse,
  RoomPlayersResponse,
  RoomStatsResponse,
  RoomPlayerStatsResponse,
  RoomQuestionStatsResponse,
  RoomCategoryStatsResponse,
  RoomQuestionAnalysisResponse
} from '../models/room';

/**
 * RoomService
 *
 * Servicio para gestionar salas de juego.
 * Los métodos de admin requieren autenticación JWT.
 * El método validateRoomCode es público.
 */
@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private readonly apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = environment.apiBaseUrl;
  }

  // ========== ADMIN METHODS (Protected) ==========

  /**
   * Crea una nueva sala de juego
   *
   * Backend: POST /admin/rooms
   */
  createRoom(payload: CreateRoomPayload): Observable<CreateRoomResponse> {
    return this.http.post<CreateRoomResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.createRoom}`,
      payload
    );
  }

  /**
   * Obtiene todas las salas
   *
   * Backend: GET /admin/rooms
   */
  listRooms(): Observable<ListRoomsResponse> {
    return this.http.get<ListRoomsResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.listRooms}`
    );
  }

  /**
   * Obtiene una sala por ID
   *
   * Backend: GET /admin/rooms/{id}
   */
  getRoom(roomId: number): Observable<GetRoomResponse> {
    return this.http.get<GetRoomResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.getRoom(roomId)}`
    );
  }

  /**
   * Actualiza una sala
   *
   * Backend: PUT /admin/rooms/{id}
   */
  updateRoom(roomId: number, payload: UpdateRoomPayload): Observable<UpdateRoomResponse> {
    return this.http.put<UpdateRoomResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.updateRoom(roomId)}`,
      payload
    );
  }

  /**
   * Elimina una sala
   *
   * Backend: DELETE /admin/rooms/{id}
   */
  deleteRoom(roomId: number): Observable<DeleteRoomResponse> {
    return this.http.delete<DeleteRoomResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.deleteRoom(roomId)}`
    );
  }

  /**
   * Cambia el estado de una sala
   *
   * Backend: PATCH /admin/rooms/{id}/status
   */
  updateRoomStatus(roomId: number, status: 'active' | 'paused' | 'closed'): Observable<UpdateRoomResponse> {
    return this.http.patch<UpdateRoomResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.updateRoomStatus(roomId)}`,
      { status }
    );
  }

  /**
   * Obtiene los jugadores activos en una sala
   *
   * Backend: GET /admin/rooms/{id}/players
   */
  getRoomPlayers(roomId: number): Observable<RoomPlayersResponse> {
    return this.http.get<RoomPlayersResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.getRoomPlayers(roomId)}`
    );
  }

  // ========== STATISTICS METHODS (Protected) ==========

  /**
   * Obtiene estadísticas generales de una sala
   *
   * Backend: GET /admin/rooms/{id}/stats
   */
  getRoomStats(roomId: number): Observable<RoomStatsResponse> {
    return this.http.get<RoomStatsResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.getRoomStats(roomId)}`
    );
  }

  /**
   * Obtiene estadísticas de jugadores en la sala
   *
   * Backend: GET /admin/rooms/{id}/stats/players
   */
  getRoomPlayerStats(roomId: number): Observable<RoomPlayerStatsResponse> {
    return this.http.get<RoomPlayerStatsResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.getRoomPlayerStats(roomId)}`
    );
  }

  /**
   * Obtiene estadísticas de preguntas en la sala
   *
   * Backend: GET /admin/rooms/{id}/stats/questions
   */
  getRoomQuestionStats(roomId: number): Observable<RoomQuestionStatsResponse> {
    return this.http.get<RoomQuestionStatsResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.getRoomQuestionStats(roomId)}`
    );
  }

  /**
   * Obtiene estadísticas por categoría en la sala
   *
   * Backend: GET /admin/rooms/{id}/stats/categories
   */
  getRoomCategoryStats(roomId: number): Observable<RoomCategoryStatsResponse> {
    return this.http.get<RoomCategoryStatsResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.getRoomCategoryStats(roomId)}`
    );
  }

  /**
   * Obtiene análisis de preguntas (Top 5 difíciles y fáciles)
   *
   * Backend: GET /admin/rooms/{id}/stats/analysis
   */
  getRoomQuestionAnalysis(roomId: number): Observable<RoomQuestionAnalysisResponse> {
    return this.http.get<RoomQuestionAnalysisResponse>(
      `${this.apiUrl}${environment.apiEndpoints.admin.getRoomQuestionAnalysis(roomId)}`
    );
  }

  // ========== EXPORT METHODS (Protected) ==========

  /**
   * Exporta el reporte de una sala a PDF
   *
   * Backend: GET /admin/rooms/{id}/export/pdf
   */
  exportRoomPdf(roomId: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}${environment.apiEndpoints.admin.exportRoomPdf(roomId)}`,
      { responseType: 'blob' }
    );
  }

  /**
   * Exporta el reporte de una sala a Excel
   *
   * Backend: GET /admin/rooms/{id}/export/excel
   */
  exportRoomExcel(roomId: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}${environment.apiEndpoints.admin.exportRoomExcel(roomId)}`,
      { responseType: 'blob' }
    );
  }

  // ========== PUBLIC METHODS ==========

  /**
   * Valida un código de sala (público, no requiere autenticación)
   *
   * Backend: GET /rooms/validate/{code}
   */
  validateRoomCode(code: string): Observable<ValidateRoomCodeResponse> {
    return this.http.get<ValidateRoomCodeResponse>(
      `${this.apiUrl}${environment.apiEndpoints.rooms.validateCode(code.toUpperCase())}`
    );
  }
}
