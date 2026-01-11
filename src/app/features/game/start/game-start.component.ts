import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PlayerService } from '../../../core/services/player.service';
import { RoomService } from '../../../core/services/room.service';
import { LanguageService } from '../../../core/services/language.service';
import { GameRoom } from '../../../core/models/room';

@Component({
  selector: 'app-game-start',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './game-start.component.html',
  styleUrls: ['./game-start.component.css']
})
export class GameStartComponent {
  playerForm: FormGroup;
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Room code signals
  showRoomCode = signal<boolean>(false);
  isValidatingRoom = signal<boolean>(false);
  roomValidated = signal<boolean>(false);
  validatedRoom = signal<GameRoom | null>(null);
  roomError = signal<string>('');

  constructor(
    private fb: FormBuilder,
    private playerService: PlayerService,
    private roomService: RoomService,
    private languageService: LanguageService,
    private router: Router
  ) {
    this.playerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      age: ['', [Validators.required, this.ageValidator]],
      roomCode: ['', [Validators.pattern(/^[A-Za-z0-9]{6}$/)]]
    });
  }

  // Validador personalizado para edad
  ageValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (!value) {
      return { required: true };
    }

    // Validar que solo contenga dígitos
    if (!/^\d+$/.test(value)) {
      return { invalidFormat: true };
    }

    const ageNumber = parseInt(value, 10);

    // Validar rango
    if (isNaN(ageNumber) || ageNumber < 1 || ageNumber > 120) {
      return { outOfRange: true };
    }

    return null;
  }

  // Método para filtrar solo números en el input
  onAgeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Eliminar cualquier carácter que no sea un dígito
    const numbersOnly = value.replace(/\D/g, '');

    // Actualizar el valor del input
    input.value = numbersOnly;
    this.playerForm.patchValue({ age: numbersOnly }, { emitEvent: false });
  }

  onSubmit(): void {
    this.errorMessage.set('');

    // Marcar todos los campos como touched para mostrar errores
    this.playerForm.markAllAsTouched();

    // Validar el formulario
    if (this.playerForm.invalid) {
      if (this.playerForm.get('name')?.hasError('required')) {
        this.errorMessage.set('Por favor ingresa tu nombre');
      } else if (this.playerForm.get('name')?.hasError('minlength')) {
        this.errorMessage.set('El nombre debe tener al menos 2 caracteres');
      } else if (this.playerForm.get('name')?.hasError('maxlength')) {
        this.errorMessage.set('El nombre no puede exceder los 50 caracteres');
      } else if (this.playerForm.get('age')?.hasError('required')) {
        this.errorMessage.set('Por favor ingresa tu edad');
      } else if (this.playerForm.get('age')?.hasError('invalidFormat')) {
        this.errorMessage.set('La edad debe contener solo números');
      } else if (this.playerForm.get('age')?.hasError('outOfRange')) {
        this.errorMessage.set('Por favor ingresa una edad válida (1-120)');
      }
      return;
    }

    // Validate room code if shown
    if (this.showRoomCode()) {
      const roomCode = this.playerForm.get('roomCode')?.value?.trim();
      if (!roomCode) {
        this.errorMessage.set('Por favor ingresa el código de sala');
        return;
      }
      if (!this.roomValidated()) {
        this.errorMessage.set('Por favor valida el código de sala antes de continuar');
        return;
      }
    }

    this.isLoading.set(true);
    this.playerForm.disable();

    const formValues = this.playerForm.value;
    const name = formValues.name.trim();
    const age = parseInt(formValues.age, 10);
    const roomCode = this.getValidatedRoomCode();

    // Crear jugador
    this.playerService.createPlayer(name, age).subscribe({
      next: (response) => {
        if (response.ok && response.player) {
          // Guardar ID del jugador en localStorage
          localStorage.setItem('playerId', response.player.id.toString());
          localStorage.setItem('playerName', response.player.name);

          // Guardar código de sala si existe
          if (roomCode) {
            localStorage.setItem('roomCode', roomCode);
          } else {
            localStorage.removeItem('roomCode');
          }

          // Redirigir al tablero de juego
          this.router.navigate(['/game/board']);
        } else {
          this.errorMessage.set(response.error || 'Error al crear jugador');
          this.isLoading.set(false);
          this.playerForm.enable();
        }
      },
      error: (error) => {
        console.error('Error:', error);
        this.errorMessage.set(
          'Hubo un problema al conectar con el servidor. Intenta de nuevo.'
        );
        this.isLoading.set(false);
        this.playerForm.enable();
      }
    });
  }

  goToAdmin(): void {
    this.router.navigate(['/admin/login']);
  }

  // ========== ROOM CODE METHODS ==========

  /**
   * Toggle visibility of room code input
   */
  toggleRoomCode(): void {
    const newState = !this.showRoomCode();
    this.showRoomCode.set(newState);

    // Reset room state when hiding
    if (!newState) {
      this.playerForm.patchValue({ roomCode: '' });
      this.roomValidated.set(false);
      this.validatedRoom.set(null);
      this.roomError.set('');
    }
  }

  /**
   * Format room code input (uppercase, alphanumeric only)
   */
  onRoomCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    input.value = value;
    this.playerForm.patchValue({ roomCode: value }, { emitEvent: false });

    // Reset validation when changing code
    if (this.roomValidated()) {
      this.roomValidated.set(false);
      this.validatedRoom.set(null);
    }
    this.roomError.set('');
  }

  /**
   * Validate room code against backend
   */
  validateRoomCode(): void {
    const code = this.playerForm.get('roomCode')?.value?.trim();

    if (!code || code.length !== 6) {
      this.roomError.set('El código de sala debe tener 6 caracteres');
      return;
    }

    this.isValidatingRoom.set(true);
    this.roomError.set('');

    this.roomService.validateRoomCode(code).subscribe({
      next: (response) => {
        this.isValidatingRoom.set(false);
        if (response.ok && response.room) {
          this.roomValidated.set(true);
          this.validatedRoom.set(response.room);
          this.roomError.set('');

          // Change language based on room language
          if (response.room.language) {
            this.languageService.setLanguageForRoom(response.room.language as 'es' | 'en');
          }
        } else {
          this.roomValidated.set(false);
          this.validatedRoom.set(null);
          this.roomError.set(response.error || 'Código de sala inválido');
        }
      },
      error: (error) => {
        this.isValidatingRoom.set(false);
        this.roomValidated.set(false);
        this.validatedRoom.set(null);
        console.error('Error validating room:', error);
        this.roomError.set('Error al validar el código de sala');
      }
    });
  }

  /**
   * Get room code if validated, otherwise undefined
   */
  private getValidatedRoomCode(): string | undefined {
    if (this.showRoomCode() && this.roomValidated()) {
      return this.playerForm.get('roomCode')?.value?.trim().toUpperCase();
    }
    return undefined;
  }
}
