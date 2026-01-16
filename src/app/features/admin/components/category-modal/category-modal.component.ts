import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AdminService } from '../../../../core/services/admin.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AdminCategory } from '../../../../core/models/admin';
import { HttpStatus } from '../../../../core/constants/http-status.const';
import { NOTIFICATION_DURATION } from '../../../../core/constants/notification-config.const';

@Component({
  selector: 'app-category-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './category-modal.component.html',
  styleUrls: ['../../shared/styles/admin-styles.css', './category-modal.component.css']
})
export class CategoryModalComponent implements OnInit, OnChanges {
  // ========== INPUTS & OUTPUTS ==========
  @Input() categoryToEdit: AdminCategory | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  // ========== FORM ==========
  categoryForm!: FormGroup;

  // ========== UI STATE ==========
  isSavingCategory = signal<boolean>(false);

  constructor(
    private adminService: AdminService,
    private notification: NotificationService,
    private translate: TranslateService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.populateForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoryToEdit'] && !changes['categoryToEdit'].firstChange) {
      this.populateForm();
    }
  }

  /**
   * Inicializa el formulario reactivo
   */
  private initForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
      description: ['']
    });
  }

  /**
   * Puebla el formulario con datos de categoría a editar
   */
  private populateForm(): void {
    if (this.categoryToEdit) {
      this.categoryForm.patchValue({
        name: this.categoryToEdit.name,
        description: this.categoryToEdit.description || ''
      });
    } else {
      this.categoryForm.reset();
    }
  }

  /**
   * Determina si está en modo crear o editar
   */
  get isEditMode(): boolean {
    return this.categoryToEdit !== null;
  }

  /**
   * Cierra el modal
   */
  closeModal(): void {
    this.categoryForm.reset();
    this.categoryForm.enable();
    this.close.emit();
  }

  /**
   * Guarda la categoría (crear o editar según el modo)
   */
  saveCategory(): void {
    // Validación del formulario
    if (this.categoryForm.invalid) {
      this.notification.warning(this.translate.instant('admin.settings.category_modal.notifications.name_required'), NOTIFICATION_DURATION.DEFAULT);
      this.categoryForm.markAllAsTouched();
      return;
    }

    const formValue = this.categoryForm.value;
    const name = formValue.name.trim();
    const description = formValue.description?.trim();

    this.isSavingCategory.set(true);

    // Deshabilitar formulario
    this.categoryForm.disable();

    if (!this.isEditMode) {
      // Crear nueva categoría
      this.adminService.createCategory(name, description || undefined).subscribe({
        next: (response) => {
          if (response.ok) {
            this.notification.success(this.translate.instant('admin.settings.category_modal.notifications.create_success'), NOTIFICATION_DURATION.SHORT);
            this.saved.emit();
            this.closeModal();
          } else {
            this.notification.error(response.error || this.translate.instant('admin.settings.category_modal.notifications.create_error'), NOTIFICATION_DURATION.DEFAULT);
            this.categoryForm.enable();
          }
          this.isSavingCategory.set(false);
        },
        error: (error) => {
          let errorMsg = this.translate.instant('admin.settings.category_modal.notifications.create_error');
          if (error.status === HttpStatus.BAD_REQUEST) {
            errorMsg = error.error?.error || this.translate.instant('admin.settings.category_modal.notifications.invalid_data');
          }
          this.notification.error(errorMsg, NOTIFICATION_DURATION.DEFAULT);
          this.categoryForm.enable();
          this.isSavingCategory.set(false);
        }
      });
    } else {
      // Editar categoría existente
      const categoryId = this.categoryToEdit?.id;
      if (!categoryId) {
        this.notification.error(this.translate.instant('admin.settings.category_modal.notifications.id_not_found'), NOTIFICATION_DURATION.DEFAULT);
        this.categoryForm.enable();
        this.isSavingCategory.set(false);
        return;
      }

      this.adminService.updateCategory(categoryId, name, description || undefined).subscribe({
        next: (response) => {
          if (response.ok) {
            this.notification.success(this.translate.instant('admin.settings.category_modal.notifications.update_success'), NOTIFICATION_DURATION.SHORT);
            this.saved.emit();
            this.closeModal();
          } else {
            this.notification.error(response.error || this.translate.instant('admin.settings.category_modal.notifications.update_error'), NOTIFICATION_DURATION.DEFAULT);
            this.categoryForm.enable();
          }
          this.isSavingCategory.set(false);
        },
        error: (error) => {
          let errorMsg = this.translate.instant('admin.settings.category_modal.notifications.update_error');
          if (error.status === HttpStatus.BAD_REQUEST) {
            errorMsg = error.error?.error || this.translate.instant('admin.settings.category_modal.notifications.invalid_data');
          }
          this.notification.error(errorMsg, NOTIFICATION_DURATION.DEFAULT);
          this.categoryForm.enable();
          this.isSavingCategory.set(false);
        }
      });
    }
  }
}
