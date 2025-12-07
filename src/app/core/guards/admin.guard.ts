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
    return this.authService.token$.pipe(
      take(1),
      map((token) => {
        const tokenFromStorage = localStorage.getItem('token');
        const finalToken = token || tokenFromStorage;

        if (finalToken) {
          return true;
        }

        this.router.navigate(['/admin/login'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      })
    );
  }
}
