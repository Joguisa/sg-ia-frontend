import { Component, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameService } from '../../core/services/game.service';
import { NotificationService } from '../../core/services/notification.service';
import { LeaderboardEntry, LeaderboardResponse } from '../../core/models/player';
import { HttpStatus } from '../../core/constants/http-status.const';
import { NOTIFICATION_DURATION } from '../../core/constants/notification-config.const';
import { TranslateModule, TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css']
})
export class LeaderboardComponent implements OnInit {
  // Signals
  leaderboard = signal<LeaderboardEntry[]>([]);
  myPlayerId = signal<number | null>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  // Computed signal para identificar mi rango
  myRank = computed(() => {
    const playerId = this.myPlayerId();
    if (!playerId) return null;
    const entry = this.leaderboard().find(e => e.player_id === playerId);
    return entry?.rank || null;
  });

  constructor(
    private gameService: GameService,
    private translate: TranslateService,
    private notification: NotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadLeaderboard();
  }

  /**
   * Carga el leaderboard desde la API
   */
  private loadLeaderboard(): void {
    // Obtener mi playerId del localStorage
    const playerIdStr = localStorage.getItem('playerId');
    if (playerIdStr) {
      this.myPlayerId.set(parseInt(playerIdStr));
    }

    // Llamar al servicio para obtener el leaderboard
    this.gameService.getLeaderboard().subscribe({
      next: (response: LeaderboardResponse) => {
        if (response.ok && response.leaderboard) {
          // El backend ya calcula los rankings correctamente
          this.leaderboard.set(response.leaderboard);
          this.isLoading.set(false);
        } else {
          this.errorMessage.set(response.error || this.translate.instant('game.notifications.leaderboard.load_error'));
          this.isLoading.set(false);
        }
      },
      error: (error) => {
        let errorMsg = this.translate.instant('game.notifications.leaderboard.load_error');

        if (error.status === HttpStatus.NOT_FOUND) {
          errorMsg = this.translate.instant('game.notifications.leaderboard.no_data');
        } else if (error.status === 0) {
          errorMsg = this.translate.instant('game.notifications.leaderboard.connection_error');
        }

        this.notification.error(errorMsg, NOTIFICATION_DURATION.LONG);
        this.errorMessage.set(errorMsg);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Verifica si un jugador es el actual
   */
  isCurrentPlayer(playerId: number): boolean {
    return this.myPlayerId() === playerId;
  }

  /**
   * Obtiene el icono para un rango
   */
  getRankIcon(rank: number): string {
    switch (rank) {
      case 1:
        return 'crown';
      case 2:
        return 'medal-2';
      case 3:
        return 'medal-3';
      default:
        return '';
    }
  }

  /**
   * Obtiene la clase CSS para el color del rango
   */
  getRankColor(rank: number): string {
    switch (rank) {
      case 1:
        return 'rank-gold';
      case 2:
        return 'rank-silver';
      case 3:
        return 'rank-bronze';
      default:
        return 'rank-default';
    }
  }

  /**
   * Navega al menú de juego
   */
  goToPlay(): void {
    this.router.navigate(['/play']);
  }

  /**
   * Navega al tablero de juego (si hay playerId)
   */
  goToGame(): void {
    if (this.myPlayerId()) {
      this.router.navigate(['/game/board']);
    } else {
      this.goToPlay();
    }
  }

  /**
   * Formatea porcentaje a 2 decimales
   */
  formatAccuracy(accuracy: number): string {
    return accuracy.toFixed(2);
  }

  /**
   * Navega al perfil del usuario
   */
  goToProfile(): void {
    if (this.myPlayerId()) {
      this.router.navigate(['/profile']);
    }
  }
}
