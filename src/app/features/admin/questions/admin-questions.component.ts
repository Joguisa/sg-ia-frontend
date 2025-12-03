import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminCategory, GenerationResponse } from '../../../core/models/admin';
import { Question } from '../../../core/models/game';



@Component({
  selector: 'app-admin-questions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-questions.component.html',
  styleUrls: ['./admin-questions.component.css']
})
export class AdminQuestionsComponent implements OnInit {
  // ========== LISTA DE PREGUNTAS ==========
  allQuestions = signal<Question[]>([]);
  questions = signal<Question[]>([]);

  // ========== FILTROS ==========
  selectedCategory = signal<number | null>(null);
  selectedStatus = signal<string>('all'); // 'all', 'verified', 'pending'
  searchTerm = signal<string>('');

  // ========== CATEGORÍAS ==========
  categories = signal<AdminCategory[]>([]);

  // ========== GENERADOR IA ==========
  generatorCategoryId = signal<number | null>(null);
  generatorDifficulty = signal<number>(2);
  generatorQuantity = signal<number>(5);
  isGenerating = signal<boolean>(false);
  generationMessage = signal<string>('');

  // ========== UI STATE ==========
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  isGeneratorOpen = signal<boolean>(false);

  // ========== CONFIRMACIÓN DE BORRADO ==========
  deleteConfirmId = signal<number | null>(null);

  // ========== COMPUTED SIGNALS (Filtrado) ==========
  filteredQuestions = computed(() => {
    let result = [...this.allQuestions()];

    // Filtrar por categoría
    if (this.selectedCategory() !== null) {
      result = result.filter(q => q.category_id === this.selectedCategory());
    }

    // Filtrar por estado (verificada/pendiente)
    if (this.selectedStatus() === 'verified') {
      result = result.filter(q => q.admin_verified);
    } else if (this.selectedStatus() === 'pending') {
      result = result.filter(q => !q.admin_verified);
    }

    // Filtrar por búsqueda
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      result = result.filter(q =>
        q.statement.toLowerCase().includes(term) ||
        q.id.toString().includes(term)
      );
    }

    return result;
  });

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadQuestions();
    this.loadCategories();
  }

  /**
 * Carga la lista de preguntas desde el backend
 */
  private loadQuestions(): void {
    console.log('[AdminQuestions] Loading questions...');
    this.isLoading.set(true);

    this.adminService.getQuestions().subscribe({
      next: (response) => {
        this.allQuestions.set(response.questions || []);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('[AdminQuestions] Error loading questions:', error);
        this.errorMessage.set('Error al cargar preguntas');
        this.isLoading.set(false);
      }
    });
  }

  /**
 * Carga las categorías disponibles
 */
  private loadCategories(): void {
    console.log('[AdminQuestions] Loading categories...');

    this.adminService.getCategories().subscribe({
      next: (response) => {
        this.categories.set(response.categories || []);
      },
      error: (error) => {
        console.error('[AdminQuestions] Error loading categories:', error);
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
    console.log('[AdminQuestions] Generating questions with AI...');

    // Validaciones
    if (this.generatorCategoryId() === null) {
      this.generationMessage.set('Por favor selecciona una categoría');
      return;
    }

    if (this.generatorQuantity() < 1 || this.generatorQuantity() > 50) {
      this.generationMessage.set('Cantidad debe ser entre 1 y 50');
      return;
    }

    this.isGenerating.set(true);
    this.generationMessage.set('Generando preguntas con IA...');

    // Llamar al servicio
    this.adminService.generateBatch(
      this.generatorQuantity(),
      this.generatorCategoryId()!,
      this.generatorDifficulty()
    ).subscribe({
      next: (response: GenerationResponse) => {
        console.log('[AdminQuestions] Generation response:', response);

        if (response.ok) {
          const count = this.generatorQuantity();
          this.successMessage.set(`✅ ${count} preguntas generadas exitosamente con IA`);
          this.isGenerating.set(false);
          this.generationMessage.set('');

          // Resetear formulario
          this.generatorCategoryId.set(null);
          this.generatorQuantity.set(5);
          this.generatorDifficulty.set(2);
          this.isGeneratorOpen.set(false);

          // Recargar preguntas
          setTimeout(() => {
            this.loadQuestions();
            this.successMessage.set('');
          }, 3000);
        } else {
          this.generationMessage.set(response.error || 'Error al generar preguntas');
          this.isGenerating.set(false);
        }
      },
      error: (error) => {
        console.error('[AdminQuestions] Generation error:', error);
        let errorMsg = 'Error al generar preguntas con IA';

        if (error.status === 401) {
          errorMsg = 'No autorizado. Token expirado.';
        } else if (error.status === 400) {
          errorMsg = 'Parámetros inválidos para la generación';
        }

        this.generationMessage.set(errorMsg);
        this.isGenerating.set(false);
      }
    });
  }

  /**
   * Verifica o desverifica una pregunta
   */
  toggleVerifyQuestion(questionId: number, currentState: boolean): void {
    console.log('[AdminQuestions] Toggling verify status for question', questionId);

    this.adminService.verifyQuestion(questionId, !currentState).subscribe({
      next: (response: any) => {
        console.log('[AdminQuestions] Verify response:', response);

        if (response.ok) {
          // Actualizar estado local
          const questions = this.allQuestions();
          const index = questions.findIndex(q => q.id === questionId);
          if (index !== -1) {
            const updated = [...questions];
            updated[index] = { ...updated[index], admin_verified: !currentState };
            this.allQuestions.set(updated);
          }

          this.successMessage.set(!currentState ? 'Pregunta verificada' : 'Verificación removida');
          setTimeout(() => this.successMessage.set(''), 2000);
        } else {
          this.errorMessage.set(response.error || 'Error al cambiar estado de verificación');
        }
      },
      error: (error) => {
        console.error('[AdminQuestions] Verify error:', error);
        this.errorMessage.set('Error al cambiar estado de verificación');
      }
    });
  }

  /**
   * Solicita confirmación y borra una pregunta
   */
  deleteQuestion(questionId: number): void {
    console.log('[AdminQuestions] Deleting question', questionId);

    const question = this.allQuestions().find(q => q.id === questionId);
    if (!question) return;

    // Mostrar confirmación
    this.deleteConfirmId.set(questionId);
  }

  /**
 * Confirma la eliminación de una pregunta
 */
  confirmDelete(questionId: number): void {
    console.log('[AdminQuestions] Confirming delete for question', questionId);

    this.adminService.deleteQuestion(questionId).subscribe({
      next: (response) => {
        if (response.ok) {
          const questions = this.allQuestions().filter(q => q.id !== questionId);
          this.allQuestions.set(questions);
          this.successMessage.set('Pregunta eliminada');
          this.deleteConfirmId.set(null);
          setTimeout(() => this.successMessage.set(''), 2000);
        } else {
          this.errorMessage.set(response.error || 'Error al eliminar');
        }
      },
      error: (error) => {
        console.error('[AdminQuestions] Delete error:', error);
        this.errorMessage.set('Error al eliminar pregunta');
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
    console.log('[AdminQuestions] Logging out...');
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
