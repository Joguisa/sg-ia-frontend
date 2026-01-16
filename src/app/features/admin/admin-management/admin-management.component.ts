import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Admin, CreateAdminDto, UpdateAdminDto, AdminRole } from '../../../core/models/admin';
import { AdminFormModalComponent } from '../components/admin-form-modal/admin-form-modal.component';

@Component({
    selector: 'app-admin-management',
    standalone: true,
    imports: [CommonModule, FormsModule, AdminFormModalComponent, TranslatePipe],
    templateUrl: './admin-management.component.html',
    styleUrls: [
        '../shared/styles/admin-styles.css',
        './admin-management.component.css'
    ]
})
export class AdminManagementComponent implements OnInit {

    // Estado
    admins = signal<Admin[]>([]);
    isLoading = signal<boolean>(false);
    currentUser = signal<{ id: number; email: string; role: AdminRole } | null>(null);
    isSuperAdmin = computed(() => this.currentUser()?.role === 'superadmin');

    // Modal state
    showModal = signal<boolean>(false);
    modalMode = signal<'create' | 'edit'>('create');
    selectedAdmin = signal<Admin | null>(null);

    // ========== CONFIRMACIÓN DE BORRADO ==========
    deleteAdminConfirmId = signal<number | null>(null);

    // Search
    searchQuery = signal<string>('');
    filteredAdmins = computed(() => {
        const search = this.searchQuery().toLowerCase();
        if (!search) return this.admins();
        return this.admins().filter(a =>
            a.email.toLowerCase().includes(search) ||
            a.id.toString().includes(search) ||
            a.role.toLowerCase().includes(search)
        );
    });

    constructor(
        private adminService: AdminService,
        private authService: AuthService,
        private notification: NotificationService,
        private translate: TranslateService,
        private router: Router
    ) { }

    ngOnInit(): void {
        const user = this.authService.getCurrentUser();
        this.currentUser.set(user);
        this.loadAdmins();
    }

    loadAdmins(): void {
        this.isLoading.set(true);

        this.adminService.listAdmins().subscribe({
            next: (response) => {
                // If success and has admins, set them
                if (response.ok && response.admins) {
                    this.admins.set(response.admins);
                }
                // If response is NOT ok, but it might be because of "no results" (depending on backend)
                // We'll trust that a true error will have a distinct message. 
                // However, for safety, if we have no admins but it failed, we default empty 
                // unless it's a critical error we want to show.
                else {
                    // If the error message suggests simply no data found, we suppress it.
                    // But without knowing the exact backend error string, we'll try to be safe.
                    // Current backend behavior for "no data" often returns false + "No registered admins" etc.
                    // We will assume that if we get here, we might just have 0 admins.
                    // BUT, typically valid empty list is ok:true, admins:[].
                    // If backend sends ok:false for empty list, we handle it here:

                    // Check if the error message is "innocent"
                    const err = response.error || '';
                    if (err.toLowerCase().includes('no') && (err.toLowerCase().includes('found') || err.toLowerCase().includes('registrado'))) {
                        this.admins.set([]);
                    } else {
                        // Real error
                        this.notification.error(response.error || this.translate.instant('admin.admins.notifications.load_error'));
                    }
                }
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error cargando administradores:', err);

                // Handle 404 as empty list if that's what backend returns
                if (err.status === 404) {
                    this.admins.set([]);
                } else {
                    this.notification.error(this.translate.instant('admin.admins.notifications.load_connection_error'));
                }
                this.isLoading.set(false);
            }
        });
    }

    onSearchChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.searchQuery.set(input.value);
    }

    openCreateModal(): void {
        if (!this.isSuperAdmin()) {
            this.notification.error(this.translate.instant('admin.admins.notifications.create_permission_error'));
            return;
        }
        this.modalMode.set('create');
        this.selectedAdmin.set(null);
        this.showModal.set(true);
    }

    openEditModal(admin: Admin): void {
        if (!this.isSuperAdmin()) {
            this.notification.error(this.translate.instant('admin.admins.notifications.edit_permission_error'));
            return;
        }
        this.modalMode.set('edit');
        this.selectedAdmin.set(admin);
        this.showModal.set(true);
    }

    closeModal(): void {
        this.showModal.set(false);
        this.selectedAdmin.set(null);
    }

    handleSave(data: CreateAdminDto | UpdateAdminDto): void {
        if (this.modalMode() === 'create') {
            this.createAdmin(data as CreateAdminDto);
        } else {
            this.updateAdmin(data as UpdateAdminDto);
        }
    }

    createAdmin(dto: CreateAdminDto): void {
        this.adminService.createAdmin(dto).subscribe({
            next: (response) => {
                if (response.ok) {
                    this.notification.success(this.translate.instant('admin.admins.notifications.create_success'));
                    this.loadAdmins();
                    this.closeModal();
                } else {
                    this.notification.error(response.error || this.translate.instant('admin.admins.notifications.create_error'));
                }
            },
            error: (err) => {
                console.error('Error creando administrador:', err);
                this.notification.error(err.error?.error || this.translate.instant('admin.admins.notifications.create_error'));
            }
        });
    }

    updateAdmin(dto: UpdateAdminDto): void {
        const adminId = this.selectedAdmin()?.id;
        if (!adminId) return;

        this.adminService.updateAdmin(adminId, dto).subscribe({
            next: (response) => {
                if (response.ok) {
                    this.notification.success(this.translate.instant('admin.admins.notifications.update_success'));
                    this.loadAdmins();
                    this.closeModal();
                } else {
                    this.notification.error(response.error || this.translate.instant('admin.admins.notifications.update_error'));
                }
            },
            error: (err) => {
                console.error('Error actualizando administrador:', err);
                this.notification.error(err.error?.error || this.translate.instant('admin.admins.notifications.update_error'));
            }
        });
    }

    confirmToggleStatus(admin: Admin): void {
        if (!this.isSuperAdmin()) {
            this.notification.error(this.translate.instant('admin.admins.notifications.status_permission_error'));
            return;
        }

        // Verificar auto-desactivación
        if (admin.id === this.currentUser()?.id) {
            this.notification.error(this.translate.instant('admin.admins.notifications.self_status_error'));
            return;
        }

        // [SAFE MODE] Cannot deactivate other superadmins
        if (admin.role === 'superadmin') {
            this.notification.error(this.translate.instant('admin.admins.notifications.superadmin_status_error'));
            return;
        }

        const newStatus = !admin.is_active;
        const action = newStatus ? 'activar' : 'desactivar';

        if (confirm(this.translate.instant('admin.admins.notifications.status_confirm', { action, email: admin.email }))) {
            this.toggleStatus(admin, newStatus);
        }
    }

    toggleStatus(admin: Admin, is_active: boolean): void {
        this.adminService.toggleAdminStatus(admin.id, is_active).subscribe({
            next: (response) => {
                if (response.ok) {
                    const action = is_active ? 'activado' : 'desactivado';
                    this.notification.success(this.translate.instant('admin.admins.notifications.status_success', { action }));
                    this.loadAdmins();
                } else {
                    this.notification.error(response.error || this.translate.instant('admin.admins.notifications.status_error'));
                }
            },
            error: (err) => {
                console.error('Error cambiando estado:', err);
                this.notification.error(err.error?.error || this.translate.instant('admin.admins.notifications.status_error'));
            }
        });
    }

    /**
     * Solicita confirmación visual para eliminar un admin
     */
    confirmDelete(admin: Admin): void {
        if (!this.isSuperAdmin()) {
            this.notification.error(this.translate.instant('admin.admins.notifications.delete_permission_error'));
            return;
        }

        // Verificar auto-eliminación
        if (admin.id === this.currentUser()?.id) {
            this.notification.error(this.translate.instant('admin.admins.notifications.self_delete_error'));
            return;
        }

        // [SAFE MODE] Cannot delete other superadmins
        if (admin.role === 'superadmin') {
            this.notification.error(this.translate.instant('admin.admins.notifications.superadmin_delete_error'));
            return;
        }

        // Mostrar confirmación visual
        this.deleteAdminConfirmId.set(admin.id);
    }

    /**
     * Ejecuta la eliminación del admin tras confirmación
     */
    executeDeleteAdmin(adminId: number): void {
        this.adminService.deleteAdmin(adminId).subscribe({
            next: (response) => {
                if (response.ok) {
                    const admins = this.admins().filter(a => a.id !== adminId);
                    this.admins.set(admins);
                    this.notification.success(this.translate.instant('admin.admins.notifications.delete_success'));
                    this.deleteAdminConfirmId.set(null);
                } else {
                    this.notification.error(response.error || this.translate.instant('admin.admins.notifications.delete_error'));
                    this.deleteAdminConfirmId.set(null);
                }
            },
            error: (err) => {
                console.error('Error eliminando administrador:', err);
                this.notification.error(err.error?.error || this.translate.instant('admin.admins.notifications.delete_error'));
                this.deleteAdminConfirmId.set(null);
            }
        });
    }

    /**
     * Cancela la eliminación del admin
     */
    cancelDeleteAdmin(): void {
        this.deleteAdminConfirmId.set(null);
    }

    deleteAdmin(admin: Admin): void {
        this.adminService.deleteAdmin(admin.id).subscribe({
            next: (response) => {
                if (response.ok) {
                    this.notification.success(this.translate.instant('admin.admins.notifications.delete_success'));
                    this.loadAdmins();
                } else {
                    this.notification.error(response.error || this.translate.instant('admin.admins.notifications.delete_error'));
                }
            },
            error: (err) => {
                console.error('Error eliminando administrador:', err);
                this.notification.error(err.error?.error || this.translate.instant('admin.admins.notifications.delete_error'));
            }
        });
    }

    getRoleBadgeClass(role: AdminRole): string {
        return role === 'superadmin' ? 'badge-superadmin' : 'badge-admin';
    }

    getStatusBadgeClass(isActive: boolean): string {
        return isActive ? 'badge-active' : 'badge-inactive';
    }

    canModify(admin: Admin): boolean {
        return this.isSuperAdmin() && admin.id !== this.currentUser()?.id;
    }

    goToDashboard(): void {
        this.router.navigate(['/admin/dashboard']);
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/admin/login']);
    }
}
