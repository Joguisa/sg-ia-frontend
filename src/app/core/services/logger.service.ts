import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ErrorLogPayload, ErrorLogResponse } from '../models/logger/error-log.interface';

/**
 * Servicio para registrar errores del frontend en el backend
 * Todos los errores se envían de forma silenciosa sin romper el flujo de la aplicación
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {
    private http = inject(HttpClient);
    private readonly apiUrl = environment.apiBaseUrl;

    /**
     * Registra un error HTTP en el backend
     * Operación silenciosa: no lanza excepciones si falla
     *
     * @param message Mensaje descriptivo del error
     * @param error Objeto HttpErrorResponse con detalles del error
     */
    error(message: string, error: HttpErrorResponse): void {
        const payload: ErrorLogPayload = {
            message,
            status: error.status,
            status_text: error.statusText || null,
            url: error.url || 'unknown'
        };

        const endpoint = `${this.apiUrl}${environment.apiEndpoints.logs.error}`;

        this.http.post<ErrorLogResponse>(endpoint, payload).subscribe({
            error: () => { } // Falla silenciosa - no romper la aplicación
        });
    }
}