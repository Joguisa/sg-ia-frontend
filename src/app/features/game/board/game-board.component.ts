import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { GameService } from '../../../core/services/game.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LanguageService } from '../../../core/services/language.service';
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
  imports: [CommonModule, TranslatePipe],
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
  isLastQuestion = signal<boolean>(false);

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
    private languageService: LanguageService,
    private translate: TranslateService,
    private router: Router
  ) {
    // Game over is now handled in submitAnswer() via setTimeout
    // to allow showing feedback before transitioning to gameover state
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
          this.notification.error(this.translate.instant('game.notifications.board.start_error'), NOTIFICATION_DURATION.LONG);
        }
        this.router.navigate(['/play']);
      }
    });
  }

  private loadNextQuestion(): void {
    const sessionId = this.sessionId();
    const difficulty = this.difficulty();

    if (!sessionId) {
      this.showErrorMessage(this.translate.instant('game.notifications.board.invalid_session'));
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
          if (this.questionCount() === 0) {
            // No hay preguntas desde el inicio - NO es una felicitación
            this.handleNoQuestionsFromStart();
          } else {
            // Cuestionario completado exitosamente
            this.handleGameCompleted(response.message || this.translate.instant('game.notifications.board.completed'));
          }
        } else {
          // No hay más preguntas disponibles - fin del juego por completar todas
          this.handleNoQuestionsAvailable(this.translate.instant('game.notifications.board.no_questions'));
        }
      },
      error: (error) => {
        // Detectar si es un 404 (no hay preguntas verificadas disponibles)
        if (error.status === HttpStatus.NOT_FOUND) {
          this.handleNoQuestionsAvailable(this.translate.instant('game.notifications.board.no_verified_questions'));
        } else {
          this.showErrorMessage(this.translate.instant('game.notifications.board.connection_error'));
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

  private handleNoQuestionsFromStart(): void {
    this.stopTimer();
    this.gameState.set('no_questions');
    this.notification.warning(
      this.translate.instant('game.notifications.board.no_questions_available'),
      NOTIFICATION_DURATION.LONG
    );
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  goToHome(): void {
    localStorage.removeItem('playerId');
    localStorage.removeItem('playerName');
    localStorage.removeItem('roomCode');
    this.router.navigate(['/play']);
  }

  viewResults(): void {
    this.router.navigate(['/leaderboard']);
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
      this.notification.warning(this.translate.instant('game.notifications.board.select_option'), NOTIFICATION_DURATION.DEFAULT);
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
            this.isLastQuestion.set(true);
            this.gameState.set('feedback');
            this.isAnswering.set(false);
            // El usuario verá el feedback y hará clic en "Ver Resultados"
            return;
          }

          // Si lives = 0, el effect() activará endGame() automáticamente
          // Pero mostramos el feedback brevemente antes de game over
          this.gameState.set('feedback');
          this.isAnswering.set(false);

          // Si lives = 0, mantenemos el estado de feedback para que el usuario vea por qué perdió
          // y le permitimos navegar a resultados manualmente
        } else {
          this.notification.error(response.error || this.translate.instant('game.notifications.board.submit_error'), NOTIFICATION_DURATION.DEFAULT);
          this.isAnswering.set(false);
          this.gameState.set('playing');
          this.startTimer();
        }
      },
      error: (error) => {
        this.notification.error(this.translate.instant('game.notifications.board.process_error'), NOTIFICATION_DURATION.DEFAULT);
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
