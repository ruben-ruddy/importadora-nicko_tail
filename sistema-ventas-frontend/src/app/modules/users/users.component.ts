// sistema-ventas-frontend/src/app/modules/users/users.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersService } from './users.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { GeneralService } from '../../core/gerneral.service';
import { ModalUserComponent } from './modal-user/modal-user.component';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ConfirmDialogModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  providers: [DialogService, ConfirmationService, MessageService],
})
export class UsersComponent {
  Math = Math;
  users: any = { users: [], total: 0, page: 1, limit: 10 };
  ref!: DynamicDialogRef;
  currentQuery: any = {};

  constructor(
    private usersService: UsersService,
    private dialogService: DialogService,
    private generalService: GeneralService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.generalService.show();
    this.loadUsers();
  }

  async loadUsers(query: any = {}) {
    try {
      this.currentQuery = { ...this.currentQuery, ...query };
      this.users = await this.usersService.getUsers(this.currentQuery);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los usuarios'
      });
    } finally {
      this.generalService.hide();
    }
  }

  openAddUserModal() {
    this.ref = this.dialogService.open(ModalUserComponent, {
      //header: 'Nuevo Usuario',
      width: '800px',
      styleClass: 'dynamic-dialog'
    });

    this.ref.onClose.subscribe((reload: boolean) => {
      if (reload) this.loadUsers();
    });
  }

  openEditUserModal(user: any) {
    this.ref = this.dialogService.open(ModalUserComponent, {
     // header: 'Editar Usuario',
      width: '800px',
      styleClass: 'dynamic-dialog',
      data: { data: user }
    });

    this.ref.onClose.subscribe((reload: boolean) => {
      if (reload) this.loadUsers();
    });
  }

confirmDelete(user: any) {
  const confirmMessage = `¿Está seguro de eliminar al usuario "${user.nombre_completo}"?\nEsta acción no se puede deshacer.`;
  
  if (confirm(confirmMessage)) {
    this.deleteUser(user.id_usuario);
  } else {
    console.log('Eliminación cancelada por el usuario');
  }
}

async deleteUser(userId: string) {
    //this.generalService.show('Eliminando usuario...');
  try {

    await this.usersService.deleteUser(userId);
    
    this.generalService.hide();
    // Mensaje simple de éxito
    alert('✅ Usuario eliminado correctamente');
    
    // Recargar la lista de usuarios
    this.loadUsers();
    
  } catch (error: any) {
     this.generalService.hide();
    console.error('Error eliminando usuario:', error);
    
    let errorMessage = '❌ No se pudo eliminar el usuario';
    
    if (error.status === 409) {
      errorMessage = '❌ No se puede eliminar el usuario porque tiene registros asociados (ventas, compras, etc.)';
    } else if (error.status === 404) {
      errorMessage = '❌ Usuario no encontrado';
    } else if (error.status === 403) {
      errorMessage = '❌ No tiene permisos para eliminar usuarios';
    } else if (error.status === 401) {
      errorMessage = '❌ Sesión expirada. Por favor, inicie sesión nuevamente';
    }
    
    alert(errorMessage);
  } finally {
    this.generalService.hide();
  }
}

  nextPage() {
    if (this.users.page * this.users.limit < this.users.total) {
      this.loadUsers({ page: this.users.page + 1 });
    }
  }

  previousPage() {
    if (this.users.page > 1) {
      this.loadUsers({ page: this.users.page - 1 });
    }
  }

  searchUsers(searchTerm: string) {
    this.loadUsers({ search: searchTerm, page: 1 });
  }

  filterByStatus(active: boolean) {
    this.loadUsers({ active: active.toString(), page: 1 });
  }
}