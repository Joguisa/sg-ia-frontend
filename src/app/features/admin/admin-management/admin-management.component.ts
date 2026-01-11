import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

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
                if (response.ok && response.admins) {
                    this.admins.set(response.admins);
                } else {
                    this.notification.error('Error al cargar los administradores');
                }
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error cargando administradores:', err);
                this.notification.error('Error de conexión al cargar administradores');
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
            this.notification.error('Solo superadmins pueden crear administradores');
            return;
        }
        this.modalMode.set('create');
        this.selectedAdmin.set(null);
        this.showModal.set(true);
    }

    openEditModal(admin: Admin): void {
        if (!this.isSuperAdmin()) {
            this.notification.error('Solo superadmins pueden editar administradores');
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
                    this.notification.success('Administrador creado exitosamente');
                    this.loadAdmins();
                    this.closeModal();
                } else {
                    this.notification.error(response.error || 'Error al crear administrador');
                }
            },
            error: (err) => {
                console.error('Error creando administrador:', err);
                this.notification.error(err.error?.error || 'Error al crear administrador');
            }
        });
    }

    updateAdmin(dto: UpdateAdminDto): void {
        const adminId = this.selectedAdmin()?.id;
        if (!adminId) return;

        this.adminService.updateAdmin(adminId, dto).subscribe({
            next: (response) => {
                if (response.ok) {
                    this.notification.success('Administrador actualizado exitosamente');
                    this.loadAdmins();
                    this.closeModal();
                } else {
                    this.notification.error(response.error || 'Error al actualizar administrador');
                }
            },
            error: (err) => {
                console.error('Error actualizando administrador:', err);
                this.notification.error(err.error?.error || 'Error al actualizar administrador');
            }
        });
    }

    confirmToggleStatus(admin: Admin): void {
        if (!this.isSuperAdmin()) {
            this.notification.error('Solo superadmins pueden cambiar el estado');
            return;
        }

        // Verificar auto-desactivación
        if (admin.id === this.currentUser()?.id) {
            this.notification.error('No puedes desactivar tu propia cuenta');
            return;
        }

        const newStatus = !admin.is_active;
        const action = newStatus ? 'activar' : 'desactivar';

        if (confirm(`¿Estás seguro de ${action} a ${admin.email}?`)) {
            this.toggleStatus(admin, newStatus);
        }
    }

    toggleStatus(admin: Admin, is_active: boolean): void {
        this.adminService.toggleAdminStatus(admin.id, is_active).subscribe({
            next: (response) => {
                if (response.ok) {
                    const action = is_active ? 'activado' : 'desactivado';
                    this.notification.success(`Administrador ${action} exitosamente`);
                    this.loadAdmins();
                } else {
                    this.notification.error(response.error || 'Error al cambiar estado');
                }
            },
            error: (err) => {
                console.error('Error cambiando estado:', err);
                this.notification.error(err.error?.error || 'Error al cambiar estado');
            }
        });
    }

    confirmDelete(admin: Admin): void {
        if (!this.isSuperAdmin()) {
            this.notification.error('Solo superadmins pueden eliminar administradores');
            return;
        }

        // Verificar auto-eliminación
        if (admin.id === this.currentUser()?.id) {
            this.notification.error('No puedes eliminar tu propia cuenta');
            return;
        }

        if (confirm(`¿Estás seguro de eliminar a ${admin.email}? Esta acción desactivará la cuenta.`)) {
            this.deleteAdmin(admin);
        }
    }

    deleteAdmin(admin: Admin): void {
        this.adminService.deleteAdmin(admin.id).subscribe({
            next: (response) => {
                if (response.ok) {
                    this.notification.success('Administrador eliminado exitosamente');
                    this.loadAdmins();
                } else {
                    this.notification.error(response.error || 'Error al eliminar administrador');
                }
            },
            error: (err) => {
                console.error('Error eliminando administrador:', err);
                this.notification.error(err.error?.error || 'Error al eliminar administrador');
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
