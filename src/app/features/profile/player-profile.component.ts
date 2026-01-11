import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PlayerService } from '../../core/services/player.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  PlayerProfileResponse,
  PlayerGlobalStats,
  PlayerTopicStats
} from '../../core/models/player';
import { HttpStatus } from '../../core/constants/http-status.const';
import { NOTIFICATION_DURATION } from '../../core/constants/notification-config.const';
import { TranslateModule, TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'app-player-profile',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './player-profile.component.html',
  styleUrls: ['./player-profile.component.css']
})
export class PlayerProfileComponent implements OnInit {
  // Estado reactivo con Signals
  playerName = signal<string>('Jugador');
  playerStats = signal<PlayerGlobalStats | null>(null);
  topicStats = signal<PlayerTopicStats[] | null>(null);

  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  constructor(
    private playerService: PlayerService,
    private translate: TranslateService,
    private notification: NotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadPlayerStats();
  }

  /**
   * Carga las estadísticas del jugador desde localStorage y API
   */
  private loadPlayerStats(): void {
    try {
      // Obtener playerId y playerName del localStorage
      const playerId = localStorage.getItem('playerId');
      const playerName = localStorage.getItem('playerName');

      if (!playerId) {
        this.errorMessage.set('No se encontró ID del jugador. Por favor, registrarse primero.');
        this.isLoading.set(false);
        // Redirigir a /play después de 2 segundos
        setTimeout(() => this.router.navigate(['/play']), 2000);
        return;
      }

      // Mostrar nombre del jugador
      if (playerName) {
        this.playerName.set(playerName);
      }

      // Llamar al servicio para obtener estadísticas
      this.playerService.getPlayerStats(parseInt(playerId)).subscribe({
        next: (response: PlayerProfileResponse) => {

          if (response.ok && response.global && response.topics) {
            this.playerStats.set(response.global);
            this.topicStats.set(response.topics);
            this.isLoading.set(false);
          } else {
            this.errorMessage.set(response.error || 'Error al cargar las estadísticas.');
            this.isLoading.set(false);
          }
        },
        error: (error) => {
          let errorMsg = 'Hubo un problema al cargar las estadísticas.';

          if (error.status === HttpStatus.NOT_FOUND) {
            errorMsg = 'Jugador no encontrado.';
          } else if (error.status === 0) {
            errorMsg = 'No se puede conectar al servidor.';
          }

          this.notification.error(errorMsg, NOTIFICATION_DURATION.LONG);
          this.errorMessage.set(errorMsg);
          this.isLoading.set(false);
        }
      });
    } catch (error) {
      this.notification.error('Error inesperado al cargar el perfil.', NOTIFICATION_DURATION.LONG);
      this.errorMessage.set('Error inesperado al cargar el perfil.');
      this.isLoading.set(false);
    }
  }

  /**
   * Navega a /game/board para jugar de nuevo
   */
  playAgain(): void {
    this.router.navigate(['/game/board']);
  }

  /**
   * Borra localStorage y redirige a /play
   */
  goToHome(): void {
    localStorage.removeItem('playerId');
    localStorage.removeItem('playerName');
    this.router.navigate(['/play']);
  }

  /**
   * Calcula el porcentaje de precisión global
   */
  getOverallAccuracy(): number {
    if (!this.topicStats()) return 0;

    const topics = this.topicStats()!;
    if (topics.length === 0) return 0;

    const totalAnswers = topics.reduce((sum, t) => sum + t.answers, 0);
    const correctAnswers = topics.reduce((sum, t) => sum + (t.answers * (t.accuracy / 100)), 0);

    return totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
  }

  /**
   * Obtiene el color para la barra de dificultad basado en el valor
   */
  getDifficultyColor(difficulty: number): string {
    if (difficulty < 2) return 'success'; // Verde
    if (difficulty < 3.5) return 'info'; // Azul
    if (difficulty < 4.5) return 'warning'; // Amarillo
    return 'danger'; // Rojo
  }

  /**
   * Formatea el tiempo promedio en segundos a un formato legible
   */
  formatTime(seconds: number): string {
    return `${seconds.toFixed(1)}s`;
  }
}
