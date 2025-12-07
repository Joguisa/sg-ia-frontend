import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameService } from '../../../core/services/game.service';
import {
  QuestionFull,
  AnswerSubmitResponse,
  GameSession
} from '../../../core/models/game/game-flow.interface';

type GameState = 'loading' | 'playing' | 'feedback' | 'gameover';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.css']
})
export class GameBoardComponent implements OnInit {
  // Session data
  private playerId!: number;
  private sessionId = signal<number | null>(null);
  private categoryId = signal<number>(1);

  // Game state
  gameState = signal<GameState>('loading');
  isAnswering = signal<boolean>(false);

  // Question data
  currentQuestion = signal<QuestionFull | null>(null);
  selectedOptionId = signal<number | null>(null);

  // Game progress
  score = signal<number>(0);
  lives = signal<number>(3);
  difficulty = signal<number>(1.0);
  questionCount = signal<number>(0);

  // Feedback data
  feedbackData = signal<AnswerSubmitResponse | null>(null);
  isAnswerCorrect = signal<boolean>(false);

  // Player info
  playerName = signal<string>('Jugador');

  // Timer
  questionTimer = signal<number>(0);
  private timerInterval: any = null;

  // Computed properties
  livesDisplay = computed(() => {
    const l = this.lives();
    return Array(3)
      .fill(0)
      .map((_, i) => i < l);
  });

  difficultyPercentage = computed(() => {
    const diff = this.difficulty();
    return Math.round((diff / 5) * 100);
  });

  constructor(
    private gameService: GameService,
    private router: Router
  ) {
    // Watch for game over state
    effect(() => {
      if (this.lives() === 0) {
        this.endGame();
      }
    });
  }

  ngOnInit(): void {
    this.initializeGame();
  }

  private initializeGame(): void {
    // Obtener ID del jugador desde localStorage
    const playerIdStr = localStorage.getItem('playerId');
    const playerNameStr = localStorage.getItem('playerName');

    if (!playerIdStr) {
      // Sin ID de jugador, redirigir a /play
      this.router.navigate(['/play']);
      return;
    }

    this.playerId = parseInt(playerIdStr, 10);
    this.playerName.set(playerNameStr || 'Jugador');

    // Iniciar sesión de juego
    this.gameService.startSession(this.playerId, 1.0).subscribe({
      next: (session: GameSession) => {
        if (session.session_id) {
          this.sessionId.set(session.session_id);
          this.difficulty.set(session.current_difficulty);
          // Cargar primera pregunta
          this.loadNextQuestion();
        }
      },
      error: (error) => {
        console.error('Error al iniciar sesión:', error);
        alert('Error al iniciar el juego. Intenta de nuevo.');
        this.router.navigate(['/play']);
      }
    });
  }

  private loadNextQuestion(): void {
    const sessionId = this.sessionId();
    const difficulty = this.difficulty();

    if (!sessionId) {
      this.showErrorMessage('Error: Sesión inválida');
      return;
    }

    this.gameState.set('loading');
    this.selectedOptionId.set(null);
    this.feedbackData.set(null); // Limpiar feedback anterior
    this.questionCount.update((c) => c + 1);

    this.gameService.getNextQuestion(sessionId, difficulty, this.categoryId()).subscribe({
      next: (response) => {

        if (response.ok && response.question) {
          this.currentQuestion.set(response.question);
          this.gameState.set('playing');
          this.startTimer();
        } else {
          this.handleNoQuestionsAvailable(response.error);
        }
      },
      error: (error) => {
        // Detectar si es un 404 (no hay preguntas) o un error real de conexión
        if (error.status === 404) {
          this.handleNoQuestionsAvailable(error.error?.error || 'No hay más preguntas disponibles para tu nivel');
        } else {
          this.showErrorMessage('Error de conexión. Por favor, verifica tu conexión a internet.');
        }
      }
    });
  }

  private handleNoQuestionsAvailable(errorMessage?: string): void {
    this.stopTimer();
    this.gameState.set('gameover');
    // Redirigir al perfil después de mostrar el mensaje
    setTimeout(() => {
      this.router.navigate(['/profile']);
    }, 5000);
  }

