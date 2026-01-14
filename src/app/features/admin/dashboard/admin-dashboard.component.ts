import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DashboardStatsResponse, BatchStatistics } from '../../../core/models/admin';
import { HttpStatus } from '../../../core/constants/http-status.const';
import { NOTIFICATION_DURATION } from '../../../core/constants/notification-config.const';
import { LanguageSelectorComponent } from '../../../shared/components/language-selector/language-selector.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, LanguageSelectorComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: [
    '../shared/styles/admin-styles.css',
    './admin-dashboard.component.css'
  ]
})
export class AdminDashboardComponent implements OnInit {
  // Helper para usar en el template
  Number = Number;

  // KPI Signals
  totalPlayers = signal<number>(0);
  totalSessions = signal<number>(0);
  totalQuestions = signal<number>(0);
  pendingVerification = signal<number>(0);

  // Lists Signals
  topHardest = signal<Array<{ id: number; statement: string; success_rate: number }> | null>(null);
  topEasiest = signal<Array<{ id: number; statement: string; success_rate: number }> | null>(null);

  // Batch Statistics Signals
  batchStatistics = signal<BatchStatistics[]>([]);
  isLoadingBatches = signal<boolean>(false);


  // UI State Signals
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private notification: NotificationService,
    private router: Router,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.loadDashboardStats();
    this.loadBatchStatistics();
  }

  /**
   * Carga las estadísticas del dashboard desde la API
   */
  private loadDashboardStats(): void {
    this.adminService.getDashboardStats().subscribe({
      next: (response: DashboardStatsResponse) => {
        if (response.summary) {
          // Actualizar KPIs
          this.totalPlayers.set(response.summary.total_players || 0);
          this.totalSessions.set(response.summary.total_sessions || 0);
          this.totalQuestions.set(response.summary.total_questions || 0);
          this.pendingVerification.set(response.summary.pending_verification || 0);

          // Actualizar listas
          this.topHardest.set(response.hardest_questions || []);
          this.topEasiest.set(response.easiest_questions || []);

          this.isLoading.set(false);
        } else {
          this.errorMessage.set(response.error || this.translate.instant('admin.dashboard.load_error'));
          this.isLoading.set(false);
        }
      },
      error: (error) => {
        let errorMsg = this.translate.instant('admin.dashboard.load_error');

        if (error.status === HttpStatus.UNAUTHORIZED) {
          errorMsg = this.translate.instant('admin.dashboard.unauthorized');
        } else if (error.status === HttpStatus.FORBIDDEN) {
          errorMsg = this.translate.instant('admin.dashboard.forbidden');
        } else if (error.status === 0) {
          errorMsg = this.translate.instant('admin.dashboard.connection_error');
        }

        this.notification.error(errorMsg, NOTIFICATION_DURATION.LONG);
        this.errorMessage.set(errorMsg);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Navega a la gestión de preguntas
   */
  goToQuestions(): void {
    this.router.navigate(['/admin/questions']);
  }

  /**
   * Navega a la configuración
   */
  goToSettings(): void {
    this.router.navigate(['/admin/settings']);
  }

  /**
   * Navega a la gestión de jugadores
   */
  goToPlayers(): void {
    this.router.navigate(['/admin/players']);
  }

  /**
   * Navega a la gestión de salas
   */
  goToRooms(): void {
    this.router.navigate(['/admin/rooms']);
  }

  /**
   * Navega a la gestión de administradores
   */
  goToAdmins(): void {
    this.router.navigate(['/admin/admins']);
  }

  /**
   * Cierra sesión y redirige al login
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']).then((success) => { });
  }

  /**
   * Trunca el texto si es muy largo
   */
  truncateText(text: string, maxLength: number = 50): string {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  /**
   * Obtiene la clase CSS para el color de la tasa de éxito
   */
  getSuccessRateClass(successRate: number): string {
    if (successRate >= 75) return 'success-rate-success-high';
    if (successRate >= 50) return 'success-rate-success-medium';
    return 'success-rate-success-low';
  }

  // ========== BATCH STATISTICS METHODS ==========

  /**
   * Carga las estadísticas de batches desde la API
   */
  loadBatchStatistics(): void {
    this.isLoadingBatches.set(true);

    this.adminService.getBatchStatistics().subscribe({
      next: (response) => {
        if (response.ok) {
          this.batchStatistics.set(response.batches || []);
        }
        this.isLoadingBatches.set(false);
      },
      error: (error) => {
        console.error('Error loading batch statistics:', error);
        this.isLoadingBatches.set(false);
      }
    });
  }

  /**
   * Navega a preguntas filtradas por batch
   */
  goToQuestionsWithBatch(batchId: number): void {
    this.router.navigate(['/admin/questions'], { queryParams: { batchId } });
  }

  /**
   * Obtiene la clase CSS para el estado del batch
   */
  getBatchStatusClass(status: string): string {
    switch (status) {
      case 'complete':
        return 'batch-status-complete';
      case 'partial':
        return 'batch-status-partial';
      default:
        return 'batch-status-pending';
    }
  }

  /**
   * Obtiene el texto del estado del batch
   */
  getBatchStatusText(status: string): string {
    switch (status) {
      case 'complete':
        return this.translate.instant('admin.dashboard.complete');
      case 'partial':
        return this.translate.instant('admin.dashboard.partial');
      default:
        return this.translate.instant('admin.questions.pending');
    }
  }

  /**
   * Formatea la fecha de importación
   */
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Obtiene la clase CSS para el badge del proveedor de IA
   */
  getAIProviderClass(provider: string | null | undefined): string {
    if (!provider) return 'ai-provider-none';

    switch (provider.toLowerCase()) {
      case 'gemini': return 'ai-provider-gemini';
      case 'groq': return 'ai-provider-groq';
      case 'deepseek': return 'ai-provider-deepseek';
      case 'fireworks': return 'ai-provider-fireworks';
      default: return 'ai-provider-other';
    }
  }

  /**
   * Obtiene el texto de visualización para el proveedor de IA
   */
  getAIProviderText(provider: string | null | undefined): string {
    if (!provider) return 'N/A';

    const labels: Record<string, string> = {
      'gemini': 'Gemini',
      'groq': 'Groq',
      'deepseek': 'DeepSeek',
      'fireworks': 'Fireworks'
    };

    return labels[provider.toLowerCase()] || provider;
  }
}
