import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService, SupportedLanguage } from '../../../../core/services/language.service';
import { AdminCategory } from '../../../../core/models/admin';
import { GameRoom, CreateRoomPayload, UpdateRoomPayload } from '../../../../core/models/room';

@Component({
    selector: 'app-room-form-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
    templateUrl: './room-form-modal.component.html',
    styleUrls: ['../../shared/styles/admin-styles.css', './room-form-modal.component.css']
})
export class RoomFormModalComponent implements OnInit, OnChanges {
    // ========== INPUTS & OUTPUTS ==========
    @Input() roomToEdit: GameRoom | null = null;
    @Input() categories: AdminCategory[] = [];
    @Input() difficulties: number[] = [1, 2, 3, 4, 5];
    @Output() save = new EventEmitter<CreateRoomPayload | UpdateRoomPayload>();
    @Output() cancel = new EventEmitter<void>();

    // ========== FORM ==========
    roomForm!: FormGroup;

    // ========== UI STATE ==========
    isSaving = signal<boolean>(false);

    constructor(
        public languageService: LanguageService,
        private fb: FormBuilder
    ) {
        this.initForm();
    }

    ngOnInit(): void {
        this.populateForm();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['roomToEdit'] && !changes['roomToEdit'].firstChange) {
            this.populateForm();
        }
    }

    /**
     * Inicializa el formulario reactivo
     */
    private initForm(): void {
        this.roomForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
            description: ['', [Validators.maxLength(255)]],
            max_players: [50, [Validators.required, Validators.min(1), Validators.max(500)]],
            language: ['es', [Validators.required]],
            filter_categories: [[]],
            filter_difficulties: [[]]
        });
    }

    /**
     * Puebla el formulario con datos de sala a editar
     */
    private populateForm(): void {
        if (this.roomToEdit) {
            this.roomForm.patchValue({
                name: this.roomToEdit.name,
                description: this.roomToEdit.description || '',
                max_players: this.roomToEdit.max_players,
                language: this.roomToEdit.language || 'es',
                filter_categories: this.roomToEdit.filter_categories || [],
                filter_difficulties: this.roomToEdit.filter_difficulties || []
            });
        } else {
            this.roomForm.reset({
                name: '',
                description: '',
                max_players: 50,
                language: 'es',
                filter_categories: [],
                filter_difficulties: []
            });
        }
    }

    /**
     * Determina si está en modo crear o editar
     */
    get isEditMode(): boolean {
        return this.roomToEdit !== null;
    }

    /**
     * Cierra el modal
     */
    closeModal(): void {
        this.roomForm.reset();
        this.cancel.emit();
    }

    /**
     * Maneja el toggle de categorías
     */
    onCategoryToggle(categoryId: number, event: Event): void {
        const checkbox = event.target as HTMLInputElement;
        const current: number[] = this.roomForm.get('filter_categories')?.value || [];

        if (checkbox.checked) {
            this.roomForm.patchValue({ filter_categories: [...current, categoryId] });
        } else {
            this.roomForm.patchValue({ filter_categories: current.filter(id => id !== categoryId) });
        }
    }

    /**
     * Maneja el toggle de dificultades
     */
    onDifficultyToggle(difficulty: number, event: Event): void {
        const checkbox = event.target as HTMLInputElement;
        const current: number[] = this.roomForm.get('filter_difficulties')?.value || [];

        if (checkbox.checked) {
            this.roomForm.patchValue({ filter_difficulties: [...current, difficulty] });
        } else {
            this.roomForm.patchValue({ filter_difficulties: current.filter(d => d !== difficulty) });
        }
    }

    /**
     * Previene la entrada de caracteres no numéricos en el campo max_players
     */
    preventNonNumeric(event: KeyboardEvent): void {
        const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
        if (allowedKeys.includes(event.key)) {
            return;
        }

        if (!/^\d$/.test(event.key)) {
            event.preventDefault();
        }
    }

    /**
     * Limpia caracteres no numéricos del campo max_players al escribir
     */
    onMaxPlayersInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const cleanValue = input.value.replace(/\D/g, '');

        if (input.value !== cleanValue) {
            input.value = cleanValue;
            this.roomForm.get('max_players')?.setValue(cleanValue ? parseInt(cleanValue, 10) : null);
        } else if (cleanValue) {
            this.roomForm.get('max_players')?.setValue(parseInt(cleanValue, 10));
        }
    }

    /**
     * Verifica si una categoría está seleccionada
     */
    isCategorySelected(categoryId: number): boolean {
        const selected: number[] = this.roomForm.get('filter_categories')?.value || [];
        return selected.includes(categoryId);
    }

    /**
     * Verifica si una dificultad está seleccionada
     */
    isDifficultySelected(difficulty: number): boolean {
        const selected: number[] = this.roomForm.get('filter_difficulties')?.value || [];
        return selected.includes(difficulty);
    }

    /**
     * Retorna la clave de traducción para el nivel de dificultad
     */
    getDifficultyLabel(difficulty: number): string {
        return `admin.rooms.difficulty.level${difficulty}`;
    }

    /**
     * Guarda la sala (emite el evento para que el padre maneje la lógica)
     */
    saveRoom(): void {
        if (this.roomForm.invalid) {
            this.roomForm.markAllAsTouched();
            return;
        }

        const formValue = this.roomForm.value;
        const payload: CreateRoomPayload | UpdateRoomPayload = {
            name: formValue.name,
            description: formValue.description || (this.isEditMode ? null : undefined),
            max_players: formValue.max_players,
            language: formValue.language,
            filter_categories: formValue.filter_categories.length > 0
                ? formValue.filter_categories
                : (this.isEditMode ? null : undefined),
            filter_difficulties: formValue.filter_difficulties.length > 0
                ? formValue.filter_difficulties
                : (this.isEditMode ? null : undefined)
        };

        this.save.emit(payload);
    }

    /**
     * Establece el estado de guardado
     */
    setSaving(saving: boolean): void {
        this.isSaving.set(saving);
    }
}
