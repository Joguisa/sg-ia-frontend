import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    // Verificar si hay token válido
    const token = this.authService.getToken();

    if (token) {
      return true;
    }

    // Si no hay token, redirigir a login
    this.router.navigate(['/admin/login']);
    return false;
  }
}
