import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { TranslatePipe, TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { TabsComponent, Tab } from '../../../shared/tabs/tabs.component';
import { RoomService } from '../../../core/services/room.service';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LanguageService, SupportedLanguage } from '../../../core/services/language.service';
import { NOTIFICATION_DURATION } from '../../../core/constants/notification-config.const';

import {
  GameRoom,
  CreateRoomPayload,
  UpdateRoomPayload,
  RoomStatistics,
  RoomPlayerStats,
  RoomQuestionStats,
  RoomCategoryStats,
  QuestionAnalysis
} from '../../../core/models/room';

import { AdminCategory } from '../../../core/models/admin';
import { RoomFormModalComponent } from '../components/room-form-modal/room-form-modal.component';

@Component({
  selector: 'app-admin-rooms',
  standalone: true,
  imports: [CommonModule, TabsComponent, BaseChartDirective, TranslatePipe, RoomFormModalComponent],
  templateUrl: './admin-rooms.component.html',
  styleUrls: ['../shared/styles/admin-styles.css', './admin-rooms.component.css']
})
export class AdminRoomsComponent implements OnInit, OnDestroy {

  // Tabs configuration - labels will be translated in template
  tabs: Tab[] = [];

  private initTabs(): void {
    this.tabs = [
      { id: 'rooms', label: this.translate.instant('admin.rooms.tabRooms'), icon: 'fas fa-door-open' },
      { id: 'detail', label: this.translate.instant('admin.rooms.tabDetail'), icon: 'fas fa-chart-bar' }
    ];
  }

  activeTab = signal<string>('rooms');

