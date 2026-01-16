import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PromptConfigResponse, AdminPrompt, AdminCategory, AvailableProvidersResponse } from '../../../core/models/admin';
import { HttpStatus } from '../../../core/constants/http-status.const';
import { NOTIFICATION_DURATION } from '../../../core/constants/notification-config.const';
import { CategoryModalComponent } from '../components/category-modal/category-modal.component';
import { TabsComponent, Tab } from '../../../shared/tabs/tabs.component';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CategoryModalComponent, TabsComponent, TranslatePipe],
  templateUrl: './admin-settings.component.html',
  styleUrls: [
    '../shared/styles/admin-styles.css',
    './admin-settings.component.css'
  ]
})
export class AdminSettingsComponent implements OnInit {
  // ========== HELPER PARA TEMPLATE ==========
  Math = Math; // Exponer Math para usar en el template

  // ========== TABS CONFIGURATION ==========
  readonly tabs: Tab[] = [
    { id: 'ia', label: 'admin.settings.artificialIntelligence', icon: 'fas fa-brain' },
    { id: 'juego', label: 'admin.settings.gameCategories', icon: 'fas fa-gamepad' }
  ];
  activeTab = signal<string>('ia');

  // ========== FORMULARIOS REACTIVOS ==========
  promptConfigForm!: FormGroup;

  // ========== UI STATE ==========
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  hasChanges = signal<boolean>(false);

  // ========== ORIGINAL STATE (para detectar cambios) ==========
  originalPromptText = signal<string>('');
  originalTemperature = signal<number>(0.7);
  originalPreferredProvider = signal<string>('auto');
  originalMaxQuestions = signal<number>(15);

  // ========== GESTIÓN DE PROVEEDORES IA ==========
  availableProviders = signal<string[]>([]);
  isLoadingProviders = signal<boolean>(false);

  // ========== GESTIÓN DE CATEGORÍAS ==========
  categories = signal<AdminCategory[]>([]);
  isLoadingCategories = signal<boolean>(false);
  isDeletingCategory = signal<number | null>(null);

  // ========== CONFIRMACIÓN DE BORRADO DE CATEGORÍA ==========
  deleteCategoryConfirmId = signal<number | null>(null);

  // ========== PREGUNTAS VERIFICADAS ==========
  totalVerifiedQuestions = signal<number>(0);

