import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AdminCategory, GenerationResponse } from '../../../core/models/admin';
import { Question } from '../../../core/models/game';
import { HttpStatus } from '../../../core/constants/http-status.const';
import { NOTIFICATION_DURATION } from '../../../core/constants/notification-config.const';

@Component({
  selector: 'app-admin-questions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-questions.component.html',
  styleUrls: ['./admin-questions.component.css']
})
export class AdminQuestionsComponent implements OnInit {
  // ========== FORMULARIOS REACTIVOS ==========
  generatorForm: FormGroup;
  filterForm: FormGroup;

  // ========== LISTA DE PREGUNTAS ==========
  allQuestions = signal<Question[]>([]);
  questions = signal<Question[]>([]);

  // ========== CATEGORÍAS ==========
  categories = signal<AdminCategory[]>([]);

  // ========== UI STATE ==========
  isLoading = signal<boolean>(true);
  isGeneratorOpen = signal<boolean>(false);
  isGenerating = signal<boolean>(false);

  // ========== CONFIRMACIÓN DE BORRADO ==========
  deleteConfirmId = signal<number | null>(null);

  // ========== SIGNALS PARA FILTROS ==========
  private filterTrigger = signal<number>(0);

  // ========== COMPUTED SIGNALS (Filtrado) ==========
  filteredQuestions = computed(() => {
    // Forzar recomputo cuando cambia el trigger
    this.filterTrigger();

    let result = [...this.allQuestions()];

    if (!this.filterForm) {
      return result;
    }

    const categoryValue = this.filterForm.get('category')?.value;
    const statusValue = this.filterForm.get('status')?.value;
    const searchValue = this.filterForm.get('search')?.value;

    // Filtrar por categoría
    if (categoryValue !== null && categoryValue !== '' && categoryValue !== 'null') {
      result = result.filter(q => q.category_id === Number(categoryValue));
    }

    // Filtrar por estado (verificada/pendiente)
    if (statusValue === 'verified') {
      result = result.filter(q => q.admin_verified);
    } else if (statusValue === 'pending') {
      result = result.filter(q => !q.admin_verified);
    }

    // Filtrar por búsqueda
    if (searchValue && searchValue.trim()) {
      const term = searchValue.toLowerCase().trim();
      result = result.filter(q =>
        q.statement.toLowerCase().includes(term) ||
        q.id.toString().includes(term)
      );
    }

    return result;
  });

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private authService: AuthService,
    private notification: NotificationService,
    private router: Router
  ) {
    // Inicializar formulario del generador
    this.generatorForm = this.fb.group({
      categoryId: [null, [Validators.required]],
      difficulty: [2, [Validators.required, Validators.min(1), Validators.max(5)]],
      quantity: [5, [Validators.required, this.quantityValidator]]
    });

    // Inicializar formulario de filtros
    this.filterForm = this.fb.group({
      search: ['', [Validators.maxLength(200)]],
      category: [null],
      status: ['all']
    });

    // Suscribirse a cambios en los filtros para activar el recomputo
    this.filterForm.valueChanges.subscribe(() => {
      this.filterTrigger.set(this.filterTrigger() + 1);
    });
  }

  // Validador personalizado para cantidad
  quantityValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (!value) {
      return null;
    }

    const quantity = parseInt(value, 10);

    if (isNaN(quantity) || quantity < 1 || quantity > 50) {
      return { invalidQuantity: true };
    }

    return null;
  }

  ngOnInit(): void {
    this.loadQuestions();
    this.loadCategories();
  }

  /**
 * Carga la lista de preguntas desde el backend
 */
  private loadQuestions(): void {
    this.isLoading.set(true);

    this.adminService.getQuestions().subscribe({
      next: (response) => {
        this.allQuestions.set(response.questions || []);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.notification.error('Error al cargar preguntas', NOTIFICATION_DURATION.DEFAULT);
        this.isLoading.set(false);
      }
    });
  }

  /**
 * Carga las categorías disponibles
 */
  private loadCategories(): void {
    this.adminService.getCategories().subscribe({
      next: (response) => {
        this.categories.set(response.categories || []);
      },
      error: (error) => {
        this.notification.warning('No se pudieron cargar categorías, usando valores por defecto', NOTIFICATION_DURATION.SHORT);
        // Fallback categorías por defecto
        this.categories.set([
          { id: 1, name: 'Epidemiología y Generalidades' },
          { id: 2, name: 'Factores de Riesgo' },
          { id: 3, name: 'Tamizaje y Detección' },
          { id: 4, name: 'Prevención y Estilos de Vida' }
        ]);
      }
    });
  }


  /**
   * Genera preguntas usando IA (Gemini)
   */
  generateQuestionsWithAI(): void {
    // Marcar todos los campos como touched
    this.generatorForm.markAllAsTouched();

    // Validar el formulario
    if (this.generatorForm.invalid) {
      if (this.generatorForm.get('categoryId')?.hasError('required')) {
        this.notification.warning('Por favor selecciona una categoría', NOTIFICATION_DURATION.DEFAULT);
      } else if (this.generatorForm.get('quantity')?.hasError('required')) {
        this.notification.warning('Por favor ingresa la cantidad', NOTIFICATION_DURATION.DEFAULT);
      } else if (this.generatorForm.get('quantity')?.hasError('invalidQuantity')) {
        this.notification.warning('Cantidad debe ser entre 1 y 50', NOTIFICATION_DURATION.DEFAULT);
      } else if (this.generatorForm.get('difficulty')?.hasError('min') || this.generatorForm.get('difficulty')?.hasError('max')) {
        this.notification.warning('Dificultad debe ser entre 1 y 5', NOTIFICATION_DURATION.DEFAULT);
      }
      return;
    }

    this.isGenerating.set(true);
    this.notification.info('Generando preguntas con IA...', NOTIFICATION_DURATION.LONG);
    this.generatorForm.disable();

    const formValues = this.generatorForm.getRawValue();

    // Llamar al servicio
    this.adminService.generateBatch(
      formValues.quantity,
      formValues.categoryId,
      formValues.difficulty
    ).subscribe({
      next: (response: GenerationResponse) => {
        const generatedCount = response.generated ?? 0;

        if (response.ok && generatedCount > 0) {
          // Éxito: se generaron preguntas
          this.notification.success(
            `${generatedCount} pregunta${generatedCount !== 1 ? 's' : ''} generada${generatedCount !== 1 ? 's' : ''} exitosamente con IA`,
            NOTIFICATION_DURATION.DEFAULT
          );
          this.isGenerating.set(false);

          // Resetear formulario
          this.generatorForm.reset({
            categoryId: null,
            difficulty: 2,
            quantity: 5
          });
          this.generatorForm.enable();
          this.isGeneratorOpen.set(false);

          // Recargar preguntas
          this.loadQuestions();
        } else if (response.ok && generatedCount === 0) {
          // Respuesta OK pero no se generaron preguntas
          const failedCount = response.failed ?? 0;
          const errorMsg = response.message || response.error || `No se pudieron generar preguntas. ${failedCount} fallaron.`;
          this.notification.error(errorMsg, NOTIFICATION_DURATION.LONG);
          this.isGenerating.set(false);
          this.generatorForm.enable();
        } else {
          // Error general
          this.notification.error(response.error || 'Error al generar preguntas', NOTIFICATION_DURATION.DEFAULT);
          this.isGenerating.set(false);
          this.generatorForm.enable();
        }
      },
      error: (error) => {
        let errorMsg = 'Error al generar preguntas con IA';

        if (error.status === HttpStatus.UNAUTHORIZED) {
          errorMsg = 'No autorizado. Token expirado.';
        } else if (error.status === HttpStatus.BAD_REQUEST) {
          errorMsg = 'Parámetros inválidos para la generación';
        }

        this.notification.error(errorMsg, NOTIFICATION_DURATION.LONG);
        this.isGenerating.set(false);
        this.generatorForm.enable();
      }
    });
  }

  /**
   * Verifica o desverifica una pregunta
   */
  toggleVerifyQuestion(questionId: number, currentState: boolean): void {
    this.adminService.verifyQuestion(questionId, !currentState).subscribe({
      next: (response: any) => {
        if (response.ok) {
          // Actualizar estado local
          const questions = this.allQuestions();
          const index = questions.findIndex(q => q.id === questionId);
          if (index !== -1) {
            const updated = [...questions];
            updated[index] = { ...updated[index], admin_verified: !currentState };
            this.allQuestions.set(updated);
          }

          this.notification.success(
            !currentState ? 'Pregunta verificada' : 'Verificación removida',
            NOTIFICATION_DURATION.SHORT
          );
        } else {
          this.notification.error(response.error || 'Error al cambiar estado de verificación', NOTIFICATION_DURATION.DEFAULT);
        }
      },
      error: (error) => {
        this.notification.error('Error al cambiar estado de verificación', NOTIFICATION_DURATION.DEFAULT);
      }
    });
  }

  /**
   * Solicita confirmación y borra una pregunta
   */
  deleteQuestion(questionId: number): void {
    const question = this.allQuestions().find(q => q.id === questionId);
    if (!question) return;

    // Mostrar confirmación
    this.deleteConfirmId.set(questionId);
  }

  /**
 * Confirma la eliminación de una pregunta
 */
  confirmDelete(questionId: number): void {
    this.adminService.deleteQuestion(questionId).subscribe({
      next: (response) => {
        if (response.ok) {
          const questions = this.allQuestions().filter(q => q.id !== questionId);
          this.allQuestions.set(questions);
          this.notification.success('Pregunta eliminada correctamente', NOTIFICATION_DURATION.SHORT);
          this.deleteConfirmId.set(null);
        } else {
          this.notification.error(response.error || 'Error al eliminar la pregunta', NOTIFICATION_DURATION.DEFAULT);
          this.deleteConfirmId.set(null);
        }
      },
      error: (error) => {
        this.notification.error('Error al eliminar pregunta', NOTIFICATION_DURATION.DEFAULT);
        this.deleteConfirmId.set(null);
      }
    });
  }

  /**
   * Cancela la eliminación
   */
  cancelDelete(): void {
    this.deleteConfirmId.set(null);
  }

  /**
   * Abre/cierra el panel de generación IA
   */
  toggleGenerator(): void {
    this.isGeneratorOpen.set(!this.isGeneratorOpen());
  }

  /**
   * Cierra sesión y redirige al login
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }

  /**
   * Navega al dashboard
   */
  goToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  /**
   * Obtiene el nombre de una categoría por ID
   */
  getCategoryName(categoryId: number): string {
    const cat = this.categories().find(c => c.id === categoryId);
    return cat?.name || 'Sin categoría';
  }

  /**
   * Formatea texto largo
   */
  truncateText(text: string, maxLength: number = 80): string {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
}
