// sistema-ventas-frontend/src/app/modules/users/modal-user/modal-user.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DynamicFormComponent } from '../../../project/components/dynamic-form/dynamic-form.component';
import { FormGroup } from '@angular/forms';
import { userFormFields } from './schema-user';
import { UsersService } from '../users.service';
import { ToasterService } from '../../../project/services/toaster.service';

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
  public saving = false;
  
  onFormCreated = (form: FormGroup) => {
    this.formReference = form;
  };
  
  initialData = this.dynamicDialogConfig.data?.data;
  catalogs: any = {};
  public view = false;

  constructor(
    public ref: DynamicDialogRef,
    private usersService: UsersService,
    private toaster: ToasterService
  ) {}

  async ngOnInit() {
    try {
      // Obtener catálogos necesarios
      const roles: any = await this.usersService.getRoles();
      this.catalogs.role = roles.map((res: any) => ({
        label: res.nombre_rol,
        value: res.id_rol,
      }));

      this.view = true;
    } catch (error) {
      this.toaster.showToast({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los roles'
      });
      this.close();
    }
  }

  usersFormFields(catalogs: any): any[] {
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
  if (this.formData?.valid && !this.saving) {
    this.saving = true;
    
    try {
      const formData = { ...this.formData.data };
      
      // Si es edición y no se cambió la contraseña, eliminar el campo
      if (this.initialData && (!formData.password || formData.password === '')) {
        delete formData.password;
      }

      // Convertir teléfono a string si existe
      if (formData.telefono !== undefined && formData.telefono !== null) {
        formData.telefono = String(formData.telefono);
        
        // Limpiar el teléfono (remover caracteres no numéricos excepto +)
        formData.telefono = formData.telefono.replace(/[^0-9+]/g, '');
        
        // Si está vacío después de limpiar, establecer como null
        if (formData.telefono === '') {
          formData.telefono = null;
        }
      } else {
        formData.telefono = null;
      }

      console.log('Datos a enviar:', formData);

      if (this.initialData?.id_usuario) {
        await this.usersService.updateUsers(this.initialData.id_usuario, formData);
        this.toaster.showToast({
          severity: 'success',
          summary: 'Actualizado',
          detail: 'Usuario actualizado correctamente',
        });
      } else {
        await this.usersService.createUsers(formData);
        this.toaster.showToast({
          severity: 'success',
          summary: 'Creado',
          detail: 'Usuario creado correctamente',
        });
      }
      
      this.ref.close(true);
    } catch (error: any) {
      console.error('Error saving user:', error);
      const detail = error.error?.message || 'Ocurrió un error al guardar';
      
      this.toaster.showToast({
        severity: 'error',
        summary: 'Error',
        detail: detail,
      });
    } finally {
      this.saving = false;
    }
  }
}

  close() {
    if (!this.saving) {
      this.ref.close();
    }
  }
}