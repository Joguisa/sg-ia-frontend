import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-notification',
    standalone: true,
    imports: [CommonModule, TranslatePipe],
    templateUrl: './notification.component.html',
    styleUrl: './notification.component.css'
})
export class NotificationComponent {
    protected notificationService = inject(NotificationService);
}