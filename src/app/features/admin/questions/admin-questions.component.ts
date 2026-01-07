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
  CsvImportResponse,
  QuestionFull,
  QuestionOption,
  UpdateQuestionFullPayload
} from '../../../core/models/admin';
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

  // ========== BATCH MANAGEMENT ==========
  batchStatistics = signal<BatchStatistics[]>([]);
  isCsvImportOpen = signal<boolean>(false);
  isImportingCsv = signal<boolean>(false);
  isVerifyingBatch = signal<boolean>(false);
  lastImportResult = signal<CsvImportResponse | null>(null);

  // ========== FULL QUESTION EDIT MODAL ==========
  isFullEditModalOpen = signal<boolean>(false);
  questionToEdit = signal<QuestionFull | null>(null);
  isLoadingQuestion = signal<boolean>(false);
  isSavingQuestion = signal<boolean>(false);
  fullEditForm: FormGroup;

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
      difficulty: [1, [Validators.required, Validators.min(1), Validators.max(5)]],
      quantity: [1, [Validators.required, this.quantityValidator]],
      language: ['es', [Validators.required]]
    });

    // Inicializar formulario de filtros
    this.filterForm = this.fb.group({
      search: ['', [Validators.maxLength(100)]],
      category: [null],
      status: ['all']
    });

    // Inicializar formulario de edición completa de pregunta
    this.fullEditForm = this.fb.group({
      statement: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      difficulty: [1, [Validators.required, Validators.min(1), Validators.max(5)]],
      category_id: [null, [Validators.required]],
      option_a: ['', [Validators.required, Validators.minLength(1)]],
      option_b: ['', [Validators.required, Validators.minLength(1)]],
      option_c: ['', [Validators.required, Validators.minLength(1)]],
      option_d: ['', [Validators.required, Validators.minLength(1)]],
      correct_option: ['a', [Validators.required]],
      explanation_correct: [''],
      explanation_incorrect: ['']
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
      formValues.difficulty,
      formValues.language
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
   * Verifica todas las preguntas pendientes
   */
  verifyAllPending(): void {
    const pendingCount = this.allQuestions().filter(q => !q.admin_verified).length;

    if (pendingCount === 0) {
      this.notification.info('No hay preguntas pendientes de verificación', NOTIFICATION_DURATION.SHORT);
      return;
    }

    this.isLoading.set(true);

    this.adminService.verifyBulk({ verify_all_pending: true }).subscribe({
      next: (response) => {
        if (response.ok) {
          this.notification.success(response.message || `${response.verified_count} preguntas verificadas`, NOTIFICATION_DURATION.DEFAULT);
          this.loadQuestions(); // Recargar preguntas
        } else {
          this.notification.error('Error al verificar preguntas', NOTIFICATION_DURATION.DEFAULT);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.notification.error('Error al verificar preguntas masivamente', NOTIFICATION_DURATION.DEFAULT);
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
      this.notification.info('No hay preguntas pendientes en este batch', NOTIFICATION_DURATION.SHORT);
      return;
    }

    if (!confirm(`¿Verificar las ${pendingCount} pregunta(s) pendiente(s) de este batch?`)) {
      return;
    }

    this.isLoading.set(true);

    this.adminService.verifyBulk({ batch_id: batchId }).subscribe({
      next: (response) => {
        if (response.ok) {
          this.notification.success(response.message || `${response.verified_count} preguntas verificadas`, NOTIFICATION_DURATION.DEFAULT);
          this.loadQuestions(); // Recargar preguntas
        } else {
          this.notification.error('Error al verificar batch', NOTIFICATION_DURATION.DEFAULT);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.notification.error('Error al verificar batch', NOTIFICATION_DURATION.DEFAULT);
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
          this.notification.error(response.error || 'Error al cargar estadísticas de batches', NOTIFICATION_DURATION.DEFAULT);
        }
      },
      error: (error) => {
        this.notification.error('Error al cargar estadísticas de batches', NOTIFICATION_DURATION.DEFAULT);
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
            `${response.verified_count} preguntas verificadas exitosamente`,
            NOTIFICATION_DURATION.DEFAULT
          );
          this.loadBatchStatistics();
          this.loadQuestions();
        } else {
          this.notification.error(response.error || 'Error al verificar batch', NOTIFICATION_DURATION.DEFAULT);
        }
        this.isVerifyingBatch.set(false);
      },
      error: (error) => {
        this.notification.error('Error al verificar batch', NOTIFICATION_DURATION.DEFAULT);
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
      this.notification.warning('El archivo debe ser CSV', NOTIFICATION_DURATION.DEFAULT);
      input.value = '';
      return;
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.notification.warning('El archivo no puede superar 5MB', NOTIFICATION_DURATION.DEFAULT);
      input.value = '';
      return;
    }

    this.importCsvFile(file);
    input.value = '';
  }

  /**
   * Importa un archivo CSV
   */
  importCsvFile(file: File): void {
    this.isImportingCsv.set(true);
    this.lastImportResult.set(null);
    this.notification.info('Importando archivo CSV...', NOTIFICATION_DURATION.LONG);

    this.adminService.importCsv(file).subscribe({
      next: (response: any) => {
        console.log('response', response)
        this.lastImportResult.set(response);

        if (response.ok) {
          if (response.errors > 0) {
            console.log('response with errors', response);
            
            this.notification.warning(
              `Importación parcial: ${response.imported} importadas, ${response.errors} errores`,
              NOTIFICATION_DURATION.LONG
            );
          } else {
            this.notification.success(
              `${response.imported} preguntas importadas exitosamente`,
              NOTIFICATION_DURATION.DEFAULT
            );
          }
          // Recargar datos
          this.loadQuestions();
          this.loadBatchStatistics();
        } else {
          this.notification.error(response.error || 'Error al importar CSV', NOTIFICATION_DURATION.LONG);
        }
        this.isImportingCsv.set(false);
      },
      error: (error) => {
        let errorMsg = 'Error al importar CSV';
        if (error.status === HttpStatus.BAD_REQUEST) {
          errorMsg = error.error?.error || 'Archivo CSV inválido';
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
    this.isLoadingQuestion.set(true);
    this.isFullEditModalOpen.set(true);

    this.adminService.getQuestionFull(questionId).subscribe({
      next: (response) => {
        if (response.ok && response.question) {
          this.questionToEdit.set(response.question);
          this.populateFullEditForm(response.question);
        } else {
          this.notification.error(response.error || 'Error al cargar la pregunta', NOTIFICATION_DURATION.DEFAULT);
          this.closeFullEditModal();
        }
        this.isLoadingQuestion.set(false);
      },
      error: (error) => {
        this.notification.error('Error al cargar la pregunta', NOTIFICATION_DURATION.DEFAULT);
        this.isLoadingQuestion.set(false);
        this.closeFullEditModal();
      }
    });
  }

  /**
   * Cierra el modal de edición completa
   */
  closeFullEditModal(): void {
    this.isFullEditModalOpen.set(false);
    this.questionToEdit.set(null);
    this.fullEditForm.reset({
      statement: '',
      difficulty: 1,
      category_id: null,
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_option: 'a',
      explanation_correct: '',
      explanation_incorrect: ''
    });
  }

  /**
   * Pobla el formulario con los datos de la pregunta
   */
  private populateFullEditForm(question: QuestionFull): void {
    // Mapear opciones a campos del formulario
    const options = question.options || [];
    const optionA = options[0]?.text || '';
    const optionB = options[1]?.text || '';
    const optionC = options[2]?.text || '';
    const optionD = options[3]?.text || '';

    // Determinar cuál es la correcta
    let correctOption = 'a';
    options.forEach((opt, index) => {
      if (opt.is_correct) {
        correctOption = ['a', 'b', 'c', 'd'][index] || 'a';
      }
    });

    // Obtener explicaciones
    const explanations = question.explanations || [];
    const correctExp = explanations.find(e => e.type === 'correct')?.text || '';
    const incorrectExp = explanations.find(e => e.type === 'incorrect')?.text || '';

    this.fullEditForm.patchValue({
      statement: question.statement,
      difficulty: question.difficulty,
      category_id: question.category_id,
      option_a: optionA,
      option_b: optionB,
      option_c: optionC,
      option_d: optionD,
      correct_option: correctOption,
      explanation_correct: correctExp,
      explanation_incorrect: incorrectExp
    });
  }

  /**
   * Guarda los cambios de la pregunta
   */
  saveFullQuestion(): void {
    const question = this.questionToEdit();
    if (!question) return;

    this.fullEditForm.markAllAsTouched();

    if (this.fullEditForm.invalid) {
      this.notification.warning('Por favor corrige los errores del formulario', NOTIFICATION_DURATION.DEFAULT);
      return;
    }

    const formValues = this.fullEditForm.value;

    // Construir array de opciones
    const optionLetters = ['a', 'b', 'c', 'd'];
    const options: QuestionOption[] = optionLetters.map((letter, index) => ({
      text: formValues[`option_${letter}`],
      is_correct: formValues.correct_option === letter
    }));

    // Construir payload
    const payload: UpdateQuestionFullPayload = {
      statement: formValues.statement,
      difficulty: formValues.difficulty,
      category_id: formValues.category_id,
      options: options
    };

    // Agregar explicaciones si tienen contenido
    if (formValues.explanation_correct?.trim()) {
      payload.explanation_correct = formValues.explanation_correct.trim();
    }
    if (formValues.explanation_incorrect?.trim()) {
      payload.explanation_incorrect = formValues.explanation_incorrect.trim();
    }

    this.isSavingQuestion.set(true);

    this.adminService.updateQuestionFull(question.id, payload).subscribe({
      next: (response) => {
        if (response.ok) {
          this.notification.success('Pregunta actualizada exitosamente. Estado: Pendiente de verificación.', NOTIFICATION_DURATION.DEFAULT);
          this.closeFullEditModal();
          // Recargar datos
          this.loadQuestions();
        } else {
          this.notification.error(response.error || 'Error al actualizar la pregunta', NOTIFICATION_DURATION.DEFAULT);
        }
        this.isSavingQuestion.set(false);
      },
      error: (error) => {
        let errorMsg = 'Error al actualizar la pregunta';
        if (error.error?.error) {
          errorMsg = error.error.error;
        }
        this.notification.error(errorMsg, NOTIFICATION_DURATION.DEFAULT);
        this.isSavingQuestion.set(false);
      }
    });
  }
}
