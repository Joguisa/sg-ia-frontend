import { Injectable, signal } from '@angular/core';
import { Notification } from '../models/notification/notification.model';
import { NOTIFICATION_DURATION } from '../constants/notification-config.const';

@Injectable({ providedIn: 'root' })
export class NotificationService {
    notifications = signal<Notification[]>([]);

    add(
        message: string,
        type: Notification['type'],
        duration: number | null = NOTIFICATION_DURATION.DEFAULT
    ) {
        const id = crypto.randomUUID();
        this.notifications.update(n => [...n, { id, message, type, duration }]);

        if (duration) {
            setTimeout(() => this.remove(id), duration);
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

    remove(id: string) {
        this.notifications.update(n => n.filter(x => x.id !== id));
    }
}