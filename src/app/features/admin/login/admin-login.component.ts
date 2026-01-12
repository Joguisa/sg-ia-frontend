import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthResponse } from '../../../core/models/auth';
import { HttpStatus } from '../../../core/constants/http-status.const';
import { NOTIFICATION_DURATION } from '../../../core/constants/notification-config.const';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css']
})
export class AdminLoginComponent {
  loginForm: FormGroup;
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>(''); // Solo para validaciones inline del formulario
  showPassword = signal<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notification: NotificationService,
    private router: Router,
    private translate: TranslateService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.maxLength(100), this.emailValidator]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(50)]]
    });
  }

  // Validador personalizado para email
  emailValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (!value) {
      return null; // El Validators.required se encarga de esto
    }

    // Regex mejorado para validar formato de email
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(value)) {
      return { invalidEmail: true };
    }

    return null;
  }

  onSubmit(): void {
    this.errorMessage.set('');

    // Marcar todos los campos como touched para mostrar errores
    this.loginForm.markAllAsTouched();

    // Validar el formulario
    if (this.loginForm.invalid) {
      if (this.loginForm.get('email')?.hasError('required')) {
        this.errorMessage.set('Por favor ingresa tu correo electrónico');
      } else if (this.loginForm.get('email')?.hasError('invalidEmail')) {
        this.errorMessage.set('Por favor ingresa un correo electrónico válido');
      } else if (this.loginForm.get('email')?.hasError('maxlength')) {
        this.errorMessage.set('El correo electrónico no puede exceder los 100 caracteres');
      } else if (this.loginForm.get('password')?.hasError('required')) {
        this.errorMessage.set('Por favor ingresa tu contraseña');
      } else if (this.loginForm.get('password')?.hasError('minlength')) {
        this.errorMessage.set('La contraseña debe tener al menos 6 caracteres');
      } else if (this.loginForm.get('password')?.hasError('maxlength')) {
        this.errorMessage.set('La contraseña no puede exceder los 50 caracteres');
      }
      return;
    }

    this.isLoading.set(true);
    this.loginForm.disable();

    const formValues = this.loginForm.value;
    const email = formValues.email.trim();
    const password = formValues.password;

    // Llamar al servicio de login
    this.authService.login(email, password).subscribe({
      next: (response: AuthResponse) => {
        // Verificar que la respuesta sea exitosa y contenga el token
        if (response.ok && response.token) {
          // Establecer token
          this.authService.setToken(response.token);

          // Notificar éxito
          this.notification.success(this.translate.instant('errors.login_success'), NOTIFICATION_DURATION.SHORT);

          // Esperar un momento para que el token se propague
          setTimeout(() => {
            // Navegar al dashboard
            this.router.navigate(['/admin/dashboard']).then((success) => {
              if (!success) {
                this.notification.error(this.translate.instant('errors.dashboard_access_error'), NOTIFICATION_DURATION.DEFAULT);
                this.loginForm.enable();
              }
              this.isLoading.set(false);
            });
          }, 100);
        } else {
          // Mostrar error si response.ok es false
          const errorMsg = response.error || this.translate.instant('errors.invalid_credentials');
          this.notification.error(errorMsg, NOTIFICATION_DURATION.DEFAULT);
          this.isLoading.set(false);
          this.loginForm.enable();
        }
      },
      error: (error) => {
        // Mensaje de error más específico según el tipo de error
        let errorMsg = this.translate.instant('errors.server_connection_error');

        if (error.status === HttpStatus.UNAUTHORIZED) {
          errorMsg = this.translate.instant('errors.check_credentials');
        } else if (error.status === 0) {
          errorMsg = this.translate.instant('errors.check_internet');
        } else if (error.error?.error) {
          errorMsg = error.error.error;
        }

        this.notification.error(errorMsg, NOTIFICATION_DURATION.LONG);
        this.isLoading.set(false);
        this.loginForm.enable();
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
}
