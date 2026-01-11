import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AdminQuestionsComponent } from './admin-questions.component';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
    QuestionFull,
    QuestionFullResponse,
    UpdateQuestionFullResponse,
    GetQuestionsResponse,
    DeleteQuestionResponse,
    GenerationResponse,
    GenerateBatchResponse,
    GetCategoriesResponse,
    AdminQuestion
} from '../../../core/models/admin';
import { Question } from '../../../core/models/game';

describe('AdminQuestionsComponent - CRUD Tests', () => {
    let component: AdminQuestionsComponent;
    let fixture: ComponentFixture<AdminQuestionsComponent>;
    let adminService: jasmine.SpyObj<AdminService>;
    let authService: jasmine.SpyObj<AuthService>;
    let notificationService: jasmine.SpyObj<NotificationService>;
    let router: jasmine.SpyObj<Router>;

    // Mock data
    const mockQuestions: AdminQuestion[] = [
        {
            id: 1,
            statement: '¿Cuál es el principal factor de riesgo para el cáncer de colon?',
            difficulty: 3,
            category_id: 2,
            category_name: 'Factores de Riesgo',
            admin_verified: false,
            is_ai_generated: true,

        },
        {
            id: 2,
            statement: '¿Qué edad se recomienda para comenzar el tamizaje de cáncer de colon?',
            difficulty: 2,
            category_id: 3,
            category_name: 'Tamizaje y Detección',
            admin_verified: true,
            is_ai_generated: false,

        }
    ];

    const mockQuestionFull: QuestionFull = {
        id: 1,
        statement: '¿Cuál es el principal factor de riesgo para el cáncer de colon?',
        difficulty: 3,
        category_id: 2,
        is_ai_generated: true,
        admin_verified: false,
        batch_id: 1,
        options: [
            { id: 1, text: 'Edad mayor a 50 años', is_correct: true },
            { id: 2, text: 'Dieta alta en fibra', is_correct: false },
            { id: 3, text: 'Ejercicio regular', is_correct: false },
            { id: 4, text: 'Consumo de agua', is_correct: false }
        ],
        explanations: [
            { id: 1, text: 'La edad es uno de los principales factores de riesgo.', type: 'correct' },
            { id: 2, text: 'Esta no es la respuesta correcta.', type: 'incorrect' }
        ],
        category_name: ''
    };

    const mockCategories = [
        { id: 1, name: 'Epidemiología y Generalidades', description: '' },
        { id: 2, name: 'Factores de Riesgo', description: '' },
        { id: 3, name: 'Tamizaje y Detección', description: '' }
    ];

    beforeEach(async () => {
        // Create spies for services
        const adminServiceSpy = jasmine.createSpyObj('AdminService', [
            'getQuestions',
            'getQuestionFull',
            'updateQuestion',
            'updateQuestionFull',
            'deleteQuestion',
            'generateBatch',
            'getCategories',
            'verifyQuestion',
            'verifyBulk'
        ]);

        const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
        const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
            'success',
            'error',
            'warning',
            'info'
        ]);
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [AdminQuestionsComponent, ReactiveFormsModule],
            providers: [
                { provide: AdminService, useValue: adminServiceSpy },
                { provide: AuthService, useValue: authServiceSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: Router, useValue: routerSpy }
            ]
        }).compileComponents();

        adminService = TestBed.inject(AdminService) as jasmine.SpyObj<AdminService>;
        authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
        notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

        // Default spy returns
        adminService.getQuestions.and.returnValue(of({ ok: true, questions: mockQuestions }));
        adminService.getCategories.and.returnValue(of({ ok: true, categories: mockCategories }));

        fixture = TestBed.createComponent(AdminQuestionsComponent);
        component = fixture.componentInstance;
    });

    describe('Component Initialization', () => {
        it('should create the component', () => {
            expect(component).toBeTruthy();
        });

        it('should load questions on init', () => {
            fixture.detectChanges();
            expect(adminService.getQuestions).toHaveBeenCalled();
            expect(component.allQuestions().length).toBe(2);
        });

        it('should load categories on init', () => {
            fixture.detectChanges();
            expect(adminService.getCategories).toHaveBeenCalled();
            expect(component.categories().length).toBe(3);
        });
    });

    // ========== READ OPERATIONS ==========
    describe('READ Operations', () => {
        beforeEach(() => {
            fixture.detectChanges();
        });

        it('should get all questions successfully', () => {
            expect(component.allQuestions().length).toBe(2);
            expect(component.allQuestions()[0].statement).toContain('factor de riesgo');
            expect(component.isLoading()).toBe(false);
        });

        it('should handle error when loading questions', () => {
            adminService.getQuestions.and.returnValue(
                throwError(() => ({ status: 500, message: 'Server error' }))
            );

            component['loadQuestions']();

            expect(notificationService.error).toHaveBeenCalledWith(
                jasmine.stringContaining('Error al cargar preguntas'),
                jasmine.any(Number)
            );
        });

        it('should get full question details successfully', () => {
            const mockResponse: QuestionFullResponse = {
                ok: true,
                question: mockQuestionFull
            };

            adminService.getQuestionFull.and.returnValue(of(mockResponse));

            component.openFullEditModal(1);

            expect(adminService.getQuestionFull).toHaveBeenCalledWith(1);
            expect(component.questionToEdit()?.id).toBe(1);
            expect(component.questionToEdit()?.options.length).toBe(4);
        });

        it('should handle error when loading full question', () => {
            adminService.getQuestionFull.and.returnValue(
                throwError(() => ({ status: 404, message: 'Not found' }))
            );

            component.openFullEditModal(999);

            expect(notificationService.error).toHaveBeenCalledWith(
                jasmine.stringContaining('Error al cargar la pregunta'),
                jasmine.any(Number)
            );
        });

        it('should filter questions by category', () => {
            component.filterForm.patchValue({ category: 2 });
            const filtered = component.filteredQuestions();

            expect(filtered.length).toBe(1);
            expect(filtered[0].category_id).toBe(2);
        });

        it('should filter questions by verification status', () => {
            component.filterForm.patchValue({ status: 'verified' });
            const filtered = component.filteredQuestions();

            expect(filtered.length).toBe(1);
            expect(filtered[0].admin_verified).toBe(true);
        });

        it('should search questions by text', () => {
            component.filterForm.patchValue({ search: 'tamizaje' });
            const filtered = component.filteredQuestions();

            expect(filtered.length).toBe(1);
            expect(filtered[0].statement).toContain('tamizaje');
        });
    });

    // ========== CREATE OPERATIONS ==========
    describe('CREATE Operations', () => {
        beforeEach(() => {
            fixture.detectChanges();
        });

        it('should generate questions with AI successfully', () => {
            const mockGenerationResponse: GenerateBatchResponse = {
                ok: true,
                generated: 5,
                failed: 0,
                message: '5 preguntas generadas',
                batch_id: 123,
                batch_name: 'Batch Test',
                language: 'es',
                questions: []
            };

            adminService.generateBatch.and.returnValue(of(mockGenerationResponse));

            component.generatorForm.patchValue({
                categoryId: 2,
                difficulty: 3,
                quantity: 5,
                language: 'es'
            });

            component.generateQuestionsWithAI();

            expect(adminService.generateBatch).toHaveBeenCalledWith(5, 2, 3, 'es');
            expect(notificationService.success).toHaveBeenCalledWith(
                jasmine.stringContaining('5 preguntas generadas'),
                jasmine.any(Number)
            );
            expect(adminService.getQuestions).toHaveBeenCalled();
        });

        it('should validate generator form before generating', () => {
            component.generatorForm.patchValue({
                categoryId: null,
                difficulty: 3,
                quantity: 5,
                language: 'es'
            });

            component.generateQuestionsWithAI();

            expect(adminService.generateBatch).not.toHaveBeenCalled();
            expect(notificationService.warning).toHaveBeenCalledWith(
                jasmine.stringContaining('selecciona una categoría'),
                jasmine.any(Number)
            );
        });

        it('should validate quantity range (1-50)', () => {
            component.generatorForm.patchValue({
                categoryId: 2,
                difficulty: 3,
                quantity: 100, // Invalid
                language: 'es'
            });

            component.generateQuestionsWithAI();

            expect(adminService.generateBatch).not.toHaveBeenCalled();
            expect(notificationService.warning).toHaveBeenCalled();
        });

        it('should handle generation errors', () => {
            adminService.generateBatch.and.returnValue(
                throwError(() => ({ status: 500 }))
            );

            component.generatorForm.patchValue({
                categoryId: 2,
                difficulty: 3,
                quantity: 5,
                language: 'es'
            });

            component.generateQuestionsWithAI();

            expect(notificationService.error).toHaveBeenCalledWith(
                jasmine.stringContaining('Error al generar preguntas'),
                jasmine.any(Number)
            );
        });

        it('should handle partial generation failures', () => {
            const mockResponse: GenerateBatchResponse = {
                ok: true,
                generated: 0,
                failed: 5,
                message: 'No se pudieron generar preguntas',
                batch_id: 123,
                batch_name: 'Batch Fail',
                language: 'es',
                questions: []
            };

            adminService.generateBatch.and.returnValue(of(mockResponse));

            component.generatorForm.patchValue({
                categoryId: 2,
                difficulty: 3,
                quantity: 5,
                language: 'es'
            });

            component.generateQuestionsWithAI();

            expect(notificationService.error).toHaveBeenCalled();
        });
    });

    // ========== UPDATE OPERATIONS ==========
    describe('UPDATE Operations', () => {
        beforeEach(() => {
            fixture.detectChanges();
        });

        it('should update full question successfully', () => {
            const mockResponse: UpdateQuestionFullResponse = {
                ok: true,
                message: 'Pregunta actualizada',
                question: mockQuestionFull
            };

            adminService.getQuestionFull.and.returnValue(
                of({ ok: true, question: mockQuestionFull })
            );
            adminService.updateQuestionFull.and.returnValue(of(mockResponse));

            component.openFullEditModal(1);
            fixture.detectChanges();

            // Modify form
            component.fullEditForm.patchValue({
                statement: 'Nueva pregunta actualizada',
                difficulty: 4
            });

            component.saveFullQuestion();

            expect(adminService.updateQuestionFull).toHaveBeenCalledWith(
                1,
                jasmine.objectContaining({
                    statement: 'Nueva pregunta actualizada',
                    difficulty: 4
                })
            );
            expect(notificationService.success).toHaveBeenCalledWith(
                jasmine.stringContaining('actualizada exitosamente'),
                jasmine.any(Number)
            );
        });

        it('should validate full edit form before saving', () => {
            component.questionToEdit.set(mockQuestionFull);
            component.isFullEditModalOpen.set(true);

            component.fullEditForm.patchValue({
                statement: '', // Invalid - required
                difficulty: 3
            });

            component.saveFullQuestion();

            expect(adminService.updateQuestionFull).not.toHaveBeenCalled();
            expect(notificationService.warning).toHaveBeenCalledWith(
                jasmine.stringContaining('corrige los errores'),
                jasmine.any(Number)
            );
        });

        it('should verify a question successfully', () => {
            adminService.verifyQuestion.and.returnValue(of({ ok: true }));

            component.toggleVerifyQuestion(1, false);

            expect(adminService.verifyQuestion).toHaveBeenCalledWith(1, true);
            expect(notificationService.success).toHaveBeenCalledWith(
                jasmine.stringContaining('Pregunta verificada'),
                jasmine.any(Number)
            );
        });

        it('should unverify a question successfully', () => {
            adminService.verifyQuestion.and.returnValue(of({ ok: true }));

            component.toggleVerifyQuestion(2, true);

            expect(adminService.verifyQuestion).toHaveBeenCalledWith(2, false);
            expect(notificationService.success).toHaveBeenCalledWith(
                jasmine.stringContaining('Verificación removida'),
                jasmine.any(Number)
            );
        });

        it('should verify all pending questions', () => {
            adminService.verifyBulk.and.returnValue(
                of({ ok: true, message: '1 pregunta verificada', verified_count: 1 })
            );

            component.verifyAllPending();

            expect(adminService.verifyBulk).toHaveBeenCalledWith({
                verify_all_pending: true
            });
            expect(notificationService.success).toHaveBeenCalled();
        });

        it('should handle error when updating question', () => {
            adminService.getQuestionFull.and.returnValue(
                of({ ok: true, question: mockQuestionFull })
            );
            adminService.updateQuestionFull.and.returnValue(
                throwError(() => ({ status: 400, error: { error: 'Invalid data' } }))
            );

            component.openFullEditModal(1);
            component.saveFullQuestion();

            expect(notificationService.error).toHaveBeenCalledWith(
                jasmine.stringContaining('Invalid data'),
                jasmine.any(Number)
            );
        });
    });

    // ========== DELETE OPERATIONS ==========
    describe('DELETE Operations', () => {
        beforeEach(() => {
            fixture.detectChanges();
        });

        it('should delete a question successfully', () => {
            const mockResponse: DeleteQuestionResponse = {
                ok: true,
                message: 'Pregunta eliminada'
            };

            adminService.deleteQuestion.and.returnValue(of(mockResponse));

            // Trigger delete
            component.deleteQuestion(1);
            expect(component.deleteConfirmId()).toBe(1);

            // Confirm delete
            component.confirmDelete(1);

            expect(adminService.deleteQuestion).toHaveBeenCalledWith(1);
            expect(notificationService.success).toHaveBeenCalledWith(
                jasmine.stringContaining('Pregunta eliminada'),
                jasmine.any(Number)
            );
            expect(component.allQuestions().length).toBe(1);
            expect(component.deleteConfirmId()).toBeNull();
        });

        it('should cancel delete operation', () => {
            component.deleteQuestion(1);
            expect(component.deleteConfirmId()).toBe(1);

            component.cancelDelete();
            expect(component.deleteConfirmId()).toBeNull();
        });

        it('should handle error when deleting question', () => {
            adminService.deleteQuestion.and.returnValue(
                throwError(() => ({ status: 404, message: 'Not found' }))
            );

            component.deleteQuestion(1);
            component.confirmDelete(1);

            expect(notificationService.error).toHaveBeenCalledWith(
                jasmine.stringContaining('Error al eliminar'),
                jasmine.any(Number)
            );
        });

        it('should not delete if question is not found', () => {
            component.deleteQuestion(999);
            expect(component.deleteConfirmId()).toBeNull();
        });
    });

    // ========== ADDITIONAL FUNCTIONALITY ==========
    describe('Additional Functionality', () => {
        beforeEach(() => {
            fixture.detectChanges();
        });

        it('should count pending questions correctly', () => {
            expect(component.pendingQuestionsCount).toBe(1);
        });

        it('should get category name by id', () => {
            const name = component.getCategoryName(2);
            expect(name).toBe('Factores de Riesgo');
        });

        it('should return default for unknown category', () => {
            const name = component.getCategoryName(999);
            expect(name).toBe('Sin categoría');
        });

        it('should truncate long text', () => {
            const longText = 'a'.repeat(100);
            const truncated = component.truncateText(longText, 50);
            expect(truncated.length).toBe(53); // 50 chars + '...'
            expect(truncated.endsWith('...')).toBe(true);
        });

        it('should logout and navigate to login', () => {
            component.logout();
            expect(authService.logout).toHaveBeenCalled();
            expect(router.navigate).toHaveBeenCalledWith(['/admin/login']);
        });

        it('should navigate to dashboard', () => {
            component.goToDashboard();
            expect(router.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
        });

        it('should toggle generator panel', () => {
            expect(component.isGeneratorOpen()).toBe(false);
            component.toggleGenerator();
            expect(component.isGeneratorOpen()).toBe(true);
            component.toggleGenerator();
            expect(component.isGeneratorOpen()).toBe(false);
        });

        it('should close full edit modal and reset form', () => {
            component.isFullEditModalOpen.set(true);
            component.questionToEdit.set(mockQuestionFull);

            component.closeFullEditModal();

            expect(component.isFullEditModalOpen()).toBe(false);
            expect(component.questionToEdit()).toBeNull();
            expect(component.fullEditForm.get('statement')?.value).toBe('');
        });
    });

    // ========== FORM VALIDATION ==========
    describe('Form Validation', () => {
        beforeEach(() => {
            fixture.detectChanges();
        });

        it('should validate generator form fields', () => {
            const form = component.generatorForm;

            form.patchValue({
                categoryId: null,
                difficulty: 1,
                quantity: 1,
                language: 'es'
            });

            expect(form.get('categoryId')?.hasError('required')).toBe(true);
            expect(form.valid).toBe(false);
        });

        it('should validate difficulty range in generator form', () => {
            const form = component.generatorForm;

            form.patchValue({ difficulty: 0 });
            expect(form.get('difficulty')?.hasError('min')).toBe(true);

            form.patchValue({ difficulty: 6 });
            expect(form.get('difficulty')?.hasError('max')).toBe(true);
        });

        it('should validate edit form statement length', () => {
            const form = component.fullEditForm;

            form.patchValue({ statement: 'Short' });
            expect(form.get('statement')?.hasError('minlength')).toBe(true);

            form.patchValue({ statement: 'a'.repeat(1001) });
            expect(form.get('statement')?.hasError('maxlength')).toBe(true);
        });

        it('should validate all options are required in edit form', () => {
            const form = component.fullEditForm;

            form.patchValue({
                option_a: '',
                option_b: 'Option B',
                option_c: 'Option C',
                option_d: 'Option D'
            });

            expect(form.get('option_a')?.hasError('required')).toBe(true);
            expect(form.valid).toBe(false);
        });
    });
});
