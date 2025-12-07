import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { LoggerService } from './logger.service';
import { NotificationService } from './notification.service';
import { HttpStatus } from '../constants/http-status.const';
import { NOTIFICATION_DURATION } from '../constants/notification-config.const';

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
    private logger = inject(LoggerService);
    private notification = inject(NotificationService);

    handle(error: HttpErrorResponse) {
        this.logger.error(`HTTP Error ${error.status}`, error);

        switch (error.status) {
            case HttpStatus.UNAUTHORIZED:
                this.notification.error(
                    'Sesión expirada. Por favor inicia sesión nuevamente.',
                    NOTIFICATION_DURATION.LONG
                );
                break;
            case HttpStatus.FORBIDDEN:
                this.notification.error(
                    'Acceso denegado.',
                    NOTIFICATION_DURATION.DEFAULT
                );
                break;
            case HttpStatus.NOT_FOUND:
                this.notification.error(
                    'Recurso no encontrado.',
                    NOTIFICATION_DURATION.DEFAULT
                );
                break;
            case HttpStatus.INTERNAL_SERVER_ERROR:
                this.notification.error(
                    'Error del servidor. Intenta más tarde.',
                    NOTIFICATION_DURATION.LONG
                );
                break;
            case HttpStatus.BAD_REQUEST:
                this.notification.error(
                    'Solicitud inválida.',
                    NOTIFICATION_DURATION.DEFAULT
                );
                break;
            default:
                this.notification.error(
                    'Error desconocido. Intenta de nuevo.',
                    NOTIFICATION_DURATION.DEFAULT
                );
        }
    }
}