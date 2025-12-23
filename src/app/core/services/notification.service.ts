import { Injectable, signal } from '@angular/core';
import { Notification } from '../models/notification/notification.model';
import { NOTIFICATION_DURATION } from '../constants/notification-config.const';

@Injectable({ providedIn: 'root' })
export class NotificationService {
    // Cambiado a una sola notificación en lugar de un array
    currentNotification = signal<Notification | null>(null);
    private hideTimeout: any = null;

    add(
        message: string,
        type: Notification['type'],
        duration: number | null = NOTIFICATION_DURATION.DEFAULT
    ) {
        // Evitar duplicados: si el mensaje y tipo son iguales, no hacer nada
        const current = this.currentNotification();
        if (current && current.message === message && current.type === type) {
            return;
        }

        // Limpiar timeout anterior si existe
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        const id = crypto.randomUUID();
        this.currentNotification.set({ id, message, type, duration });

        if (duration) {
            this.hideTimeout = setTimeout(() => this.clear(), duration);
        }
    }

    error(message: string, duration: number | null = NOTIFICATION_DURATION.DEFAULT) {
        this.add(message, 'error', duration);
    }

    success(message: string, duration: number | null = NOTIFICATION_DURATION.DEFAULT) {
        this.add(message, 'success', duration);
    }

    warning(message: string, duration: number | null = NOTIFICATION_DURATION.DEFAULT) {
        this.add(message, 'warning', duration);
    }

    info(message: string, duration: number | null = NOTIFICATION_DURATION.DEFAULT) {
        this.add(message, 'info', duration);
    }

    clear() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
        this.currentNotification.set(null);
    }

    // Mantener método remove por compatibilidad (ahora es alias de clear)
    remove(id: string) {
        this.clear();
    }
}