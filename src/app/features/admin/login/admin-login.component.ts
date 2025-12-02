import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Interfaz para la respuesta del login
 */
interface LoginResponse {
  ok: boolean;
  token?: string;
  error?: string;
}

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

    // Validación: Email requerido
    if (!this.email().trim()) {
      this.errorMessage.set('Por favor ingresa tu correo electrónico');
      return;
    }

    // Validación: Contraseña requerida
    if (!this.password()) {
      this.errorMessage.set('Por favor ingresa tu contraseña');
      return;
    }

    // Validación: Formato email
    if (!this.isValidEmail(this.email())) {
      this.errorMessage.set('Por favor ingresa un correo electrónico válido');
      return;
    }

    this.isLoading.set(true);

    // Llamar al servicio de login
    this.authService.login(this.email().trim(), this.password()).subscribe({
      next: (response: LoginResponse) => {
        // DEBUG: Log del response
        console.log('[AdminLogin] Response del servidor:', response);

        // Verificar que la respuesta sea exitosa y contenga el token
        if (response.ok && response.token) {
          console.log('[AdminLogin] Login exitoso, token recibido:', response.token);

          this.authService.setToken(response.token);

          setTimeout(() => {
            console.log('[AdminLogin] Token establecido, iniciando navegación...');

            // PASO 2: Navegar al dashboard - El AdminGuard esperará el observable
            this.router.navigate(['/admin/dashboard']).then((success) => {
              if (success) {
                console.log('[AdminLogin] ✅ Redirección a /admin/dashboard completada');
              } else {
                console.error('[AdminLogin] ❌ Error: No se pudo redirigir a /admin/dashboard');
              }
            });

            this.isLoading.set(false);
          }, 50);
        } else {
          // Mostrar error si response.ok es false
          const errorMsg = response.error || 'Credenciales inválidas. Intenta de nuevo.';
          console.error('[AdminLogin] Login fallido:', errorMsg);
          this.errorMessage.set(errorMsg);
          this.isLoading.set(false);
        }
      },
      error: (error) => {
        console.error('Error en la solicitud HTTP:', error);

        // Mensaje de error más específico según el tipo de error
        let errorMsg = 'Hubo un problema al conectar con el servidor. Intenta de nuevo.';

        if (error.status === 401) {
          errorMsg = 'Credenciales inválidas. Verifica tu correo y contraseña.';
        } else if (error.status === 0) {
          errorMsg = 'No se puede conectar al servidor. Verifica tu conexión a internet.';
        } else if (error.error?.error) {
          errorMsg = error.error.error;
        }

        this.errorMessage.set(errorMsg);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Alterna la visibilidad de la contraseña
   */
  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  /**
   * Navega al área de juego
   */
  goToPlay(): void {
    this.router.navigate(['/play']);
  }

  /**
   * Valida el formato básico del correo electrónico
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
