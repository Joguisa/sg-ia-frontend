/**
 * Admin Users API Response Interfaces
 *
 * Interfaces para las respuestas de la API de gestión de administradores.
 */

import { Admin } from './admin-user.interface';

/**
 * Respuesta genérica de la API para operaciones con un solo admin
 */
export interface AdminResponse {
    ok: boolean;
    admin?: Admin;
    message?: string;
    error?: string;
}

/**
 * Respuesta de la API para listado de administradores
 */
export interface AdminsListResponse {
    ok: boolean;
    admins?: Admin[];
    message?: string;
    error?: string;
}
