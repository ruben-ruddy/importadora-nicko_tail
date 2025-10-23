// sistema-ventas-frontend/src/app/modules/users/modal-user/modal-user.component.ts
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { DynamicFormComponent } from '../../../project/components/dynamic-form/dynamic-form.component';
import { FormGroup } from '@angular/forms';
import { userFormFields } from './schema-user';
import { UsersService } from '../users.service';
import { ToasterService } from '../../../project/services/toaster.service';
import { ModalService } from '../../../project/services/modal.service';

@Component({
  selector: 'app-modal-user',
  standalone: true,
  imports: [CommonModule, DynamicFormComponent],
  templateUrl: './modal-user.component.html',
  styleUrls: ['./modal-user.component.scss']
})
export class ModalUserComponent implements OnInit, OnDestroy {
  @Input() modalData: any = {};
  @Input() modalConfig: any = {};

  formReference!: FormGroup;
  public formData: any;
  public saving = false;
  
  onFormCreated = (form: FormGroup) => {
    this.formReference = form;
  };
  
  initialData: any = {};
  catalogs: any = {};
  public view = false;
  isEditing: boolean = false;

  constructor(
    private usersService: UsersService,
    private toaster: ToasterService,
    private modalService: ModalService
  ) {}

  async ngOnInit() {
    console.log('ModalUserComponent - modalData:', this.modalData);
    console.log('ModalUserComponent - modalConfig:', this.modalConfig);
    
    try {
      // Determinar initialData correctamente
      if (this.modalData?.data) {
        this.initialData = { ...this.modalData.data };
        this.isEditing = !!this.modalData.data.id_usuario;
      } else if (this.modalData?.id_usuario) {
        this.initialData = { ...this.modalData };
        this.isEditing = true;
      } else {
        this.initialData = {};
        this.isEditing = false;
      }

      console.log('ModalUserComponent - initialData:', this.initialData);
      console.log('ModalUserComponent - isEditing:', this.isEditing);

      // Obtener catálogos necesarios
      const roles: any = await this.usersService.getRoles();
      this.catalogs.role = roles.map((res: any) => ({
        label: res.nombre_rol,
        value: res.id_rol, // Mantener como UUID string
      }));

      console.log('Roles cargados:', this.catalogs.role);

      // Preparar datos para el formulario
      if (this.isEditing) {
        // Para edición, asegurar que los campos tengan los valores correctos
        this.initialData = {
          ...this.initialData,
          id_rol: this.initialData.id_rol || this.initialData.role?.id_rol || '',
          password: '', // Vacío para no mostrar la contraseña actual
          telefono: this.initialData.telefono || ''
        };
      } else {
        // Para nuevo usuario, valores por defecto
        this.initialData = {
          password: '',
          telefono: ''
        };
      }

      console.log('Datos iniciales preparados:', this.initialData);
      this.view = true;
    } catch (error) {
      console.error('Error loading roles:', error);
      this.toaster.showToast({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los roles'
      });
      this.close();
    }
  }

  ngOnDestroy() {
    console.log('ModalUserComponent - Destroyed');
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
    console.log('Form changed - valid:', this.formData?.valid, 'data:', this.formData?.data);
  }

  async save() {
    console.log('Save called - form valid:', this.formData?.valid);
    console.log('Current form data:', this.formData?.data);
    
    if (this.formData?.valid && !this.saving) {
      this.saving = true;
      
      try {
        let formData = { ...this.formData.data };
        
        console.log('Datos del formulario antes de procesar:', formData);

        // CORRECCIÓN: Limpiar y validar los datos antes de enviar
        formData = this.prepareDataForBackend(formData);
        
        console.log('Datos preparados para enviar:', formData);

        if (this.isEditing) {
          console.log('Actualizando usuario:', this.initialData.id_usuario);
          await this.usersService.updateUsers(this.initialData.id_usuario, formData);
          this.toaster.showToast({
            severity: 'success',
            summary: 'Actualizado',
            detail: 'Usuario actualizado correctamente',
          });
        } else {
          console.log('Creando nuevo usuario');
          await this.usersService.createUsers(formData);
          this.toaster.showToast({
            severity: 'success',
            summary: 'Creado',
            detail: 'Usuario creado correctamente',
          });
        }
        
        this.modalService.close(true);
      } catch (error: any) {
        console.error('Error saving user:', error);
        
        // MEJOR DEBUGGING: Mostrar detalles completos del error
        let errorDetail = 'Ocurrió un error al guardar';
        
        if (error.error) {
          console.log('Error response details:', error.error);
          
          if (typeof error.error === 'string') {
            errorDetail = error.error;
          } else if (error.error.message) {
            errorDetail = error.error.message;
          } else if (error.error.error) {
            errorDetail = error.error.error;
          } else if (error.status === 400) {
            errorDetail = 'Datos inválidos. Verifique la información ingresada.';
            
            // Mostrar errores de validación específicos si existen
            if (error.error.errors) {
              const validationErrors = Object.values(error.error.errors).join(', ');
              errorDetail += ` Errores: ${validationErrors}`;
            }
          }
        }
        
        this.toaster.showToast({
          severity: 'error',
          summary: 'Error',
          detail: errorDetail,
        });
      } finally {
        this.saving = false;
      }
    } else {
      console.log('Formulario inválido o guardando en progreso');
      console.log('Form valid:', this.formData?.valid);
      console.log('Saving:', this.saving);
      
      if (this.formReference) {
        this.formReference.markAllAsTouched();
      }
      
      if (!this.formData?.valid) {
        this.toaster.showToast({
          severity: 'error',
          summary: 'Error',
          detail: 'Por favor complete todos los campos requeridos correctamente'
        });
      }
    }
  }

  private prepareDataForBackend(formData: any): any {
    const preparedData: any = {};
    
    // CORRECCIÓN: id_rol debe mantenerse como UUID string, NO convertirlo a número
    if (formData.id_rol) {
      preparedData.id_rol = formData.id_rol; // Mantener como string
    }
    
    if (formData.nombre_usuario) {
      preparedData.nombre_usuario = formData.nombre_usuario.trim();
    }
    
    if (formData.email) {
      preparedData.email = formData.email.trim().toLowerCase();
    }
    
    if (formData.nombre_completo) {
      preparedData.nombre_completo = formData.nombre_completo.trim();
    }
    
    // Campo condicional: contraseña
    if (this.isEditing) {
      // Solo incluir password si se proporcionó uno nuevo
      if (formData.password && formData.password.trim() !== '') {
        preparedData.password = formData.password.trim();
      }
    } else {
      // Para nuevo usuario, password es requerido
      if (formData.password) {
        preparedData.password = formData.password.trim();
      }
    }
    
    // Campo opcional: teléfono
    if (formData.telefono && formData.telefono.toString().trim() !== '') {
      let telefono = formData.telefono.toString().trim();
      // Limpiar teléfono (solo números y +)
      telefono = telefono.replace(/[^0-9+]/g, '');
      preparedData.telefono = telefono || null;
    } else {
      preparedData.telefono = null;
    }
    
    console.log('Datos finales preparados para backend:', preparedData);
    return preparedData;
  }

  close() {
    if (!this.saving) {
      this.modalService.close(false);
    }
  }
}