  // Modal de crear/editar categoría
  isCategoryModalOpen = signal<boolean>(false);
  categoryToEdit = signal<AdminCategory | null>(null);

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private notification: NotificationService,
    private translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    // Leer tab desde query params
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab && this.tabs.some(t => t.id === tab)) {
        this.activeTab.set(tab);
      }
    });

    this.loadSystemPrompt();
    this.loadCategories();
    this.loadAvailableProviders();
    this.loadVerifiedQuestionsCount();
  }

  /**
   * Cambia el tab activo y actualiza URL
   */
  onTabChange(tabId: string): void {
    this.activeTab.set(tabId);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabId },
      queryParamsHandling: 'merge'
    });
  }

  /**
   * Inicializa los formularios reactivos
   */
  private initForms(): void {
    // Formulario de configuración del prompt
    this.promptConfigForm = this.fb.group({
      promptText: ['', [Validators.required]],
      temperature: [0.7, [Validators.required, Validators.min(0), Validators.max(1)]],
      preferredProvider: ['auto', [Validators.required]],
      maxQuestionsPerGame: [15, [Validators.required, Validators.min(5), Validators.max(1000)]]
    });

    // Detectar cambios en el formulario de prompt
    this.promptConfigForm.valueChanges.subscribe(() => {
      this.checkForChanges();
    });
  }

  /**
   * Carga la configuración del sistema desde el backend
   */
  private loadSystemPrompt(): void {
    this.adminService.getPromptConfig().subscribe({
      next: (response: PromptConfigResponse) => {
        if (response.ok && response.prompt) {
          const config = response.prompt;

          // Establecer valores en el formulario
          this.promptConfigForm.patchValue({
            promptText: config.prompt_text,
            temperature: config.temperature,
            preferredProvider: config.preferred_ai_provider || 'auto',
            maxQuestionsPerGame: Number(config.max_questions_per_game) || 15
          }, { emitEvent: false });

          // Guardar originals para detectar cambios
          this.originalPromptText.set(config.prompt_text);
          this.originalTemperature.set(config.temperature);
          this.originalPreferredProvider.set(config.preferred_ai_provider || 'auto');
          this.originalMaxQuestions.set(Number(config.max_questions_per_game) || 15);

          this.isLoading.set(false);
          this.isLoading.set(false);
        } else {
          this.notification.error(response.error || this.translate.instant('admin.settings.notifications.load_error'), NOTIFICATION_DURATION.DEFAULT);
          this.isLoading.set(false);
        }
      },
      error: (error) => {
        let errorMsg = this.translate.instant('admin.settings.notifications.load_error');

        if (error.status === HttpStatus.UNAUTHORIZED) {
          errorMsg = this.translate.instant('admin.settings.notifications.unauthorized');
        } else if (error.status === HttpStatus.NOT_FOUND) {
          errorMsg = this.translate.instant('admin.settings.notifications.not_found');
        } else if (error.status === 0) {
          errorMsg = this.translate.instant('admin.settings.notifications.connection_error');
        }

        this.notification.error(errorMsg, NOTIFICATION_DURATION.LONG);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Carga los proveedores de IA disponibles desde el backend
   */
  private loadAvailableProviders(): void {
    this.isLoadingProviders.set(true);

    this.adminService.getAvailableProviders().subscribe({
      next: (response: AvailableProvidersResponse) => {
        if (response.ok && response.providers) {
          // 1. Extraemos solo los nombres de los objetos (transformamos Provider[] a string[])
          const backendProviders = response.providers.map(p => p.name);

          // 2. Filtramos si por casualidad viniera 'auto' del backend para no duplicarlo
          const uniqueBackendProviders = backendProviders.filter(name => name !== 'auto');

          // 3. Construimos el array final de strings
          const providers = ['auto', ...uniqueBackendProviders];

          this.availableProviders.set(providers);
        } else {
          // Fallback en caso de respuesta vacía
          this.availableProviders.set(['auto', 'gemini', 'groq', 'deepseek', 'fireworks']);
        }
        this.isLoadingProviders.set(false);
      },
      error: () => {
        // Fallback en caso de error de red
        this.availableProviders.set(['auto', 'gemini', 'groq', 'deepseek', 'fireworks']);
        this.isLoadingProviders.set(false);
      }
    });
  }

  /**
   * Verifica si hay cambios respecto al estado original
   */
  private checkForChanges(): void {
    const currentPrompt = this.promptConfigForm.get('promptText')?.value || '';
    const currentTemp = this.promptConfigForm.get('temperature')?.value || 0.7;
    const currentProvider = this.promptConfigForm.get('preferredProvider')?.value || 'auto';
    const currentMaxQuestionsRaw = this.promptConfigForm.get('maxQuestionsPerGame')?.value;

    // Si maxQuestions está vacío o es null, usar el original (no considerar como cambio mientras escribe)
    const currentMaxQuestions = (currentMaxQuestionsRaw === null || currentMaxQuestionsRaw === '')
      ? this.originalMaxQuestions()
      : Number(currentMaxQuestionsRaw);

    const hasPromptChange = currentPrompt !== this.originalPromptText();
    const hasTemperatureChange = currentTemp !== this.originalTemperature();
    const hasProviderChange = currentProvider !== this.originalPreferredProvider();
    const hasMaxQuestionsChange = currentMaxQuestions !== this.originalMaxQuestions();

    const hasAnyChange = hasPromptChange || hasTemperatureChange || hasProviderChange || hasMaxQuestionsChange;

    // No permitir guardar si el valor de maxQuestions no es válido
    const maxQuestionsValid = this.maxQuestionsIsValid;

    this.hasChanges.set(hasAnyChange && maxQuestionsValid);
  }

  /**
   * Guarda los cambios en el backend
   */
  saveChanges(): void {
    // Validación del formulario
    if (this.promptConfigForm.invalid) {
      this.notification.warning(this.translate.instant('admin.settings.notifications.validation_error'), NOTIFICATION_DURATION.DEFAULT);
      this.promptConfigForm.markAllAsTouched();
      return;
    }

    // 1. Capturamos los valores ANTES de deshabilitar (importante)
    const formValue = this.promptConfigForm.getRawValue(); // Usamos getRawValue por seguridad
    const cleanPrompt = formValue.promptText.trim();
    const cleanTemp = Number(formValue.temperature.toFixed(1));
    const cleanProvider = formValue.preferredProvider || 'auto';
    const cleanMaxQuestions = Number(formValue.maxQuestionsPerGame);

    this.isSaving.set(true);

    // 2. Deshabilitamos el formulario aquí
    this.promptConfigForm.disable();

    // Llamar al servicio
    this.adminService.updatePromptConfig(cleanPrompt, cleanTemp, cleanProvider, cleanMaxQuestions).subscribe({
      next: (response: any) => {
        // if (response.ok) {
        //   // Actualizar originals para resincronizar
        //   this.originalPromptText.set(formValue.promptText);
        //   this.originalTemperature.set(formValue.temperature);
        //   this.hasChanges.set(false);

        //   this.successMessage.set('Configuración actualizada exitosamente');
        //   this.isSaving.set(false);

        //   // Limpiar mensaje después de 3 segundos
        //   setTimeout(() => this.successMessage.set(''), 3000);
        if (response.ok) {
          this.originalPromptText.set(cleanPrompt); // Usa la variable limpia
          this.originalTemperature.set(cleanTemp);
          this.originalPreferredProvider.set(cleanProvider);
          this.originalMaxQuestions.set(cleanMaxQuestions);
          this.hasChanges.set(false);
          this.notification.success(this.translate.instant('admin.settings.notifications.save_success'), NOTIFICATION_DURATION.DEFAULT);

          // 3. Importante: Habilitar el formulario al terminar
          this.promptConfigForm.enable();
          this.isSaving.set(false);

        } else {
          this.notification.error(response.error || this.translate.instant('admin.settings.notifications.save_error'), NOTIFICATION_DURATION.DEFAULT);

          // 3. Habilitar en caso de error lógico
          this.promptConfigForm.enable();
          this.isSaving.set(false);
        }
      },
      error: (error) => {
        let errorMsg = this.translate.instant('admin.settings.notifications.save_error');

        if (error.status === HttpStatus.UNAUTHORIZED) {
          errorMsg = this.translate.instant('admin.settings.notifications.save_error_unauthorized');
        } else if (error.status === HttpStatus.BAD_REQUEST) {
          errorMsg = this.translate.instant('admin.settings.notifications.save_error_bad_request');
        } else if (error.status === HttpStatus.INTERNAL_SERVER_ERROR) {
          errorMsg = this.translate.instant('admin.settings.notifications.save_error_server');
        }

        this.notification.error(errorMsg, NOTIFICATION_DURATION.LONG);
        this.promptConfigForm.enable();
        this.isSaving.set(false);
      }
    });
  }

  /**
   * Descarta los cambios sin guardar
   */
  discardChanges(): void {
    this.promptConfigForm.patchValue({
      promptText: this.originalPromptText(),
      temperature: this.originalTemperature(),
      preferredProvider: this.originalPreferredProvider(),
      maxQuestionsPerGame: this.originalMaxQuestions()
    }, { emitEvent: false });
    this.hasChanges.set(false);
  }

  /**
   * Restaura el prompt por defecto (confirmación)
   */
  resetToDefault(): void {
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

    this.promptConfigForm.patchValue({
      promptText: defaultPrompt,
      temperature: 0.7
    });
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
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }

  /**
   * Formatea el valor de temperatura para mostrar
   */
  getTemperatureLabel(): string {
    const temp = this.promptConfigForm.get('temperature')?.value || 0.7;
    if (temp < 0.3) return this.translate.instant('admin.settings.veryPrecise');
    if (temp < 0.5) return this.translate.instant('admin.settings.precise');
    if (temp < 0.7) return this.translate.instant('admin.settings.moderate');
    if (temp < 0.9) return this.translate.instant('admin.settings.creative');
    return this.translate.instant('admin.settings.veryCreative');
  }

  /**
   * Obtiene la descripción del valor de temperatura
   */
  getTemperatureDescription(): string {
    const temp = this.promptConfigForm.get('temperature')?.value || 0.7;
    if (temp < 0.3) return this.translate.instant('admin.settings.responsesPrecise');
    if (temp < 0.5) return this.translate.instant('admin.settings.preciseVariation');
    if (temp < 0.7) return this.translate.instant('admin.settings.balance');
    if (temp < 0.9) return this.translate.instant('admin.settings.diversity');
    return this.translate.instant('admin.settings.maxVariation');
  }

  /**
   * Obtiene el valor de temperatura actual
   */
  get temperatureValue(): number {
    return this.promptConfigForm.get('temperature')?.value || 0.7;
  }

  /**
   * Obtiene el valor de prompt text actual
   */
  get promptTextValue(): string {
    return this.promptConfigForm.get('promptText')?.value || '';
  }

  /**
   * Obtiene el valor de proveedor preferido actual
   */
  get preferredProviderValue(): string {
    return this.promptConfigForm.get('preferredProvider')?.value || 'auto';
  }

  /**
   * Obtiene el valor de máximo de preguntas por juego
   */
  get maxQuestionsValue(): number {
    const value = this.promptConfigForm.get('maxQuestionsPerGame')?.value;
    // Si es null, undefined o vacío, retornar 0 para no mostrar error
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    return Number(value) || 15;
  }

  /**
   * Obtiene el número total de categorías
   */
  get totalCategoriesCount(): number {
    return this.categories().length;
  }

  /**
   * Obtiene el número mínimo de preguntas requeridas (1 por categoría)
   */
  get minimumQuestionsRequired(): number {
    return this.totalCategoriesCount > 0 ? this.totalCategoriesCount : 1;
  }

  /**
   * Verifica si el valor de maxQuestions excede las preguntas verificadas
   */
  get maxQuestionsExceedsAvailable(): boolean {
    const configured = this.maxQuestionsValue;
    const available = this.totalVerifiedQuestions();
    // Solo mostrar advertencia si hay un valor configurado mayor a 0
    return configured > 0 && configured > available && available > 0;
  }

  /**
   * Verifica si el valor de maxQuestions está por debajo del mínimo requerido
   */
  get maxQuestionsBelowMinimum(): boolean {
    const configured = this.maxQuestionsValue;
    const minimum = this.minimumQuestionsRequired;
    return configured > 0 && configured < minimum;
  }

  /**
   * Verifica si el valor de maxQuestions es válido (no excede disponibles ni está por debajo del mínimo)
   */
  get maxQuestionsIsValid(): boolean {
    return !this.maxQuestionsExceedsAvailable && !this.maxQuestionsBelowMinimum;
  }

  /**
   * Valida que solo se ingresen números en el input de maxQuestions
   */
  onMaxQuestionsInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Remover cualquier carácter que no sea número
    value = value.replace(/[^0-9]/g, '');

    // Actualizar el valor del input
    input.value = value;

    // Actualizar el formulario (permitir vacío temporalmente)
    if (value === '') {
      this.promptConfigForm.patchValue({ maxQuestionsPerGame: null }, { emitEvent: true });
    } else {
      const numValue = parseInt(value, 10);
      this.promptConfigForm.patchValue({ maxQuestionsPerGame: numValue }, { emitEvent: true });
    }
  }

  /**
   * Valida y ajusta el valor cuando el input pierde el foco
   */
  onMaxQuestionsBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    const minimum = this.minimumQuestionsRequired;

    // Si está vacío, establecer mínimo requerido
    if (value === '' || value === null) {
      value = minimum.toString();
    }

    const numValue = parseInt(value, 10);

    // Validar límites
    if (!isNaN(numValue)) {
      // Mínimo: basado en número de categorías
      if (numValue < minimum) {
        value = minimum.toString();
      }
      // Máximo: no limitamos aquí, pero la validación mostrará advertencia
    }

    // Actualizar el valor del input y del formulario
    input.value = value;
    this.promptConfigForm.patchValue({ maxQuestionsPerGame: parseInt(value, 10) || minimum });
  }

  /**
   * Obtiene la etiqueta amigable de un proveedor de IA
   */
  getProviderLabel(provider: string): string {
    const labels: Record<string, string> = {
      'auto': 'Failover',
      'gemini': 'Google Gemini',
      'groq': 'Groq',
      'deepseek': 'DeepSeek',
      'fireworks': 'Fireworks AI'
    };
    return labels[provider] || provider;
  }

  /**
   * Obtiene la descripción de un proveedor de IA
   */
  getProviderDescription(provider: string): string {
    const descriptions: Record<string, string> = {
      'auto': this.translate.instant('admin.settings.bestProvider'),
      'gemini': `Google Gemini Flash 1.5 - ${this.translate.instant('admin.settings.fastEfficient')}`,
      'groq': `Groq Llama 3.3 70B - ${this.translate.instant('admin.settings.highSpeed')}`,
      'deepseek': `DeepSeek Chat - ${this.translate.instant('admin.settings.economicModel')}`,
      'fireworks': `Fireworks Llama 3.3 70B - ${this.translate.instant('admin.settings.balanceSpeedQuality')}`
    };
    return descriptions[provider] || '';
  }

  /**
   * Carga el total de preguntas verificadas desde el backend
   */
  private loadVerifiedQuestionsCount(): void {
    this.adminService.getDashboardStats().subscribe({
      next: (response) => {
        if (response.ok && response.summary) {
          // Total de preguntas menos las pendientes de verificación
          const totalQuestions = response.summary.total_questions || 0;
          const pending = response.summary.pending_verification || 0;
          this.totalVerifiedQuestions.set(totalQuestions - pending);
        }
      },
      error: () => {
        // Si falla, usar un valor por defecto alto
        this.totalVerifiedQuestions.set(100);
      }
    });
  }

  // ========== MÉTODOS DE GESTIÓN DE CATEGORÍAS ==========

  /**
   * Carga las categorías desde el backend
   */
  loadCategories(): void {
    this.isLoadingCategories.set(true);

    this.adminService.getCategories().subscribe({
      next: (response) => {
        if (response.ok) {
          this.categories.set(response.categories || []);
        } else {
          this.notification.error(response.error || this.translate.instant('admin.settings.notifications.load_categories_error'), NOTIFICATION_DURATION.DEFAULT);
        }
        this.isLoadingCategories.set(false);
      },
      error: (error) => {
        this.notification.error(this.translate.instant('admin.settings.notifications.load_categories_error'), NOTIFICATION_DURATION.DEFAULT);
        this.isLoadingCategories.set(false);
      }
    });
  }

  /**
   * Abre el modal para crear una nueva categoría
   */
  openCreateCategoryModal(): void {
    this.categoryToEdit.set(null);
    this.isCategoryModalOpen.set(true);
  }

  /**
   * Abre el modal para editar una categoría existente
   */
  openEditCategoryModal(category: AdminCategory): void {
    this.categoryToEdit.set(category);
    this.isCategoryModalOpen.set(true);
  }

  /**
   * Cierra el modal de categoría
   */
  closeCategoryModal(): void {
    this.isCategoryModalOpen.set(false);
    this.categoryToEdit.set(null);
  }

  /**
   * Handler cuando se guarda exitosamente una categoría
   */
  onCategorySaved(): void {
    this.loadCategories();
    this.closeCategoryModal();
  }


  /**
   * Solicita confirmación y borra una categoría
   */
  deleteCategory(category: AdminCategory): void {
    if (!category.id) {
      this.notification.error(this.translate.instant('admin.settings.category_modal.notifications.delete_category_id_error'), NOTIFICATION_DURATION.DEFAULT);
      return;
    }

    // Mostrar confirmación
    this.deleteCategoryConfirmId.set(category.id);
  }

  /**
   * Confirma la eliminación de una categoría
   */
  confirmDeleteCategory(categoryId: number): void {
    this.isDeletingCategory.set(categoryId);

    this.adminService.deleteCategory(categoryId).subscribe({
      next: (response) => {
        if (response.ok) {
          const cats = this.categories().filter(c => c.id !== categoryId);
          this.categories.set(cats);
          this.notification.success(this.translate.instant('admin.settings.notifications.delete_category_success'), NOTIFICATION_DURATION.SHORT);
          this.deleteCategoryConfirmId.set(null);
        } else {
          this.notification.error(response.error || this.translate.instant('admin.settings.notifications.delete_category_error'), NOTIFICATION_DURATION.DEFAULT);
          this.deleteCategoryConfirmId.set(null);
        }
        this.isDeletingCategory.set(null);
      },
      error: (error) => {
        let errorMsg = this.translate.instant('admin.settings.notifications.delete_category_error');
        if (error.status === HttpStatus.BAD_REQUEST) {
          errorMsg = this.translate.instant('admin.settings.notifications.delete_category_associated_error');
        } else if (error.error?.error) {
          errorMsg = error.error.error;
        }
        this.notification.error(errorMsg, NOTIFICATION_DURATION.DEFAULT);
        this.deleteCategoryConfirmId.set(null);
        this.isDeletingCategory.set(null);
      }
    });
  }

  /**
   * Cancela la eliminación de categoría
   */
  cancelDeleteCategory(): void {
    this.deleteCategoryConfirmId.set(null);
  }
}
