import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Admin, CreateAdminDto, UpdateAdminDto, AdminRole } from '../../../../core/models/admin';

@Component({
    selector: 'app-admin-form-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
    templateUrl: './admin-form-modal.component.html',
    styleUrls: ['../../shared/styles/admin-styles.css', './admin-form-modal.component.css']
})
export class AdminFormModalComponent implements OnInit {
    @Input() mode: 'create' | 'edit' = 'create';
    @Input() admin: Admin | null = null;

    @Output() saved = new EventEmitter<CreateAdminDto | UpdateAdminDto>();
    @Output() cancelled = new EventEmitter<void>();

    adminForm!: FormGroup;
    isSubmitting = signal<boolean>(false);

    constructor(private fb: FormBuilder) { }

    ngOnInit(): void {
        this.initForm();
    }

    initForm(): void {
        if (this.mode === 'create') {
            this.adminForm = this.fb.group({
                email: ['', [Validators.required, Validators.email]],
                password: ['', [Validators.required, Validators.minLength(8)]],
                role: ['admin' as AdminRole, Validators.required]
            });
        } else {
            // Edit mode
            const isSuperAdmin = this.admin?.role === 'superadmin';

            this.adminForm = this.fb.group({
                email: [this.admin?.email || '', [Validators.required, Validators.email]],
                password: [''], // Optional in edit mode
                role: [{ value: this.admin?.role || 'admin', disabled: isSuperAdmin }, Validators.required]
            });
        }
    }

    get email() {
        return this.adminForm.get('email');
    }

    get password() {
        return this.adminForm.get('password');
    }

    get role() {
        return this.adminForm.get('role');
    }

    onSubmit(): void {
        if (this.adminForm.invalid) {
            this.adminForm.markAllAsTouched();
            return;
        }

        this.isSubmitting.set(true);

        const formValue = this.adminForm.getRawValue(); // use getRawValue to include disabled fields

        if (this.mode === 'create') {
            const dto: CreateAdminDto = {
                email: formValue.email,
                password: formValue.password,
                role: formValue.role
            };
            this.saved.emit(dto);
        } else {
            const dto: UpdateAdminDto = {
                email: formValue.email,
                role: formValue.role
            };

            // Only include password if it was changed
            if (formValue.password && formValue.password.trim() !== '') {
                dto.password = formValue.password;
            }

            this.saved.emit(dto);
        }

        // Reset submitting state after a short delay
        setTimeout(() => this.isSubmitting.set(false), 1000);
    }

    onCancel(): void {
        this.cancelled.emit();
    }
}
