import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { PlayerService } from '../../../core/services/player.service';

@Component({
  selector: 'app-game-start',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './game-start.component.html',
  styleUrls: ['./game-start.component.css']
})
export class GameStartComponent {
  playerForm: FormGroup;
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  constructor(
    private fb: FormBuilder,
    private playerService: PlayerService,
    private router: Router
  ) {
    this.playerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      age: ['', [Validators.required, this.ageValidator]]
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

    this.isLoading.set(true);
    this.playerForm.disable();

    const formValues = this.playerForm.value;
    const name = formValues.name.trim();
    const age = parseInt(formValues.age, 10);

    // Crear jugador
    this.playerService.createPlayer(name, age).subscribe({
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
}
