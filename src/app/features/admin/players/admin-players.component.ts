import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { TabsComponent, Tab } from '../../../shared/tabs/tabs.component';
import { GameService } from '../../../core/services/game.service';
import { PlayerService } from '../../../core/services/player.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { NOTIFICATION_DURATION } from '../../../core/constants/notification-config.const';

import { LeaderboardEntry } from '../../../core/models/game/leaderboard.interface';
import { Player } from '../../../core/models/player/player.interface';
import { PlayerStatsResponse, PlayerGlobalStats, PlayerTopicStats } from '../../../core/models/player/player-stats.interface';

@Component({
  selector: 'app-admin-players',
  standalone: true,
  imports: [CommonModule, FormsModule, TabsComponent, BaseChartDirective, TranslatePipe],
  templateUrl: './admin-players.component.html',
  styleUrls: [
    '../shared/styles/admin-styles.css',
    './admin-players.component.css'
  ]
})
export class AdminPlayersComponent implements OnInit {

  // Tabs configuration
  readonly tabs: Tab[] = [
    { id: 'leaderboard', label: 'Leaderboard Top', icon: 'fas fa-trophy' },
    { id: 'players', label: 'Todos los Jugadores', icon: 'fas fa-users' },
    { id: 'profile', label: 'Perfil de Jugador', icon: 'fas fa-user-circle' }
  ];

  activeTab = signal<string>('leaderboard');