  // Tab 1: Rooms List
  rooms = signal<GameRoom[]>([]);
  filteredRooms = computed(() => {
    const search = this.searchQuery().toLowerCase();
    const statusFilter = this.statusFilter();
    let filtered = this.rooms();

    if (search) {
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(search) ||
        r.room_code.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    return filtered;
  });
  searchQuery = signal<string>('');
  statusFilter = signal<string>('all');
  isLoadingRooms = signal<boolean>(false);

  // Create/Edit Modal
  showModal = signal<boolean>(false);
  roomToEdit = signal<GameRoom | null>(null);
  isSaving = signal<boolean>(false);

  // ========== CONFIRMACIÓN DE BORRADO DE SALA ==========
  deleteRoomConfirmId = signal<number | null>(null);

  // Categories for filters
  categories = signal<AdminCategory[]>([]);
  difficulties = [1, 2, 3, 4, 5];

  // Tab 2: Room Detail
  selectedRoomId = signal<number | null>(null);
  selectedRoom = signal<GameRoom | null>(null);
  roomStats = signal<RoomStatistics | null>(null);
  roomPlayerStats = signal<RoomPlayerStats[]>([]);
  roomQuestionStats = signal<RoomQuestionStats[]>([]);
  roomCategoryStats = signal<RoomCategoryStats[]>([]);
  topHardest = signal<QuestionAnalysis[]>([]);
  topEasiest = signal<QuestionAnalysis[]>([]);
  isLoadingDetail = signal<boolean>(false);
  isLoadingStats = signal<boolean>(false);

  // Charts
  playerStatsChartData = signal<ChartData<'bar'> | null>(null);
  playerStatsChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      title: { display: true, text: '' }
    },
    scales: {
      y: { beginAtZero: true, max: 100, title: { display: true, text: '' } },
      x: { title: { display: true, text: '' } }
    }
  };
  playerStatsChartType: ChartType = 'bar';

  categoryStatsChartData = signal<ChartData<'doughnut'> | null>(null);
  categoryStatsChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'right' },
      title: { display: true, text: '' }
    }
  };
  categoryStatsChartType: ChartType = 'doughnut';

  // Export
  isExporting = signal<boolean>(false);

  private langChangeSubscription: Subscription | undefined;

  constructor(
    private roomService: RoomService,
    private adminService: AdminService,
    private authService: AuthService,
    private notification: NotificationService,
    public languageService: LanguageService,
    private translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Initialize translations for charts
    this.updateChartTranslations();

    // Subscribe to language changes
    this.langChangeSubscription = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.updateChartTranslations();
      this.initTabs(); // Also update tabs labels
    });

    // Initialize translated tabs
    this.initTabs();

    // Load categories for filters
    this.loadCategories();

    // Read tab from query params
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab && this.tabs.some(t => t.id === tab)) {
        this.activeTab.set(tab);
      }

      // If on detail tab, check for roomId param
      if (tab === 'detail' && params['roomId']) {
        const roomId = parseInt(params['roomId'], 10);
        if (!isNaN(roomId)) {
          this.selectedRoomId.set(roomId);
          this.loadRoomDetail(roomId);
        }
      }
    });

    // Load initial data
    this.loadRooms();
  }

  ngOnDestroy(): void {
    if (this.langChangeSubscription) {
      this.langChangeSubscription.unsubscribe();
    }
  }

  onTabChange(tabId: string): void {
    this.activeTab.set(tabId);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabId },
      queryParamsHandling: 'merge'
    });
  }

  // ============================================================================
  // TAB 1: ROOMS LIST
  // ============================================================================

  loadRooms(): void {
    this.isLoadingRooms.set(true);

    this.roomService.listRooms().subscribe({
      next: (response) => {
        if (response.ok && response.rooms) {
          this.rooms.set(response.rooms);
        } else {
          this.notification.error(response.error || this.translate.instant('admin.rooms.notifications.load_rooms_error'), NOTIFICATION_DURATION.DEFAULT);
        }
        this.isLoadingRooms.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('admin.rooms.notifications.load_rooms_connection_error'), NOTIFICATION_DURATION.DEFAULT);
        this.isLoadingRooms.set(false);
      }
    });
  }

  loadCategories(): void {
    this.adminService.getCategories().subscribe({
      next: (response) => {
        if (response.ok && response.categories) {
          this.categories.set(response.categories);
        }
      },
      error: () => {
        console.error('Error loading categories');
      }
    });
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  onStatusFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.statusFilter.set(select.value);
  }

  // ============================================================================
  // CREATE/EDIT MODAL
  // ============================================================================

  openCreateModal(): void {
    this.roomToEdit.set(null);
    this.showModal.set(true);
  }

  openEditModal(room: GameRoom): void {
    this.roomToEdit.set(room);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.roomToEdit.set(null);
    this.isSaving.set(false);
  }

  onSaveRoom(payload: CreateRoomPayload | UpdateRoomPayload): void {
    this.isSaving.set(true);
    const room = this.roomToEdit();

    if (room) {
      // Update existing room
      this.roomService.updateRoom(room.id, payload as UpdateRoomPayload).subscribe({
        next: (response) => {
          if (response.ok) {
            this.notification.success(this.translate.instant('admin.rooms.notifications.update_success'), NOTIFICATION_DURATION.SHORT);
            this.closeModal();
            this.loadRooms();
          } else {
            this.notification.error(response.error || this.translate.instant('admin.rooms.notifications.update_error'), NOTIFICATION_DURATION.DEFAULT);
          }
          this.isSaving.set(false);
        },
        error: () => {
          this.notification.error(this.translate.instant('admin.rooms.notifications.load_rooms_connection_error'), NOTIFICATION_DURATION.DEFAULT);
          this.isSaving.set(false);
        }
      });
    } else {
      // Create new room
      this.roomService.createRoom(payload as CreateRoomPayload).subscribe({
        next: (response) => {
          if (response.ok && response.room) {
            this.notification.success(this.translate.instant('admin.rooms.notifications.create_success', { code: response.room.room_code }), NOTIFICATION_DURATION.DEFAULT);
            this.closeModal();
            this.loadRooms();
          } else {
            this.notification.error(response.error || this.translate.instant('admin.rooms.notifications.create_error'), NOTIFICATION_DURATION.DEFAULT);
          }
          this.isSaving.set(false);
        },
        error: () => {
          this.notification.error(this.translate.instant('admin.rooms.notifications.load_rooms_connection_error'), NOTIFICATION_DURATION.DEFAULT);
          this.isSaving.set(false);
        }
      });
    }
  }

  // ============================================================================
  // ROOM ACTIONS
  // ============================================================================

  updateRoomStatus(room: GameRoom, newStatus: 'active' | 'paused' | 'closed'): void {
    this.roomService.updateRoomStatus(room.id, newStatus).subscribe({
      next: (response) => {
        if (response.ok) {
          // Traducir la clave de estado para mostrar el texto correcto
          const statusKey = this.getStatusLabel(newStatus);
          const statusLabel = this.translate.instant(statusKey);
          this.notification.success(this.translate.instant('admin.rooms.notifications.status_update_success', { status: statusLabel }), NOTIFICATION_DURATION.SHORT);
          this.loadRooms();
        } else {
          this.notification.error(response.error || this.translate.instant('admin.rooms.notifications.status_update_error'), NOTIFICATION_DURATION.DEFAULT);
        }
      },
      error: () => {
        this.notification.error(this.translate.instant('admin.rooms.notifications.load_rooms_connection_error'), NOTIFICATION_DURATION.DEFAULT);
      }
    });
  }

  /**
   * Solicita confirmación para eliminar una sala
   */
  deleteRoom(room: GameRoom): void {
    // Mostrar confirmación
    this.deleteRoomConfirmId.set(room.id);
  }

  /**
   * Confirma la eliminación de una sala
   */
  confirmDeleteRoom(roomId: number): void {
    this.roomService.deleteRoom(roomId).subscribe({
      next: (response) => {
        if (response.ok) {
          const rooms = this.rooms().filter(r => r.id !== roomId);
          this.rooms.set(rooms);
          this.notification.success(this.translate.instant('admin.rooms.notifications.delete_success'), NOTIFICATION_DURATION.SHORT);
          this.deleteRoomConfirmId.set(null);
        } else {
          this.notification.error(response.error || this.translate.instant('admin.rooms.notifications.delete_error'), NOTIFICATION_DURATION.DEFAULT);
          this.deleteRoomConfirmId.set(null);
        }
      },
      error: () => {
        this.notification.error(this.translate.instant('admin.rooms.notifications.load_rooms_connection_error'), NOTIFICATION_DURATION.DEFAULT);
        this.deleteRoomConfirmId.set(null);
      }
    });
  }

  /**
   * Cancela la eliminación de sala
   */
  cancelDeleteRoom(): void {
    this.deleteRoomConfirmId.set(null);
  }

  viewRoomDetail(room: GameRoom): void {
    this.selectedRoomId.set(room.id);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: 'detail', roomId: room.id },
      queryParamsHandling: 'merge'
    });
    this.activeTab.set('detail');
    this.loadRoomDetail(room.id);
  }

  copyRoomCode(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      this.notification.success(this.translate.instant('admin.rooms.notifications.code_copied'), NOTIFICATION_DURATION.SHORT);
    }).catch(() => {
      this.notification.error(this.translate.instant('admin.rooms.notifications.code_copy_error'), NOTIFICATION_DURATION.DEFAULT);
    });
  }

  // ============================================================================
  // TAB 2: ROOM DETAIL
  // ============================================================================

  loadRoomDetail(roomId: number): void {
    this.isLoadingDetail.set(true);
    this.isLoadingStats.set(true);

    // Load room info
    this.roomService.getRoom(roomId).subscribe({
      next: (response) => {
        if (response.ok && response.room) {
          this.selectedRoom.set(response.room);
        }
        this.isLoadingDetail.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('admin.rooms.notifications.room_detail_error'), NOTIFICATION_DURATION.DEFAULT);
        this.isLoadingDetail.set(false);
      }
    });

    // Load room stats
    this.roomService.getRoomStats(roomId).subscribe({
      next: (response) => {
        if (response.ok && response.data?.statistics) {
          this.roomStats.set(response.data.statistics);
        }
      },
      error: () => {
        console.error('Error loading room stats');
      }
    });

    // Load player stats
    this.roomService.getRoomPlayerStats(roomId).subscribe({
      next: (response) => {
        if (response.ok && response.players) {
          this.roomPlayerStats.set(response.players);
          this.buildPlayerStatsChart(response.players);
        }
      },
      error: () => {
        console.error('Error loading player stats');
      }
    });

    // Load question stats
    this.roomService.getRoomQuestionStats(roomId).subscribe({
      next: (response) => {
        if (response.ok && response.questions) {
          this.roomQuestionStats.set(response.questions);
        }
      },
      error: () => {
        console.error('Error loading question stats');
      }
    });

    // Load category stats
    this.roomService.getRoomCategoryStats(roomId).subscribe({
      next: (response) => {
        if (response.ok && response.categories) {
          this.roomCategoryStats.set(response.categories);
          this.buildCategoryStatsChart(response.categories);
        }
        this.isLoadingStats.set(false);
      },
      error: () => {
        console.error('Error loading category stats');
        this.isLoadingStats.set(false);
      }
    });

    // Load question analysis (Top 5 hardest/easiest)
    this.roomService.getRoomQuestionAnalysis(roomId).subscribe({
      next: (response) => {
        if (response.ok) {
          this.topHardest.set(response.top_hardest || []);
          this.topEasiest.set(response.top_easiest || []);
        }
      },
      error: () => {
        console.error('Error loading question analysis');
      }
    });
  }

  private buildPlayerStatsChart(players: RoomPlayerStats[]): void {
    if (players.length === 0) {
      this.playerStatsChartData.set(null);
      return;
    }

    const topPlayers = players.slice(0, 10);
    const labels = topPlayers.map(p => p.player_name);
    const accuracy = topPlayers.map(p => p.accuracy);
    const scores = topPlayers.map(p => p.high_score);

    this.playerStatsChartData.set({
      labels,
      datasets: [
        {
          label: this.translate.instant('admin.rooms.charts.accuracy'),
          data: accuracy,
          backgroundColor: 'rgba(102, 126, 234, 0.6)',
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 2
        }
      ]
    });
  }

  private buildCategoryStatsChart(categories: RoomCategoryStats[]): void {
    if (categories.length === 0) {
      this.categoryStatsChartData.set(null);
      return;
    }

    const labels = categories.map(c => c.category_name);
    const data = categories.map(c => c.total_answers);

    this.categoryStatsChartData.set({
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            'rgba(102, 126, 234, 0.8)',
            'rgba(118, 75, 162, 0.8)',
            'rgba(76, 175, 80, 0.8)',
            'rgba(255, 152, 0, 0.8)',
            'rgba(244, 67, 54, 0.8)',
            'rgba(33, 150, 243, 0.8)',
            'rgba(156, 39, 176, 0.8)',
            'rgba(0, 188, 212, 0.8)'
          ],
          borderWidth: 2
        }
      ]
    });
  }

  clearRoomSelection(): void {
    this.selectedRoomId.set(null);
    this.selectedRoom.set(null);
    this.roomStats.set(null);
    this.roomPlayerStats.set([]);
    this.roomQuestionStats.set([]);
    this.roomCategoryStats.set([]);
    this.playerStatsChartData.set(null);
    this.categoryStatsChartData.set(null);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: 'rooms' },
      queryParamsHandling: 'merge'
    });
    this.activeTab.set('rooms');
  }

  // ============================================================================
  // EXPORT
  // ============================================================================

  exportToPdf(): void {
    const roomId = this.selectedRoomId();
    if (!roomId) return;

    this.isExporting.set(true);
    this.roomService.exportRoomPdf(roomId).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, `sala_${this.selectedRoom()?.room_code}_reporte.pdf`);
        this.notification.success(this.translate.instant('admin.rooms.notifications.pdf_success'), NOTIFICATION_DURATION.SHORT);
        this.isExporting.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('admin.rooms.notifications.pdf_error'), NOTIFICATION_DURATION.DEFAULT);
        this.isExporting.set(false);
      }
    });
  }

  exportToExcel(): void {
    const roomId = this.selectedRoomId();
    if (!roomId) return;

    this.isExporting.set(true);
    this.roomService.exportRoomExcel(roomId).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, `sala_${this.selectedRoom()?.room_code}_reporte.xlsx`);
        this.notification.success(this.translate.instant('admin.rooms.notifications.excel_success'), NOTIFICATION_DURATION.SHORT);
        this.isExporting.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('admin.rooms.notifications.excel_error'), NOTIFICATION_DURATION.DEFAULT);
        this.isExporting.set(false);
      }
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  getStatusLabel(status: string): string {
    return `admin.rooms.status.${status}`;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      active: 'status-active',
      paused: 'status-paused',
      closed: 'status-closed'
    };
    return classes[status] || '';
  }

  getDifficultyLabel(difficulty: number): string {
    return `admin.rooms.difficulty.level${difficulty}`;
  }

  truncateText(text: string, maxLength: number = 60): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  getSuccessRateClass(rate: number): string {
    if (rate >= 75) return 'success-rate-high';
    if (rate >= 50) return 'success-rate-medium';
    return 'success-rate-low';
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  goToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }
  updateChartTranslations(): void {
    this.playerStatsChartOptions = {
      ...this.playerStatsChartOptions,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        ...this.playerStatsChartOptions?.plugins,
        title: {
          display: true,
          text: this.translate.instant('admin.rooms.charts.playerPerformance')
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: this.translate.instant('admin.rooms.charts.accuracy')
          }
        },
        x: {
          title: {
            display: true,
            text: this.translate.instant('admin.rooms.charts.player')
          }
        }
      }
    };

    this.categoryStatsChartOptions = {
      ...this.categoryStatsChartOptions,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        ...this.categoryStatsChartOptions?.plugins,
        title: {
          display: true,
          text: this.translate.instant('admin.rooms.charts.answersByCategory')
        }
      }
    };
  }
}
