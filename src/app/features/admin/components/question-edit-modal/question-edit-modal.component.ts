import { Component, Input, Output, EventEmitter, OnInit, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AdminService } from '../../../../core/services/admin.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AdminCategory, QuestionFull, QuestionOption, UpdateQuestionFullPayload } from '../../../../core/models/admin';
import { NOTIFICATION_DURATION } from '../../../../core/constants/notification-config.const';

@Component({
  selector: 'app-question-edit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './question-edit-modal.component.html',
  styleUrls: ['../../shared/styles/admin-styles.css', './question-edit-modal.component.css']
})
export class QuestionEditModalComponent implements OnInit, OnChanges {
  // ========== INPUTS & OUTPUTS ==========
  @Input() questionId: number | null = null;
  @Input() categories: AdminCategory[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  // ========== FORM ==========
  fullEditForm!: FormGroup;

  // ========== UI STATE ==========
  isLoadingQuestion = signal<boolean>(false);
  isSavingQuestion = signal<boolean>(false);
  questionToEdit = signal<QuestionFull | null>(null);

  constructor(
    private adminService: AdminService,
    private notification: NotificationService,
    private translate: TranslateService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    if (this.questionId) {
      this.loadQuestion(this.questionId);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['questionId'] && !changes['questionId'].firstChange && this.questionId) {
      this.loadQuestion(this.questionId);
    }
  }

  /**
   * Inicializa el formulario reactivo
   */
  private initForm(): void {
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
  }

  /**
   * Carga la pregunta desde el servicio
   */
  private loadQuestion(questionId: number): void {
    this.isLoadingQuestion.set(true);

    this.adminService.getQuestionFull(questionId).subscribe({
      next: (response) => {
        if (response.ok && response.question) {
          this.questionToEdit.set(response.question);
          this.populateFullEditForm(response.question);
        } else {
          this.notification.error(response.error || this.translate.instant('admin.questions.notifications.load_full_error'), NOTIFICATION_DURATION.DEFAULT);
          this.closeModal();
        }
        this.isLoadingQuestion.set(false);
      },
      error: (error) => {
        this.notification.error(this.translate.instant('admin.questions.notifications.load_full_error'), NOTIFICATION_DURATION.DEFAULT);
        this.isLoadingQuestion.set(false);
        this.closeModal();
      }
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
   * Cierra el modal
   */
  closeModal(): void {
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
    this.questionToEdit.set(null);
    this.close.emit();
  }

  /**
   * Guarda los cambios de la pregunta
   */
  saveQuestion(): void {
    const question = this.questionToEdit();
    if (!question) return;

    this.fullEditForm.markAllAsTouched();

    if (this.fullEditForm.invalid) {
      this.notification.warning(this.translate.instant('admin.questions.notifications.form_error'), NOTIFICATION_DURATION.DEFAULT);
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
          this.notification.success(response.message || this.translate.instant('admin.questions.notifications.update_success'), NOTIFICATION_DURATION.DEFAULT);
          this.saved.emit();
          this.closeModal();
        } else {
          this.notification.error(response.error || this.translate.instant('admin.questions.notifications.update_error'), NOTIFICATION_DURATION.DEFAULT);
        }
        this.isSavingQuestion.set(false);
      },
      error: (error) => {
        let errorMsg = this.translate.instant('admin.questions.notifications.update_error');
        if (error.error?.error) {
          errorMsg = error.error.error;
        }
        this.notification.error(errorMsg, NOTIFICATION_DURATION.DEFAULT);
        this.isSavingQuestion.set(false);
      }
    });
  }
}
