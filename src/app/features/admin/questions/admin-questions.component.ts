import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  AdminCategory,
  GenerationResponse,
  BatchStatistics,
  CsvImportResponse
} from '../../../core/models/admin';
import { Question } from '../../../core/models/game';
import { HttpStatus } from '../../../core/constants/http-status.const';
import { NOTIFICATION_DURATION } from '../../../core/constants/notification-config.const';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { QuestionEditModalComponent } from '../components/question-edit-modal/question-edit-modal.component';

@Component({
  selector: 'app-admin-questions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, QuestionEditModalComponent],
  templateUrl: './admin-questions.component.html',
  styleUrls: [
    '../shared/styles/admin-styles.css',
    './admin-questions.component.css'
  ]
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

  // ========== BATCH MANAGEMENT ==========
  batchStatistics = signal<BatchStatistics[]>([]);
  isCsvImportOpen = signal<boolean>(false);
  isImportingCsv = signal<boolean>(false);
  isDownloadingTemplate = signal<boolean>(false);
  isVerifyingBatch = signal<boolean>(false);
  lastImportResult = signal<CsvImportResponse | null>(null);

  // ========== FULL QUESTION EDIT MODAL ==========
  isFullEditModalOpen = signal<boolean>(false);
  selectedQuestionId = signal<number | null>(null);

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

  // ========== GETTERS ==========
  /**
   * Retorna el número de preguntas pendientes de verificación
   */
  get pendingQuestionsCount(): number {
    return this.allQuestions().filter(q => !q.admin_verified).length;
  }

  /**
   * Retorna el número de preguntas verificadas
   */
  get verifiedQuestionsCount(): number {
    return this.allQuestions().filter(q => q.admin_verified).length;
  }

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private authService: AuthService,
    private notification: NotificationService,
    private translate: TranslateService,
    private router: Router
  ) {
    // Inicializar formulario del generador
    this.generatorForm = this.fb.group({
      categoryId: [null, [Validators.required]],
      difficulty: [1, [Validators.required, Validators.min(1), Validators.max(5)]],
      quantity: [1, [Validators.required, this.quantityValidator]],
      language: ['es', [Validators.required]]
    });

    // Inicializar formulario de filtros
    this.filterForm = this.fb.group({
      search: ['', [Validators.maxLength(100)]],
      category: [null],
      status: ['all'],
      activeStatus: ['active']  // Filtro de estado activo/inactivo
    });

    // Suscribirse a cambios en los filtros para activar el recomputo
    this.filterForm.valueChanges.subscribe((values) => {
      this.filterTrigger.set(this.filterTrigger() + 1);
      // Si cambia el filtro de activeStatus, recargar desde backend
      if (values.activeStatus !== this._lastActiveStatus) {
        this._lastActiveStatus = values.activeStatus;
        this.loadQuestions();
      }
    });
  }

  // Variable para trackear el último estado de activeStatus
  private _lastActiveStatus: string = 'active';

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
 * Carga la lista de preguntas desde el backend con filtro de estado
 */
  private loadQuestions(): void {
    this.isLoading.set(true);

    // Obtener el filtro de estado activo/inactivo
    const activeStatus = this.filterForm?.get('activeStatus')?.value || 'active';

    this.adminService.getQuestions(activeStatus as 'active' | 'inactive' | 'all').subscribe({
      next: (response) => {
        this.allQuestions.set(response.questions || []);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.notification.error(this.translate.instant('admin.questions.notifications.load_error'), NOTIFICATION_DURATION.DEFAULT);
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
        this.notification.warning(this.translate.instant('admin.questions.notifications.categories_load_error'), NOTIFICATION_DURATION.SHORT);
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
        this.notification.warning(this.translate.instant('admin.questions.notifications.select_category'), NOTIFICATION_DURATION.DEFAULT);
      } else if (this.generatorForm.get('quantity')?.hasError('required')) {
        this.notification.warning(this.translate.instant('admin.questions.notifications.enter_quantity'), NOTIFICATION_DURATION.DEFAULT);
      } else if (this.generatorForm.get('quantity')?.hasError('invalidQuantity')) {
        this.notification.warning(this.translate.instant('admin.questions.notifications.quantity_range'), NOTIFICATION_DURATION.DEFAULT);
      } else if (this.generatorForm.get('difficulty')?.hasError('min') || this.generatorForm.get('difficulty')?.hasError('max')) {
        this.notification.warning(this.translate.instant('admin.questions.notifications.difficulty_range'), NOTIFICATION_DURATION.DEFAULT);
      }
      return;
    }

    this.isGenerating.set(true);
    this.notification.info(this.translate.instant('admin.questions.notifications.generating'), NOTIFICATION_DURATION.LONG);
    this.generatorForm.disable();

    const formValues = this.generatorForm.getRawValue();

    // Llamar al servicio
    this.adminService.generateBatch(
      formValues.quantity,
      formValues.categoryId,
      formValues.difficulty,
      formValues.language
    ).subscribe({
      next: (response: GenerationResponse) => {
        const generatedCount = response.generated ?? 0;

        if (response.ok && generatedCount > 0) {
          // Éxito: se generaron preguntas
          this.notification.success(
            response.message || this.translate.instant('admin.questions.notifications.generated_success', { count: generatedCount }),
            NOTIFICATION_DURATION.DEFAULT
          );
          this.isGenerating.set(false);

          // Resetear formulario
          this.generatorForm.reset({
            categoryId: null,
            difficulty: 1,
            quantity: 1,
            language: 'es'
          });
          this.generatorForm.enable();
          this.isGeneratorOpen.set(false);

          // Recargar preguntas
          this.loadQuestions();
        } else if (response.ok && generatedCount === 0) {
          // Respuesta OK pero no se generaron preguntas
          const failedCount = response.failed ?? 0;
          const errorMsg = response.message || response.error || this.translate.instant('admin.questions.notifications.generated_failed', { count: failedCount });
          this.notification.error(errorMsg, NOTIFICATION_DURATION.LONG);
          this.isGenerating.set(false);
          this.generatorForm.enable();
        } else {
          // Error general
          const errorMsg = response.error || this.translate.instant('admin.questions.notifications.generation_error');
          this.notification.error(errorMsg, NOTIFICATION_DURATION.DEFAULT);
          this.isGenerating.set(false);
          this.generatorForm.enable();
        }
      },
      error: (error) => {
        let errorMsg = this.translate.instant('admin.questions.notifications.generation_error');

        if (error.status === HttpStatus.UNAUTHORIZED) {
          errorMsg = this.translate.instant('admin.questions.notifications.unauthorized');
        } else if (error.status === HttpStatus.BAD_REQUEST) {
          errorMsg = this.translate.instant('admin.questions.notifications.invalid_params_generation');
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
            !currentState ? this.translate.instant('admin.questions.notifications.verified') : this.translate.instant('admin.questions.notifications.unverified'),
            NOTIFICATION_DURATION.SHORT
          );
        } else {
          this.notification.error(response.error || this.translate.instant('admin.questions.notifications.verify_error'), NOTIFICATION_DURATION.DEFAULT);
        }
      },
      error: (error) => {
        this.notification.error(this.translate.instant('admin.questions.notifications.verify_error'), NOTIFICATION_DURATION.DEFAULT);
      }
    });
  }

  /**
   * Verifica todas las preguntas pendientes
   */
  verifyAllPending(): void {
    const pendingCount = this.allQuestions().filter(q => !q.admin_verified).length;

    if (pendingCount === 0) {
      this.notification.info(this.translate.instant('admin.questions.notifications.no_pending'), NOTIFICATION_DURATION.SHORT);
      return;
    }

    this.isLoading.set(true);

    this.adminService.verifyBulk({ verify_all_pending: true }).subscribe({
      next: (response) => {
        if (response.ok) {
          console.log('aa', response.message);
          this.notification.success(response.message || this.translate.instant('admin.questions.notifications.bulk_verify_success', { count: response.verified_count }), NOTIFICATION_DURATION.DEFAULT);
          this.loadQuestions(); // Recargar preguntas
        } else {
          this.notification.error(this.translate.instant('admin.questions.notifications.verify_error'), NOTIFICATION_DURATION.DEFAULT);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.notification.error(this.translate.instant('admin.questions.notifications.bulk_verify_error'), NOTIFICATION_DURATION.DEFAULT);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Verifica todas las preguntas de un batch específico
   */
  verifyBatchQuestions(batchId: number): void {
    const batchQuestions = this.allQuestions().filter(q => q.batch_id === batchId && !q.admin_verified);
    const pendingCount = batchQuestions.length;

    if (pendingCount === 0) {
      this.notification.info(this.translate.instant('admin.questions.notifications.no_pending_batch'), NOTIFICATION_DURATION.SHORT);
      return;
    }

    if (!confirm(this.translate.instant('admin.questions.notifications.verify_batch_confirm', { count: pendingCount }))) {
      return;
    }

    this.isLoading.set(true);

    this.adminService.verifyBulk({ batch_id: batchId }).subscribe({
      next: (response) => {
        if (response.ok) {
          this.notification.success(response.message || this.translate.instant('admin.questions.notifications.bulk_verify_success', { count: response.verified_count }), NOTIFICATION_DURATION.DEFAULT);
          this.loadQuestions(); // Recargar preguntas
        } else {
          this.notification.error(this.translate.instant('admin.questions.notifications.verify_batch_error'), NOTIFICATION_DURATION.DEFAULT);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.notification.error(this.translate.instant('admin.questions.notifications.verify_batch_error'), NOTIFICATION_DURATION.DEFAULT);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Desverifica todas las preguntas verificadas
   */
  unverifyAll(): void {
    const verifiedCount = this.verifiedQuestionsCount;

    if (verifiedCount === 0) {
      this.notification.info(this.translate.instant('admin.questions.notifications.no_verified'), NOTIFICATION_DURATION.SHORT);
      return;
    }

    this.isLoading.set(true);

    this.adminService.unverifyBulk().subscribe({
      next: (response) => {
        if (response.ok) {
          this.notification.success(
            response.message || this.translate.instant('admin.questions.notifications.bulk_unverify_success', { count: response.unverified_count }),
            NOTIFICATION_DURATION.DEFAULT
          );
          this.loadQuestions();
        } else {
          this.notification.error(this.translate.instant('admin.questions.notifications.bulk_unverify_error'), NOTIFICATION_DURATION.DEFAULT);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.notification.error(this.translate.instant('admin.questions.notifications.bulk_unverify_error'), NOTIFICATION_DURATION.DEFAULT);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Elimina todas las preguntas pendientes (no verificadas)
   */
  deleteAllPending(): void {
    const pendingCount = this.pendingQuestionsCount;

    if (pendingCount === 0) {
      this.notification.info(this.translate.instant('admin.questions.notifications.no_pending'), NOTIFICATION_DURATION.SHORT);
      return;
    }

    this.isLoading.set(true);

    this.adminService.deleteBulk({ delete_all_pending: true }).subscribe({
      next: (response) => {
        if (response.ok) {
          this.notification.success(
            response.message || this.translate.instant('admin.questions.notifications.bulk_delete_success', { count: response.deleted_count }),
            NOTIFICATION_DURATION.DEFAULT
          );
          this.loadQuestions();
        } else {
          this.notification.error(this.translate.instant('admin.questions.notifications.bulk_delete_error'), NOTIFICATION_DURATION.DEFAULT);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.notification.error(this.translate.instant('admin.questions.notifications.bulk_delete_error'), NOTIFICATION_DURATION.DEFAULT);
        this.isLoading.set(false);
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
          this.notification.success(this.translate.instant('admin.questions.notifications.delete_success'), NOTIFICATION_DURATION.SHORT);
          this.deleteConfirmId.set(null);
        } else {
          this.notification.error(response.error || this.translate.instant('admin.questions.notifications.delete_error'), NOTIFICATION_DURATION.DEFAULT);
          this.deleteConfirmId.set(null);
        }
      },
      error: (error) => {
        this.notification.error(this.translate.instant('admin.questions.notifications.delete_error'), NOTIFICATION_DURATION.DEFAULT);
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
   * Restaura una pregunta eliminada lógicamente
   */
  restoreQuestion(questionId: number): void {
    this.adminService.restoreQuestion(questionId).subscribe({
      next: (response) => {
        if (response.ok) {
          this.notification.success(
            this.translate.instant('admin.questions.notifications.restore_success'),
            NOTIFICATION_DURATION.SHORT
          );
          // Recargar preguntas para actualizar la lista
          this.loadQuestions();
        } else {
          this.notification.error(
            response.message || this.translate.instant('admin.questions.notifications.restore_error'),
            NOTIFICATION_DURATION.DEFAULT
          );
        }
      },
      error: (error) => {
        this.notification.error(
          this.translate.instant('admin.questions.notifications.restore_error'),
          NOTIFICATION_DURATION.DEFAULT
        );
      }
    });
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

  // ========== BATCH MANAGEMENT METHODS ==========

  /**
   * Toggle de la sección de importación CSV
   */
  toggleCsvImportSection(): void {
    this.isCsvImportOpen.set(!this.isCsvImportOpen());
    this.lastImportResult.set(null);
  }

  /**
   * Carga las estadísticas de batches
   */
  loadBatchStatistics(): void {
    this.adminService.getBatchStatistics().subscribe({
      next: (response) => {
        if (response.ok) {
          this.batchStatistics.set(response.batches || []);
        } else {
          this.notification.error(response.error || this.translate.instant('admin.questions.notifications.load_batch_stats_error'), NOTIFICATION_DURATION.DEFAULT);
        }
      },
      error: (error) => {
        this.notification.error(this.translate.instant('admin.questions.notifications.load_batch_stats_error'), NOTIFICATION_DURATION.DEFAULT);
      }
    });
  }

  /**
   * Verifica todas las preguntas de un batch
   */
  verifyBatch(batchId: number): void {
    this.isVerifyingBatch.set(true);

    this.adminService.verifyBatch(batchId).subscribe({
      next: (response) => {
        if (response.ok) {
          this.notification.success(
            response.message || this.translate.instant('admin.questions.notifications.verify_batch_success', { count: response.verified_count }),
            NOTIFICATION_DURATION.DEFAULT
          );
          this.loadBatchStatistics();
          this.loadQuestions();
        } else {
          this.notification.error(response.error || this.translate.instant('admin.questions.notifications.verify_batch_error'), NOTIFICATION_DURATION.DEFAULT);
        }
        this.isVerifyingBatch.set(false);
      },
      error: (error) => {
        this.notification.error(this.translate.instant('admin.questions.notifications.verify_batch_error'), NOTIFICATION_DURATION.DEFAULT);
        this.isVerifyingBatch.set(false);
      }
    });
  }

  /**
   * Maneja la selección de archivo CSV
   */
  onCsvFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // Validar tipo de archivo
    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.notification.warning(this.translate.instant('admin.questions.notifications.csv_type_error'), NOTIFICATION_DURATION.DEFAULT);
      input.value = '';
      return;
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.notification.warning(this.translate.instant('admin.questions.notifications.csv_size_error'), NOTIFICATION_DURATION.DEFAULT);
      input.value = '';
      return;
    }

    this.importCsvFile(file);
    input.value = '';
  }

  /**
   * Descarga la plantilla CSV para importar preguntas
   */
  downloadCsvTemplate(): void {
    this.isDownloadingTemplate.set(true);

    this.adminService.downloadCsvTemplate().subscribe({
      next: () => {
        this.notification.success(
          this.translate.instant('admin.questions.notifications.template_downloaded'),
          NOTIFICATION_DURATION.DEFAULT
        );
        this.isDownloadingTemplate.set(false);
      },
      error: () => {
        this.notification.error(
          this.translate.instant('admin.questions.notifications.template_download_error'),
          NOTIFICATION_DURATION.DEFAULT
        );
        this.isDownloadingTemplate.set(false);
      }
    });
  }

  /**
   * Importa un archivo CSV
   */
  importCsvFile(file: File): void {
    this.isImportingCsv.set(true);
    this.lastImportResult.set(null);
    this.notification.info(this.translate.instant('admin.questions.notifications.csv_importing'), NOTIFICATION_DURATION.LONG);

    this.adminService.importCsv(file).subscribe({
      next: (response: any) => {
        console.log('response', response)
        this.lastImportResult.set(response);

        if (response.ok) {
          if (response.errors > 0) {
            console.log('response with errors', response);

            this.notification.warning(
              this.translate.instant('admin.questions.notifications.csv_import_partial', { imported: response.imported, errors: response.errors }),
              NOTIFICATION_DURATION.LONG
            );
          } else {
            this.notification.success(
              response.message || this.translate.instant('admin.questions.notifications.csv_import_success', { imported: response.imported }),
              NOTIFICATION_DURATION.DEFAULT
            );
          }
          // Recargar datos
          this.loadQuestions();
          this.loadBatchStatistics();
        } else {
          this.notification.error(response.error || this.translate.instant('admin.questions.notifications.csv_import_error'), NOTIFICATION_DURATION.LONG);
        }
        this.isImportingCsv.set(false);
      },
      error: (error) => {
        let errorMsg = this.translate.instant('admin.questions.notifications.csv_import_error');
        if (error.status === HttpStatus.BAD_REQUEST) {
          errorMsg = error.error?.error || this.translate.instant('admin.questions.notifications.csv_invalid');
        }
        this.notification.error(errorMsg, NOTIFICATION_DURATION.LONG);
        this.isImportingCsv.set(false);
      }
    });
  }

  /**
   * Obtiene el nombre del batch por ID
   */
  getBatchName(batchId: number | null): string {
    if (!batchId) return 'Sin batch';
    const batch = this.batchStatistics().find(b => b.id === batchId);
    return batch?.batch_name || `Batch #${batchId}`;
  }

  // ========== FULL QUESTION EDIT METHODS ==========

  /**
   * Abre el modal de edición completa de pregunta
   */
  openFullEditModal(questionId: number): void {
    this.selectedQuestionId.set(questionId);
    this.isFullEditModalOpen.set(true);
  }

  /**
   * Cierra el modal de edición completa
   */
  closeFullEditModal(): void {
    this.isFullEditModalOpen.set(false);
    this.selectedQuestionId.set(null);
  }

  /**
   * Maneja el evento cuando el modal guarda los cambios
   */
  onQuestionSaved(): void {
    this.loadQuestions();
  }
}
