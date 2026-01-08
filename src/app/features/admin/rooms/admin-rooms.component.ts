import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

import { TabsComponent, Tab } from '../../../shared/tabs/tabs.component';
import { RoomService } from '../../../core/services/room.service';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
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

@Component({
  selector: 'app-admin-rooms',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TabsComponent, BaseChartDirective],
  templateUrl: './admin-rooms.component.html',
  styleUrls: ['../shared/styles/admin-styles.css', './admin-rooms.component.css']
})
export class AdminRoomsComponent implements OnInit {

  // Tabs configuration
  readonly tabs: Tab[] = [
    { id: 'rooms', label: 'Salas', icon: 'fas fa-door-open' },
    { id: 'detail', label: 'Detalle de Sala', icon: 'fas fa-chart-bar' }
  ];

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
  isEditing = signal<boolean>(false);
  editingRoomId = signal<number | null>(null);
  roomForm!: FormGroup;
  isSaving = signal<boolean>(false);

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
      title: { display: true, text: 'Rendimiento de Jugadores' }
    },
    scales: {
      y: { beginAtZero: true, max: 100, title: { display: true, text: 'Precisión (%)' } },
      x: { title: { display: true, text: 'Jugador' } }
    }
  };
  playerStatsChartType: ChartType = 'bar';

  categoryStatsChartData = signal<ChartData<'doughnut'> | null>(null);
  categoryStatsChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'right' },
      title: { display: true, text: 'Respuestas por Categoría' }
    }
  };
  categoryStatsChartType: ChartType = 'doughnut';

  // Export
  isExporting = signal<boolean>(false);

  constructor(
    private roomService: RoomService,
    private adminService: AdminService,
    private authService: AuthService,
    private notification: NotificationService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnInit(): void {
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

  private initForm(): void {
    this.roomForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(255)]],
      max_players: [50, [Validators.required, Validators.min(1), Validators.max(500)]],
      filter_categories: [[]],
      filter_difficulties: [[]]
    });
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
          this.notification.error('Error al cargar las salas');
        }
        this.isLoadingRooms.set(false);
      },
      error: () => {
        this.notification.error('Error de conexión al cargar salas');
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
    this.isEditing.set(false);
    this.editingRoomId.set(null);
    this.roomForm.reset({
      name: '',
      description: '',
      max_players: 50,
      filter_categories: [],
      filter_difficulties: []
    });
    this.showModal.set(true);
  }

  openEditModal(room: GameRoom): void {
    this.isEditing.set(true);
    this.editingRoomId.set(room.id);
    this.roomForm.patchValue({
      name: room.name,
      description: room.description || '',
      max_players: room.max_players,
      filter_categories: room.filter_categories || [],
      filter_difficulties: room.filter_difficulties || []
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.isEditing.set(false);
    this.editingRoomId.set(null);
  }

  onCategoryToggle(categoryId: number, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const current: number[] = this.roomForm.get('filter_categories')?.value || [];

    if (checkbox.checked) {
      this.roomForm.patchValue({ filter_categories: [...current, categoryId] });
    } else {
      this.roomForm.patchValue({ filter_categories: current.filter(id => id !== categoryId) });
    }
  }

  onDifficultyToggle(difficulty: number, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const current: number[] = this.roomForm.get('filter_difficulties')?.value || [];

    if (checkbox.checked) {
      this.roomForm.patchValue({ filter_difficulties: [...current, difficulty] });
    } else {
      this.roomForm.patchValue({ filter_difficulties: current.filter(d => d !== difficulty) });
    }
  }

  /**
   * Previene la entrada de caracteres no numéricos en el campo max_players
   */
  preventNonNumeric(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    if (allowedKeys.includes(event.key)) {
      return;
    }

    // Solo permitir dígitos 0-9
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  /**
   * Limpia caracteres no numéricos del campo max_players al escribir
   */
  onMaxPlayersInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Eliminar todo lo que no sea dígito
    const cleanValue = input.value.replace(/\D/g, '');

    // Actualizar el valor si cambió
    if (input.value !== cleanValue) {
      input.value = cleanValue;
      this.roomForm.get('max_players')?.setValue(cleanValue ? parseInt(cleanValue, 10) : null);
    } else if (cleanValue) {
      // Convertir a número para los validadores
      this.roomForm.get('max_players')?.setValue(parseInt(cleanValue, 10));
    }
  }

  isCategorySelected(categoryId: number): boolean {
    const selected: number[] = this.roomForm.get('filter_categories')?.value || [];
    return selected.includes(categoryId);
  }

  isDifficultySelected(difficulty: number): boolean {
    const selected: number[] = this.roomForm.get('filter_difficulties')?.value || [];
    return selected.includes(difficulty);
  }

  saveRoom(): void {
    if (this.roomForm.invalid) {
      this.roomForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formValue = this.roomForm.value;

    if (this.isEditing()) {
      // Update existing room
      const payload: UpdateRoomPayload = {
        name: formValue.name,
        description: formValue.description || null,
        max_players: formValue.max_players,
        filter_categories: formValue.filter_categories.length > 0 ? formValue.filter_categories : null,
        filter_difficulties: formValue.filter_difficulties.length > 0 ? formValue.filter_difficulties : null
      };

      this.roomService.updateRoom(this.editingRoomId()!, payload).subscribe({
        next: (response) => {
          if (response.ok) {
            this.notification.success('Sala actualizada correctamente');
            this.closeModal();
            this.loadRooms();
          } else {
            this.notification.error(response.error || 'Error al actualizar la sala');
          }
          this.isSaving.set(false);
        },
        error: () => {
          this.notification.error('Error de conexión');
          this.isSaving.set(false);
        }
      });
    } else {
      // Create new room
      const payload: CreateRoomPayload = {
        name: formValue.name,
        description: formValue.description || undefined,
        max_players: formValue.max_players,
        filter_categories: formValue.filter_categories.length > 0 ? formValue.filter_categories : undefined,
        filter_difficulties: formValue.filter_difficulties.length > 0 ? formValue.filter_difficulties : undefined
      };

      this.roomService.createRoom(payload).subscribe({
        next: (response) => {
          if (response.ok && response.room) {
            this.notification.success(`Sala creada con código: ${response.room.room_code}`);
            this.closeModal();
            this.loadRooms();
          } else {
            this.notification.error(response.error || 'Error al crear la sala');
          }
          this.isSaving.set(false);
        },
        error: () => {
          this.notification.error('Error de conexión');
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
          this.notification.success(`Estado de sala actualizado a: ${this.getStatusLabel(newStatus)}`);
          this.loadRooms();
        } else {
          this.notification.error(response.error || 'Error al actualizar estado');
        }
      },
      error: () => {
        this.notification.error('Error de conexión');
      }
    });
  }

  deleteRoom(room: GameRoom): void {
    if (!confirm(`¿Estás seguro de eliminar la sala "${room.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    this.roomService.deleteRoom(room.id).subscribe({
      next: (response) => {
        if (response.ok) {
          this.notification.success('Sala eliminada correctamente');
          this.loadRooms();
        } else {
          this.notification.error(response.error || 'Error al eliminar la sala');
        }
      },
      error: () => {
        this.notification.error('Error de conexión');
      }
    });
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
      this.notification.success('Código copiado al portapapeles');
    }).catch(() => {
      this.notification.error('Error al copiar el código');
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
        this.notification.error('Error al cargar información de la sala');
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
    const accuracy = topPlayers.map(p => p.accuracy_percent);
    const scores = topPlayers.map(p => p.high_score);

    this.playerStatsChartData.set({
      labels,
      datasets: [
        {
          label: 'Precisión (%)',
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
        this.notification.success('PDF generado correctamente');
        this.isExporting.set(false);
      },
      error: () => {
        this.notification.error('Error al generar el PDF');
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
        this.notification.success('Excel generado correctamente');
        this.isExporting.set(false);
      },
      error: () => {
        this.notification.error('Error al generar el Excel');
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
    const labels: Record<string, string> = {
      active: 'Activa',
      paused: 'Pausada',
      closed: 'Cerrada'
    };
    return labels[status] || status;
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
    const labels: Record<number, string> = {
      1: 'Muy Fácil',
      2: 'Fácil',
      3: 'Normal',
      4: 'Difícil',
      5: 'Muy Difícil'
    };
    return labels[difficulty] || `Nivel ${difficulty}`;
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
}
