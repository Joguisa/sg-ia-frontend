import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class LoggerService {
    private http = inject(HttpClient);

    error(message: string, error: HttpErrorResponse) {
        const payload = {
            timestamp: new Date(),
            message,
            status: error.status,
            statusText: error.statusText,
            url: error.url
        };

        this.http.post('/api/logs/error', payload).subscribe({
            error: () => { } // Falla silenciosa
        });
    }
}