  // Tab 1: Leaderboard
  leaderboardData = signal<LeaderboardEntry[]>([]);
  isLoadingLeaderboard = signal<boolean>(false);
  leaderboardChartData = signal<ChartData<'bar'> | null>(null);
  leaderboardChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      title: { display: true, text: 'Top 10 Jugadores - High Score' }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Puntaje' } },
      x: { title: { display: true, text: 'Jugador' } }
    }
  };
  leaderboardChartType: ChartType = 'bar';

  // Tab 2: All Players
  allPlayers = signal<Player[]>([]);
  filteredPlayers = computed(() => {
    const search = this.searchQuery().toLowerCase();
    if (!search) return this.allPlayers();
    return this.allPlayers().filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.id.toString().includes(search)
    );
  });
  searchQuery = signal<string>('');
  isLoadingPlayers = signal<boolean>(false);

  // Tab 3: Player Profile
  selectedPlayerId = signal<number | null>(null);
  selectedPlayerStats = signal<PlayerStatsResponse | null>(null);
  isLoadingProfile = signal<boolean>(false);
  profileChartData = signal<ChartData<'radar'> | null>(null);
  profileChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      title: { display: true, text: 'Rendimiento por Categoría' }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: { stepSize: 20 }
      }
    }
  };
  profileChartType: ChartType = 'radar';

  constructor(
    private gameService: GameService,
    private playerService: PlayerService,
    private authService: AuthService,
    private notification: NotificationService,
    private translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Read tab from query params
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab && this.tabs.some(t => t.id === tab)) {
        this.activeTab.set(tab);
      }

      // If on profile tab, check for playerId param
      if (tab === 'profile' && params['playerId']) {
        const playerId = parseInt(params['playerId'], 10);
        if (!isNaN(playerId)) {
          this.selectedPlayerId.set(playerId);
          this.loadPlayerProfile(playerId);
        }
      }
    });

    // Load initial data based on active tab
    this.loadTabData(this.activeTab());
  }

  onTabChange(tabId: string): void {
    this.activeTab.set(tabId);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabId },
      queryParamsHandling: 'merge'
    });
    this.loadTabData(tabId);
  }

  private loadTabData(tabId: string): void {
    switch (tabId) {
      case 'leaderboard':
        this.loadLeaderboard();
        break;
      case 'players':
        this.loadAllPlayers();
        break;
      case 'profile':
        // Only load if playerId is already set
        if (this.selectedPlayerId()) {
          this.loadPlayerProfile(this.selectedPlayerId()!);
        }
        break;
    }
  }

  // ============================================================================
  // TAB 1: LEADERBOARD
  // ============================================================================

  loadLeaderboard(): void {
    this.isLoadingLeaderboard.set(true);

    this.gameService.getLeaderboard().subscribe({
      next: (response) => {
        if (response.ok && response.leaderboard) {
          this.leaderboardData.set(response.leaderboard);
          this.buildLeaderboardChart(response.leaderboard.slice(0, 10)); // Top 10
        } else {
          this.notification.error(response.error || this.translate.instant('admin.players.notifications.load_leaderboard_error'), NOTIFICATION_DURATION.DEFAULT);
        }
        this.isLoadingLeaderboard.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('admin.players.notifications.load_leaderboard_connection_error'), NOTIFICATION_DURATION.DEFAULT);
        this.isLoadingLeaderboard.set(false);
      }
    });
  }

  private buildLeaderboardChart(data: LeaderboardEntry[]): void {
    const labels = data.map(entry => entry.player_name);
    const scores = data.map(entry => entry.high_score);
    const totalGames = data.map(entry => entry.total_games);

    this.leaderboardChartData.set({
      labels,
      datasets: [
        {
          label: 'High Score',
          data: scores,
          backgroundColor: 'rgba(102, 126, 234, 0.6)',
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 2
        },
        {
          label: 'Total Juegos',
          data: totalGames,
          backgroundColor: 'rgba(118, 75, 162, 0.6)',
          borderColor: 'rgba(118, 75, 162, 1)',
          borderWidth: 2
        }
      ]
    });
  }

  // ============================================================================
  // TAB 2: ALL PLAYERS
  // ============================================================================

  loadAllPlayers(): void {
    this.isLoadingPlayers.set(true);

    this.playerService.listPlayers().subscribe({
      next: (response) => {
        if (response.ok && response.players) {
          this.allPlayers.set(response.players);
        } else {
          this.notification.error(response.error || this.translate.instant('admin.players.notifications.load_players_error'), NOTIFICATION_DURATION.DEFAULT);
        }
        this.isLoadingPlayers.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('admin.players.notifications.load_players_connection_error'), NOTIFICATION_DURATION.DEFAULT);
        this.isLoadingPlayers.set(false);
      }
    });
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  viewPlayerProfile(playerId: number): void {
    this.selectedPlayerId.set(playerId);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: 'profile', playerId },
      queryParamsHandling: 'merge'
    });
    this.activeTab.set('profile');
    this.loadPlayerProfile(playerId);
  }

  // ============================================================================
  // TAB 3: PLAYER PROFILE
  // ============================================================================

  loadPlayerProfile(playerId: number): void {
    this.isLoadingProfile.set(true);

    this.playerService.getPlayerStats(playerId).subscribe({
      next: (response) => {
        if (response.ok && response.global) {
          this.selectedPlayerStats.set(response);
          if (response.topics && response.topics.length > 0) {
            this.buildProfileChart(response.topics);
          }
        } else {
          this.notification.error(response.error || this.translate.instant('admin.players.notifications.load_profile_error'), NOTIFICATION_DURATION.DEFAULT);
        }
        this.isLoadingProfile.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('admin.players.notifications.load_profile_connection_error'), NOTIFICATION_DURATION.DEFAULT);
        this.isLoadingProfile.set(false);
      }
    });
  }

  private buildProfileChart(topics: PlayerTopicStats[]): void {
    const labels = topics.map(t => t.category_name);
    const accuracyData = topics.map(t => t.accuracy);

    this.profileChartData.set({
      labels,
      datasets: [
        {
          label: 'Precisión (%)',
          data: accuracyData,
          backgroundColor: 'rgba(102, 126, 234, 0.3)',
          borderColor: 'rgba(102, 126, 234, 1)',
          pointBackgroundColor: 'rgba(102, 126, 234, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 2
        }
      ]
    });
  }

  clearPlayerSelection(): void {
    this.selectedPlayerId.set(null);
    this.selectedPlayerStats.set(null);
    this.profileChartData.set(null);
    this.activeTab.set('players');
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  goToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  goToPlayers(): void {
    this.router.navigate(['/admin/players']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }
}
