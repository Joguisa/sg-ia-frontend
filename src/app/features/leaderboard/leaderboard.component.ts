import { Component, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameService } from '../../core/services/game.service';

/**
 * Interface para un jugador en el leaderboard
 */
interface LeaderboardEntry {
  rank: number;
  player_id: number;
  player_name: string;
  age: number;
  high_score: number;
  total_games: number;
  total_score: number;
  overall_accuracy: number;
}

/**
 * Interface para la respuesta del leaderboard
 */
interface LeaderboardResponse {
  ok: boolean;
  leaderboard?: LeaderboardEntry[];
  error?: string;
}

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadLeaderboard();
  }

  /**
   * Carga el leaderboard desde la API
   */
  private loadLeaderboard(): void {
    console.log('[Leaderboard] Loading leaderboard...');

    // Obtener mi playerId del localStorage
    const playerIdStr = localStorage.getItem('playerId');
    if (playerIdStr) {
      this.myPlayerId.set(parseInt(playerIdStr));
    }

    // Llamar al servicio para obtener el leaderboard
    this.gameService.getLeaderboard().subscribe({
      next: (response: LeaderboardResponse) => {
        console.log('[Leaderboard] Response:', response);

        if (response.ok && response.leaderboard) {
          // Asignar rankings (el backend retorna rank: 0, así que asignamos nosotros)
          const leaderboardWithRanks = response.leaderboard.map((entry, index) => ({
            ...entry,
            rank: index + 1 // Rank empieza en 1
          }));

          this.leaderboard.set(leaderboardWithRanks);
          console.log('[Leaderboard] Leaderboard loaded successfully');
          this.isLoading.set(false);
        } else {
          this.errorMessage.set(response.error || 'Error al cargar el leaderboard.');
          this.isLoading.set(false);
        }
      },
      error: (error) => {
        console.error('[Leaderboard] Error:', error);
        let errorMsg = 'Hubo un problema al cargar el leaderboard.';

        if (error.status === 404) {
          errorMsg = 'No hay datos de leaderboard disponibles.';
        } else if (error.status === 0) {
          errorMsg = 'No se puede conectar al servidor.';
        }

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
}