  private showErrorMessage(message: string): void {
    // Aquí usamos alert temporalmente, pero se podría reemplazar con un modal o toast
    alert(message);
  }

  selectOption(optionId: number): void {
    if (this.gameState() !== 'playing' || this.isAnswering()) {
      return;
    }

    this.selectedOptionId.set(optionId);
  }

  submitAnswer(): void {
    const sessionId = this.sessionId();
    const question = this.currentQuestion();
    const selectedId = this.selectedOptionId();

    if (!sessionId || !question || selectedId === null) {
      alert('Por favor selecciona una opción');
      return;
    }

    this.isAnswering.set(true);
    this.gameState.set('loading');
    this.stopTimer();

    // Calcular tiempo tomado
    const timeTaken = 30 - this.questionTimer(); // 30s - tiempo restante


    // Enviar respuesta (el backend calculará is_correct)
    this.gameService.submitAnswer(sessionId, question.id, selectedId, timeTaken).subscribe({
      next: (response) => {
        if (response.ok) {
          // Confiar en el backend: is_correct viene calculado del servidor
          const isAnswerCorrect = response.is_correct || false;

          this.feedbackData.set(response);
          this.isAnswerCorrect.set(isAnswerCorrect);

          // Actualizar estado del juego
          if (response.score !== undefined) {
            this.score.set(response.score);
          }
          if (response.lives !== undefined) {
            this.lives.set(response.lives);
          }
          if (response.next_difficulty !== undefined) {
            this.difficulty.set(response.next_difficulty);
          }

          // IMPORTANTE: Si lives = 0, el effect() activará endGame() automáticamente
          // Pero mostramos el feedback brevemente antes de game over
          this.gameState.set('feedback');
          this.isAnswering.set(false);

          // Si lives = 0, después de mostrar feedback por 3 segundos, forzar game over
          if (response.lives === 0) {
            setTimeout(() => {
              if (this.lives() === 0 && this.gameState() !== 'gameover') {
                this.endGame();
              }
            }, 3000);
          }
        } else {
          alert(response.error || 'Error al enviar respuesta');
          this.isAnswering.set(false);
          this.gameState.set('playing');
          this.startTimer();
        }
      },
      error: (error) => {
        alert('Error al procesar tu respuesta');
        this.isAnswering.set(false);
        this.gameState.set('playing');
        this.startTimer();
      }
    });
  }

  nextQuestion(): void {
    if (this.lives() === 0) {
      if (this.gameState() !== 'gameover') {
        this.endGame();
      }
      return;
    }

    this.loadNextQuestion();
  }

  private startTimer(): void {
    this.questionTimer.set(30);
    this.timerInterval = setInterval(() => {
      this.questionTimer.update((t) => {
        if (t <= 1) {
          this.stopTimer();
          // Auto-submit cuando se acabe el tiempo
          if (this.gameState() === 'playing' && !this.isAnswering()) {
            this.submitAnswer();
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private endGame(): void {
    this.gameState.set('gameover');
    this.stopTimer();
    // Redirigir a resumen después de 2 segundos
    setTimeout(() => {
      this.router.navigate(['/profile']);
    }, 5000);
  }

  getOptionClass(optionId: number): string {
    const selected = this.selectedOptionId() === optionId;
    const feedback = this.gameState() === 'feedback';
    const feedbackData = this.feedbackData();

    if (!feedback) {
      return selected ? 'option-selected' : '';
    }

    // En modo feedback, mostrar respuesta correcta e incorrecta
    if (feedbackData?.correct_option_id === optionId) {
      return 'option-correct';
    }

    if (selected && !this.isAnswerCorrect()) {
      return 'option-incorrect';
    }

    return '';
  }

  getTimerColor(): string {
    const timer = this.questionTimer();
    if (timer > 15) return 'timer-safe';
    if (timer > 5) return 'timer-warning';
    return 'timer-danger';
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}
