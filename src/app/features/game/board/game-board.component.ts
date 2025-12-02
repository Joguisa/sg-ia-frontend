import { Component, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameService } from '../../../core/services/game.service';
import {
  QuestionFull,
  QuestionOption,
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
      alert('Error: Sesión inválida');
      return;
    }

    this.gameState.set('loading');
    this.selectedOptionId.set(null);
    this.questionCount.update((c) => c + 1);

    this.gameService.getNextQuestion(sessionId, difficulty, this.categoryId()).subscribe({
      next: (response) => {
        if (response.ok && response.question) {
          this.currentQuestion.set(response.question);
          this.gameState.set('playing');
          this.startTimer();
        } else {
          alert(response.error || 'Error al cargar la pregunta');
        }
      },
      error: (error) => {
        console.error('Error al cargar pregunta:', error);
        alert('Error al cargar la pregunta. Intenta de nuevo.');
      }
    });
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

    // Determinar si la respuesta es correcta
    const selectedOption = question.options?.find((opt) => opt.id === selectedId);
    const isCorrect = selectedOption?.is_correct || false;
    const timeTaken = 30 - this.questionTimer(); // 30s - tiempo restante

    // Enviar respuesta
    this.gameService.submitAnswer(sessionId, question.id, selectedId, isCorrect, timeTaken).subscribe({
      next: (response) => {
        if (response.ok) {
          this.feedbackData.set(response);
          this.isAnswerCorrect.set(response.is_correct || false);

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

          // Mostrar feedback
          this.gameState.set('feedback');
          this.isAnswering.set(false);
        } else {
          alert(response.error || 'Error al enviar respuesta');
          this.isAnswering.set(false);
          this.gameState.set('playing');
          this.startTimer();
        }
      },
      error: (error) => {
        console.error('Error:', error);
        alert('Error al procesar tu respuesta');
        this.isAnswering.set(false);
        this.gameState.set('playing');
        this.startTimer();
      }
    });
  }

  nextQuestion(): void {
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
    }, 2000);
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
