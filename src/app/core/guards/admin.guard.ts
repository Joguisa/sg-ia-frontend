import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // Debug logging - inicio
    console.log('=== AdminGuard Check (Async) ===');
    console.log('Requested URL:', state.url);
    console.log('Timestamp:', new Date().toISOString());

    // Usar el Observable token$ para esperar reactive-mente
    // Tomar solo el primer valor (take(1)) para no mantener suscripción abierta
    return this.authService.token$.pipe(
      take(1),
      map((token) => {
        // Step 1: Log del token obtenido del observable
        console.log('Token from Observable:', token);
        console.log('Token exists:', !!token);

        // Step 2: Verificación directa de localStorage como backup
        const tokenFromStorage = localStorage.getItem('token');
        console.log('Token from localStorage (backup):', tokenFromStorage);

        // Step 3: Usar el token del observable O localStorage (backup)
        const finalToken = token || tokenFromStorage;

        // Step 4: Validar que exista token
        if (finalToken) {
          console.log('✅ AdminGuard: Token found - allowing access to', state.url);
          return true;
        }

        // Step 5: No hay token - rechazar y redirigir
        console.warn('❌ AdminGuard: No token found - redirecting to /admin/login');
        this.router.navigate(['/admin/login'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      })
    );
  }
}
