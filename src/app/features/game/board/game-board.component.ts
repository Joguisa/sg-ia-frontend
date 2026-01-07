import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameService } from '../../../core/services/game.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  QuestionFull,
  AnswerSubmitResponse,
  GameSession,
  GameState,
  SessionRoomData
} from '../../../core/models/game/game-flow.interface';
import { HttpStatus } from '../../../core/constants/http-status.const';
import { NOTIFICATION_DURATION } from '../../../core/constants/notification-config.const';

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
  private roomCode: string | null = null;
  currentRoom = signal<SessionRoomData | null>(null);
  // categoryId = 0 significa "todas las categorías"

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
  maxQuestions = signal<number>(15);
  lockedLevels = signal<number[]>([]);

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

  // Progress indicators for question limit
  progressPercentage = computed(() => {
    const answered = this.questionCount();
    const max = this.maxQuestions();
    return max > 0 ? Math.round((answered / max) * 100) : 0;
  });

  remainingQuestions = computed(() => {
    return Math.max(0, this.maxQuestions() - this.questionCount());
  });

  constructor(
    private gameService: GameService,
    private notification: NotificationService,
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
    const roomCodeStr = localStorage.getItem('roomCode');

    if (!playerIdStr) {
      // Sin ID de jugador, redirigir a /play
      this.router.navigate(['/play']);
      return;
    }

    this.playerId = parseInt(playerIdStr, 10);
    this.playerName.set(playerNameStr || 'Jugador');
    this.roomCode = roomCodeStr || null;

    // Iniciar sesión de juego (con código de sala si existe)
    this.gameService.startSession(this.playerId, 1.0, this.roomCode || undefined).subscribe({
      next: (session: GameSession) => {
        console.log('next session', session);
        if (session.session_id) {
          this.sessionId.set(session.session_id);
          this.difficulty.set(session.current_difficulty);

          // Guardar información de la sala si existe
          if (session.room) {
            this.currentRoom.set(session.room);
          }

          // Cargar primera pregunta
          this.loadNextQuestion();
        }
      },
      error: (error) => {
        // Manejar errores específicos de sala
        if (error.error?.error) {
          this.notification.error(error.error.error, NOTIFICATION_DURATION.LONG);
        } else {
          this.notification.error('Error al iniciar el juego. Intenta de nuevo.', NOTIFICATION_DURATION.LONG);
        }
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

    // No pasar categoryId (default 0 = todas las categorías)
    this.gameService.getNextQuestion(sessionId, difficulty).subscribe({
      next: (response) => {

        if (response.ok && response.question) {
          this.currentQuestion.set(response.question);

          // Actualizar metadata de progreso si está disponible
          if (response.question.progress) {
            this.maxQuestions.set(response.question.progress.max_questions);
            this.lockedLevels.set(response.question.progress.locked_levels || []);
            this.questionCount.set(response.question.progress.total_answered);
          }

          this.gameState.set('playing');
          this.startTimer();
        } else if (response.completed) {
          // Cuestionario completado exitosamente
          this.handleGameCompleted(response.message || '¡Felicitaciones! Completaste el cuestionario');
        } else {
          // No hay más preguntas disponibles - fin del juego por completar todas
          this.handleNoQuestionsAvailable('¡Felicitaciones! Has completado todas las preguntas disponibles.');
        }
      },
      error: (error) => {
        // Detectar si es un 404 (no hay preguntas verificadas disponibles)
        if (error.status === HttpStatus.NOT_FOUND) {
          this.handleNoQuestionsAvailable('¡Felicitaciones! Has respondido todas las preguntas verificadas disponibles.');
        } else {
          this.showErrorMessage('Error de conexión. Por favor, verifica tu conexión a internet.');
        }
      }
    });
  }

  private handleNoQuestionsAvailable(message: string): void {
    this.stopTimer();
    // Usar 'completed' en lugar de 'gameover' cuando no es por vidas
    this.gameState.set('completed');
    this.notification.warning(message, NOTIFICATION_DURATION.LONG);
    // Ya no redirigimos automáticamente - el usuario controla con un botón
  }

  private handleGameCompleted(message: string): void {
    this.stopTimer();
    this.gameState.set('completed');
    this.notification.success(message, NOTIFICATION_DURATION.LONG);
    // Ya no redirigimos automáticamente - el usuario controla con un botón
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  private showErrorMessage(message: string): void {
    this.notification.error(message, NOTIFICATION_DURATION.LONG);
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
      this.notification.warning('Por favor selecciona una opción', NOTIFICATION_DURATION.DEFAULT);
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

          // Incrementar contador de preguntas respondidas
          this.questionCount.update((c) => c + 1);

          // Verificar si alcanzó el límite de preguntas
          if (this.questionCount() >= this.maxQuestions()) {
            this.gameState.set('feedback');
            this.isAnswering.set(false);
            setTimeout(() => {
              this.handleGameCompleted('¡Felicitaciones! Completaste el cuestionario');
            }, 1000);
            return;
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
          this.notification.error(response.error || 'Error al enviar respuesta', NOTIFICATION_DURATION.DEFAULT);
          this.isAnswering.set(false);
          this.gameState.set('playing');
          this.startTimer();
        }
      },
      error: (error) => {
        this.notification.error('Error al procesar tu respuesta', NOTIFICATION_DURATION.DEFAULT);
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
    // Ya no redirigimos automáticamente - el usuario controla con un botón
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
