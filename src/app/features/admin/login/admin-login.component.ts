import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css']
})
export class AdminLoginComponent {
  email = signal<string>('');
  password = signal<string>('');
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  showPassword = signal<boolean>(false);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.errorMessage.set('');

    // Validación básica
    if (!this.email().trim()) {
      this.errorMessage.set('Por favor ingresa tu correo electrónico');
      return;
    }

    if (!this.password()) {
      this.errorMessage.set('Por favor ingresa tu contraseña');
      return;
    }

    // Validación de formato email básica
    if (!this.isValidEmail(this.email())) {
      this.errorMessage.set('Por favor ingresa un correo electrónico válido');
      return;
    }

    this.isLoading.set(true);

    // Login admin
    this.authService.login(this.email().trim(), this.password()).subscribe({
      next: (response) => {
        if (response.ok && response.token) {
          // Token guardado automáticamente en AuthService
          // Redirigir al dashboard admin
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.errorMessage.set(response.error || 'Error al iniciar sesión');
          this.isLoading.set(false);
        }
      },
      error: (error) => {
        console.error('Error:', error);
        this.errorMessage.set(
          'Hubo un problema al conectar con el servidor. Intenta de nuevo.'
        );
        this.isLoading.set(false);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  goToPlay(): void {
    this.router.navigate(['/play']);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
