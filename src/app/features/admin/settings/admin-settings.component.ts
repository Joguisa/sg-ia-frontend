import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { PromptConfigResponse, AdminPrompt } from '../../../core/models/admin';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.css']
})
export class AdminSettingsComponent implements OnInit {
  // ========== CONFIGURACIÓN DEL PROMPT ==========
  promptText = signal<string>('');
  temperature = signal<number>(0.7);

  // ========== UI STATE ==========
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  hasChanges = signal<boolean>(false);

  // ========== ORIGINAL STATE (para detectar cambios) ==========
  originalPromptText = signal<string>('');
  originalTemperature = signal<number>(0.7);

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSystemPrompt();
  }

  /**
   * Carga la configuración del sistema desde el backend
   */
  private loadSystemPrompt(): void {
    console.log('[AdminSettings] Loading system prompt...');

    this.adminService.getPromptConfig().subscribe({
      next: (response: PromptConfigResponse) => {
        console.log('[AdminSettings] Prompt config response:', response);

        if (response.ok && response.prompt) {
          const config = response.prompt;

          // Establecer valores
          this.promptText.set(config.prompt_text);
          this.temperature.set(config.temperature);

          // Guardar originals para detectar cambios
          this.originalPromptText.set(config.prompt_text);
          this.originalTemperature.set(config.temperature);

          this.isLoading.set(false);
          console.log('[AdminSettings] System prompt loaded successfully');
        } else {
          this.errorMessage.set(response.error || 'Error al cargar la configuración');
          this.isLoading.set(false);
        }
      },
      error: (error) => {
        console.error('[AdminSettings] Error loading system prompt:', error);
        let errorMsg = 'Hubo un problema al cargar la configuración.';

        if (error.status === 401) {
          errorMsg = 'No autorizado. Token expirado.';
        } else if (error.status === 404) {
          errorMsg = 'Configuración no encontrada.';
        } else if (error.status === 0) {
          errorMsg = 'No se puede conectar al servidor.';
        }

        this.errorMessage.set(errorMsg);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Detecta cambios en el formulario
   */
  onPromptChange(): void {
    this.checkForChanges();
  }

  onTemperatureChange(): void {
    this.checkForChanges();
  }

  /**
   * Verifica si hay cambios respecto al estado original
   */
  private checkForChanges(): void {
    const hasPromptChange = this.promptText() !== this.originalPromptText();
    const hasTemperatureChange = this.temperature() !== this.originalTemperature();

    this.hasChanges.set(hasPromptChange || hasTemperatureChange);
  }

  /**
   * Guarda los cambios en el backend
   */
  saveChanges(): void {
    console.log('[AdminSettings] Saving changes...');

    // Validación
    if (!this.promptText().trim()) {
      this.errorMessage.set('El prompt del sistema no puede estar vacío');
      return;
    }

    if (this.temperature() < 0 || this.temperature() > 1) {
      this.errorMessage.set('La temperatura debe estar entre 0.0 y 1.0');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    // Preparar datos
    // const data: Partial<AdminPrompt> = {
    //   prompt_text: this.promptText().trim(),
    //   temperature: Number(this.temperature().toFixed(1)) // Redondear a 1 decimal
    // };
    
    const cleanPrompt = this.promptText().trim();
    const cleanTemp = Number(this.temperature().toFixed(1));

    // Llamar al servicio
    this.adminService.updatePromptConfig(cleanPrompt, cleanTemp).subscribe({
      next: (response: any) => {
        console.log('[AdminSettings] Save response:', response);

        if (response.ok) {
          // Actualizar originals para resincronizar
          this.originalPromptText.set(this.promptText());
          this.originalTemperature.set(this.temperature());
          this.hasChanges.set(false);

          this.successMessage.set('Configuración actualizada exitosamente');
          this.isSaving.set(false);

          // Limpiar mensaje después de 3 segundos
          setTimeout(() => this.successMessage.set(''), 3000);

          console.log('[AdminSettings] Configuration saved successfully');
        } else {
          this.errorMessage.set(response.error || 'Error al guardar la configuración');
          this.isSaving.set(false);
        }
      },
      error: (error) => {
        console.error('[AdminSettings] Error saving changes:', error);
        let errorMsg = 'Error al guardar la configuración.';

        if (error.status === 401) {
          errorMsg = 'No autorizado. Por favor, inicia sesión nuevamente.';
        } else if (error.status === 400) {
          errorMsg = 'Datos inválidos. Verifica los valores.';
        } else if (error.status === 500) {
          errorMsg = 'Error del servidor. Intenta más tarde.';
        }

        this.errorMessage.set(errorMsg);
        this.isSaving.set(false);
      }
    });
  }

  /**
   * Descarta los cambios sin guardar
   */
  discardChanges(): void {
    console.log('[AdminSettings] Discarding changes...');

    this.promptText.set(this.originalPromptText());
    this.temperature.set(this.originalTemperature());
    this.hasChanges.set(false);
    this.errorMessage.set('');
  }

  /**
   * Restaura el prompt por defecto (confirmación)
   */
  resetToDefault(): void {
    console.log('[AdminSettings] Resetting to default...');

    const defaultPrompt = `Eres un experto en medicina y salud pública. Tu tarea es generar preguntas de opción múltiple educativas sobre temas médicos.

INSTRUCCIONES ESTRICTAS:
1. La pregunta debe ser clara, específica y basada en evidencia científica.
2. Proporciona exactamente 4 opciones de respuesta (A, B, C, D).
3. Solo UNA opción debe ser correcta.
4. Las opciones incorrectas deben ser plausibles pero claramente erróneas.
5. Incluye una explicación educativa de la respuesta correcta.
6. Formato: Pregunta | Opción A | Opción B | Opción C | Opción D | Respuesta Correcta | Explicación

RESTRICCIONES:
- No incluyas información falsa o engañosa.
- Las preguntas deben ser apropiadas para estudiantes de medicina.
- Evita preguntas ambiguas o con múltiples interpretaciones.
- Sé consistente con la terminología médica estándar.`;

    this.promptText.set(defaultPrompt);
    this.temperature.set(0.7);
    this.checkForChanges();
  }

  /**
   * Navega al dashboard
   */
  goToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  /**
   * Cierra sesión
   */
  logout(): void {
    console.log('[AdminSettings] Logging out...');
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }

  /**
   * Formatea el valor de temperatura para mostrar
   */
  getTemperatureLabel(): string {
    const temp = this.temperature();
    if (temp < 0.3) return 'Muy preciso';
    if (temp < 0.5) return 'Preciso';
    if (temp < 0.7) return 'Moderado';
    if (temp < 0.9) return 'Creativo';
    return 'Muy creativo';
  }

  /**
   * Obtiene la descripción del valor de temperatura
   */
  getTemperatureDescription(): string {
    const temp = this.temperature();
    if (temp < 0.3) return 'Respuestas predecibles y consistentes';
    if (temp < 0.5) return 'Preciso con variación controlada';
    if (temp < 0.7) return 'Balance entre precisión y creatividad';
    if (temp < 0.9) return 'Más diversidad en las respuestas';
    return 'Máxima variación y aleatoriedad';
  }
}
