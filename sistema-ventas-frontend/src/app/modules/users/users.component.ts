// sistema-ventas-frontend/src/app/modules/users/users.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersService } from './users.service';
import { GeneralService } from '../../core/gerneral.service';
import { ModalUserComponent } from './modal-user/modal-user.component';
import { ModalService } from '../../project/services/modal.service';
import { ToasterService } from '../../project/services/toaster.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  Math = Math;
  users: any = { users: [], total: 0, page: 1, limit: 10 };
  currentQuery: any = {};

  constructor(
    private usersService: UsersService,
    private modalService: ModalService,
    private generalService: GeneralService,
    private toaster: ToasterService
  ) {}

  ngOnInit(): void {
    this.generalService.show();
    this.loadUsers();
  }

  // Cargar usuarios con manejo de errores y actualización de la UI
  async loadUsers(query: any = {}) {
    try {
      this.currentQuery = { ...this.currentQuery, ...query };
      this.users = await this.usersService.getUsers(this.currentQuery);
      console.log('Users loaded:', this.users);
    } catch (error) {
      console.error('Error loading users:', error);
      this.toaster.showToast({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los usuarios'
      });
    } finally {
      this.generalService.hide();
    }
  }

  // Abrir el modal para agregar un nuevo usuario
  openAddUserModal() {
    console.log('Opening add user modal');
    this.modalService.open(ModalUserComponent, {
      title: 'Nuevo Usuario',
      width: '800px'
    }).then((reload: boolean) => {
      console.log('Add user modal closed with result:', reload);
      if (reload) this.loadUsers();
    });
  }

  // Abrir el modal para editar un usuario existente
  openEditUserModal(user: any) {
    console.log('Opening edit user modal for:', user);
    
    // CORRECCIÓN: Usar la misma estructura que en categories
    this.modalService.open(ModalUserComponent, {
      title: 'Editar Usuario',
      width: '800px',
      data: { data: user }  // Estructura consistente: {data: user}
    }).then((reload: boolean) => {
      console.log('Edit user modal closed with result:', reload);
      if (reload) this.loadUsers();
    });
  }

  // Confirmar y eliminar un usuario
  confirmDelete(user: any) {
    const confirmMessage = `¿Está seguro de eliminar al usuario "${user.nombre_completo}"?\nEsta acción no se puede deshacer.`;
    
    if (confirm(confirmMessage)) {
      this.deleteUser(user.id_usuario);
    } else {
      console.log('Eliminación cancelada por el usuario');
    }
  }

  // Eliminar un usuario con manejo de errores detallado
  async deleteUser(userId: string) {
    try {
      await this.usersService.deleteUser(userId);
      
      this.toaster.showToast({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Usuario eliminado correctamente'
      });
      
      this.loadUsers();
      
    } catch (error: any) {
      console.error('Error eliminando usuario:', error);
      
      let errorMessage = 'No se pudo eliminar el usuario';
      
      if (error.status === 409) {
        errorMessage = 'No se puede eliminar el usuario porque tiene registros asociados (ventas, compras, etc.)';
      } else if (error.status === 404) {
        errorMessage = 'Usuario no encontrado';
      } else if (error.status === 403) {
        errorMessage = 'No tiene permisos para eliminar usuarios';
      } else if (error.status === 401) {
        errorMessage = 'Sesión expirada. Por favor, inicie sesión nuevamente';
      }
      
      this.toaster.showToast({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage
      });
    }
  }

  // Paginación
  nextPage() {
    if (this.users.page * this.users.limit < this.users.total) {
      this.loadUsers({ page: this.users.page + 1 });
    }
  }

  // Navegar a la página anterior
  previousPage() {
    if (this.users.page > 1) {
      this.loadUsers({ page: this.users.page - 1 });
    }
  }

  // Buscar usuarios por término
  searchUsers(searchTerm: string) {
    this.loadUsers({ search: searchTerm, page: 1 });
  }

  // Filtrar usuarios por estado activo/inactivo
  filterByStatus(active: boolean) {
    this.loadUsers({ active: active.toString(), page: 1 });
  }
}