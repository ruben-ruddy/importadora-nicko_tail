// sistema-ventas-frontend/src/app/modules/users/users.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { UsersService } from './users.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { GeneralService } from '../../core/gerneral.service';
import { ModalUserComponent } from './modal-user/modal-user.component';


@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  providers: [DialogService],
})
export class UsersComponent {
  users: any;
  ref!: DynamicDialogRef;

  constructor(
    private usersService: UsersService,
    private dialogService: DialogService,
    private generalService: GeneralService
  ) {}

  ngOnInit(): void {
    this.generalService.show();
    this.loadUsers();
  }

  async loadUsers() {
    this.users = await this.usersService.getUsers();
    this.generalService.hide();
  }

  openAddUserModal() {
    this.ref = this.dialogService.open(ModalUserComponent, {
      //header: 'Nuevo usuario',
     width: '800px',
      //closable: true,
    });

    this.ref.onClose.subscribe(() => {
      this.loadUsers();
    });
  }

  openEditUserModal(users: any) {
    this.ref = this.dialogService.open(ModalUserComponent, {
      data: { data: users },
      //header: 'Actualizar usuario',
      width: '800px',
      //closable: true,
    });

    this.ref.onClose.subscribe(() => {
      this.loadUsers();
    });
  }
}