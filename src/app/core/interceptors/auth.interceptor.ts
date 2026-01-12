import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Get the token from AuthService
  const token = authService.getToken();

  // Get the current language directly from localStorage to avoid initialization timing issues
  const currentLang = localStorage.getItem('sg_ia_language') || 'es';

  // Build headers object
  const headers: { [key: string]: string } = {
    'Accept-Language': currentLang
  };

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Clone the request and add headers
  req = req.clone({ setHeaders: headers });

  return next(req);
};
