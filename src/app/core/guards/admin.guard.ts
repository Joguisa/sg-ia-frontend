import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Step 1: Get token from AuthService (which reads from localStorage)
    const token = this.authService.getToken();

    // Step 2: Debug logging
    console.log('=== AdminGuard Check ===');
    console.log('Token from AuthService:', token);
    console.log('Token exists:', !!token);
    console.log('Requested URL:', state.url);

    // Step 3: Simple validation - just check if token exists
    if (token) {
      console.log('✅ AdminGuard: Token found - allowing access');
      return true;
    }

    // Step 4: No token found - redirect to admin login
    console.warn('❌ AdminGuard: No token found - redirecting to /admin/login');
    this.router.navigate(['/admin/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }
}
