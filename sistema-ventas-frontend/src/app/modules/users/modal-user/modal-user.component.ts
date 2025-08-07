// sistema-ventas-frontend/src/app/modules/users/modal-user/modal-user.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DynamicFormComponent } from '../../../project/components/dynamic-form/dynamic-form.component';
import { FormGroup } from '@angular/forms';
import { userFormFields } from './schema-user';
import { UsersService } from '../users.service';
import { ToasterService } from '../../../project/services/toaster.service';
import { ApiService } from '../../../project/services/api.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-modal-user',
  standalone: true,
  imports: [CommonModule, DynamicFormComponent],
  templateUrl: './modal-user.component.html',
  styleUrls: ['./modal-user.component.scss']
})
export class ModalUserComponent implements OnInit {
  dynamicDialogConfig = inject(DynamicDialogConfig);
  formReference!: FormGroup;
  public formData: any;
  onFormCreated = (form: FormGroup) => {
    this.formReference = form;
  };
  initialData = this.dynamicDialogConfig.data?.data;
  catalogs: any = {};
  public view = false;

  constructor(
    public ref: DynamicDialogRef,
    private usersService: UsersService,
    private toaster: ToasterService,
    private apiService: ApiService
  ) {}

  async ngOnInit() {
    if (this.initialData) {
      // Prepara datos iniciales si es edición
      console.log("initialData", this.initialData);
    }

    // Obtener catálogos necesarios
    const roles: any = await this.usersService.getRoles();
    this.catalogs.role = roles.map((res: any) => ({
      label: res.nombre_rol,
      value: res.id_rol,
    }));

    console.log("catalogs", this.catalogs);
    this.view = true;
  }

  UsersFormFields(catalogs: any): any[] {
    return userFormFields(catalogs);
  }

  handleFormChange(event: {
    data: any;
    valid: boolean;
    touched: boolean;
    dirty: boolean;
    complete: boolean;
  }) {
    this.formData = event;
  }

  async save() {
    if (this.formData?.valid) {
      try {
        if (this.initialData?.id_usuario) {
          // Actualizar usuario
          const response = await this.usersService.updateUsers(
            this.initialData.id_usuario,
            this.formData.data
          );
          this.toaster.showToast({
            severity: 'success',
            summary: 'Actualizado',
            detail: 'Usuario actualizado correctamente',
          });
        } else {
          // Crear nuevo usuario
          const response = await this.usersService.createUsers(this.formData.data);
          this.toaster.showToast({
            severity: 'success',
            summary: 'Creado',
            detail: 'Usuario creado correctamente',
          });
        }
        this.ref.close(true);
      } catch (error) {
        this.toaster.showToast({
          severity: 'error',
          summary: 'Error',
          detail: 'Ocurrió un error al guardar',
        });
      }
    } else {
      this.toaster.showToast({
        severity: 'warning',
        summary: 'Validación',
        detail: 'Por favor complete todos los campos requeridos',
      });
    }
  }

  close() {
    this.ref.close();
  }
  
}