import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Interface para la respuesta del dashboard
 */
interface DashboardResponse {
  ok: boolean;
  total_players?: number;
  total_sessions?: number;
  total_questions?: number;
  pending_verification?: number;
  top_hardest?: Array<{ id: number; statement: string; success_rate: number }>;
  top_easiest?: Array<{ id: number; statement: string; success_rate: number }>;
  error?: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  // KPI Signals
  totalPlayers = signal<number>(0);
  totalSessions = signal<number>(0);
  totalQuestions = signal<number>(0);
  pendingVerification = signal<number>(0);

  // Lists Signals
  topHardest = signal<Array<{ id: number; statement: string; success_rate: number }> | null>(null);
  topEasiest = signal<Array<{ id: number; statement: string; success_rate: number }> | null>(null);

  // UI State Signals
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  /**
   * Carga las estadísticas del dashboard desde la API
   */
  private loadDashboardStats(): void {
    console.log('[AdminDashboard] Loading dashboard stats...');

    this.adminService.getDashboardStats().subscribe({
      next: (response: DashboardResponse) => {
        console.log('[AdminDashboard] Response:', response);

        if (response.ok) {
          // Actualizar KPIs
          this.totalPlayers.set(response.total_players || 0);
          this.totalSessions.set(response.total_sessions || 0);
          this.totalQuestions.set(response.total_questions || 0);
          this.pendingVerification.set(response.pending_verification || 0);

          // Actualizar listas
          this.topHardest.set(response.top_hardest || []);
          this.topEasiest.set(response.top_easiest || []);

          console.log('[AdminDashboard] Dashboard loaded successfully');
          this.isLoading.set(false);
        } else {
          this.errorMessage.set(response.error || 'Error al cargar el dashboard.');
          this.isLoading.set(false);
        }
      },
      error: (error) => {
        console.error('[AdminDashboard] Error:', error);
        let errorMsg = 'Hubo un problema al cargar el dashboard.';

        if (error.status === 401) {
          errorMsg = 'No autorizado. Por favor, inicia sesión nuevamente.';
        } else if (error.status === 403) {
          errorMsg = 'Acceso denegado. No tienes permisos de administrador.';
        } else if (error.status === 0) {
          errorMsg = 'No se puede conectar al servidor.';
        }

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
   * Cierra sesión y redirige al login
   */
  logout(): void {
    console.log('[AdminDashboard] Logging out...');
    this.authService.logout();
    this.router.navigate(['/admin/login']).then((success) => {
      if (success) {
        console.log('[AdminDashboard] Logout successful');
      } else {
        console.error('[AdminDashboard] Logout navigation failed');
      }
    });
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
    if (successRate >= 75) return 'success-high';
    if (successRate >= 50) return 'success-medium';
    return 'success-low';
  }
}
