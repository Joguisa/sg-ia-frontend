import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('HTTP Error:', error);

      if (error.status === 401) {
        // Si es un error en la ruta de login, no redirigir
        // Solo permitir que el componente maneje el error
        const isLoginRequest = req.url.includes('/auth/login');

        if (!isLoginRequest) {
          // Token inválido o expirado en otras rutas
          localStorage.removeItem('token');
          router.navigate(['/admin/login']);
        }
      } else if (error.status === 403) {
        // No autorizado
        console.error('Acceso denegado');
      } else if (error.status === 404) {
        console.error('Recurso no encontrado');
      } else if (error.status >= 500) {
        console.error('Error del servidor');
      }

      return throwError(() => error);
    })
  );
};
