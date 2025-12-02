import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlayerService } from '../../../core/services/player.service';

@Component({
  selector: 'app-game-start',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game-start.component.html',
  styleUrls: ['./game-start.component.css']
})
export class GameStartComponent {
  name = signal<string>('');
  age = signal<number | null>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  constructor(
    private playerService: PlayerService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.errorMessage.set('');

    // Validación básica
    if (!this.name().trim()) {
      this.errorMessage.set('Por favor ingresa tu nombre');
      return;
    }

    if (!this.age() || this.age()! < 1 || this.age()! > 120) {
      this.errorMessage.set('Por favor ingresa una edad válida (1-120)');
      return;
    }

    this.isLoading.set(true);

    // Crear jugador
    this.playerService.createPlayer(this.name().trim(), this.age()!).subscribe({
      next: (response) => {
        if (response.ok && response.player) {
          // Guardar ID del jugador en localStorage
          localStorage.setItem('playerId', response.player.id.toString());
          localStorage.setItem('playerName', response.player.name);

          // Redirigir al tablero de juego
          this.router.navigate(['/game/board']);
        } else {
          this.errorMessage.set(response.error || 'Error al crear jugador');
          this.isLoading.set(false);
        }
      },
      error: (error) => {
        console.error('Error:', error);
        this.errorMessage.set(
          'Hubo un problema al conectar con el servidor. Intenta de nuevo.'
        );
        this.isLoading.set(false);
      }
    });
  }

  goToAdmin(): void {
    this.router.navigate(['/admin/login']);
  }
}
