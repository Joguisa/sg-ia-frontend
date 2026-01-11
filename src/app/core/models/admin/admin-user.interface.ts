/**
 * Admin User Interfaces
 *
 * Tipos e interfaces para la gestión de administradores del sistema.
 */

/**
 * Roles de administrador disponibles
 */
export type AdminRole = 'admin' | 'superadmin';

/**
 * Interfaz principal de administrador
 */
export interface Admin {
    id: number;
    email: string;
    role: AdminRole;
    is_active: boolean; // true = activo, false = desactivado
    created_at: string;
    updated_at?: string;
}

/**
 * DTO para crear un nuevo administrador
 */
export interface CreateAdminDto {
    email: string;
    password: string; // Requerido al crear
    role: AdminRole;
}

/**
 * DTO para actualizar un administrador existente
 */
export interface UpdateAdminDto {
    email?: string;
    password?: string; // Opcional, solo si se quiere cambiar
    role?: AdminRole;
    is_active?: boolean;
}
