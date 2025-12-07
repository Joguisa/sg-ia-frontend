import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpStatus } from '../constants/http-status.const';
import { ErrorHandlerService } from '../services/error-handler.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const errorHandler = inject(ErrorHandlerService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isLoginRequest = req.url.includes('/auth/login');

      if (error.status === HttpStatus.UNAUTHORIZED && !isLoginRequest) {
        localStorage.removeItem('token');
        router.navigate(['/admin/login']);
      } else if (!isLoginRequest) {
        errorHandler.handle(error);
      }

      return throwError(() => error);
    })
  );
};