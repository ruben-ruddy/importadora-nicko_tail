// sistema-ventas-frontend/src/app/modules/categories/modal-category/modal-category.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CategoriesService } from '../categories.service';
import { ToasterService } from '../../../project/services/toaster.service';
import { ApiService } from '../../../project/services/api.service';
import { categoryFormFields } from './schema-category';
import { DynamicFormComponent } from '../../../project/components/dynamic-form/dynamic-form.component';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { ModalService } from '../../../project/services/modal.service';

@Component({
  selector: 'app-modal-category',
  standalone: true,
  imports: [CommonModule, DynamicFormComponent],
  templateUrl: './modal-category.component.html',
  styleUrl: './modal-category.component.scss'
})
export class ModalCategoryComponent implements OnInit, OnDestroy {
  @Input() modalData: any = {};
  @Input() modalConfig: any = {};

  formReference!: FormGroup;
  public formData: any;
  
  onFormCreated = (form: FormGroup) => {
    this.formReference = form;
  };
  
  initialData: any = {};
  catalogs: any = {};
  public view = false;
  isEditing: boolean = false;
  
  constructor(
    private modalService: ModalService,
    private categoriesService: CategoriesService,
    private toaster: ToasterService,
    private apiService: ApiService
  ) { }

  async ngOnInit() {
    console.log('Modal Category Init - modalData:', this.modalData);
    console.log('Modal Category Init - modalConfig:', this.modalConfig);
    
    this.catalogs.CRISTAL = [];
    this.view = true;
    
    // Determinar si estamos editando o creando
    this.isEditing = !!this.modalData?.data?.id_categoria;
    
    // Preparar datos iniciales
    if (this.isEditing) {
      this.initialData = {
        ...this.modalData.data,
        activo: String(this.modalData.data.activo), // Convertir a string para el select
        icono_url: this.modalData.data.icono_url ? 
          `${environment.backend_file}${this.modalData.data.icono_url}` : ''
      };
      console.log('Editing category - initialData:', this.initialData);
    } else {
      // Nueva categoría - valores por defecto
      this.initialData = {
        activo: 'true',
        nombre_categoria: '',
        descripcion: '',
        icono_url: null
      };
      console.log('New category - initialData:', this.initialData);
    }
  }

  ngOnDestroy() {
    console.log('Modal Category Destroyed');
  }

  categoryFormFields(catalogs: any): any[] {
    return categoryFormFields(catalogs);
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
    
    if (this.formData?.valid) {
      try {
        const formData = {...this.formData.data};
        console.log('Form data to save:', formData);
        
        // Convertir activo de string a booleano para el backend
        if (typeof formData.activo === 'string') {
          formData.activo = formData.activo === 'true';
          console.log('Converted activo from string to boolean:', formData.activo);
        }
        
        // Manejar la imagen
        if (formData.icono_url instanceof File) {
          console.log('Uploading new image...');
          const uploadFormData = new FormData();
          uploadFormData.append('file', formData.icono_url);
          const uploadResponse: any = await this.apiService.postDms(uploadFormData);
          formData.icono_url = uploadResponse.url || uploadResponse.path || '';
          console.log('Image uploaded:', formData.icono_url);
        } else if (this.initialData?.icono_url && typeof formData.icono_url === 'string') {
          // Si es una URL existente, quitar el prefijo del backend
          formData.icono_url = formData.icono_url.replace(environment.backend_file, '');
          console.log('Using existing image:', formData.icono_url);
        }
        
        if (this.isEditing) {
          console.log('Updating category:', this.initialData.id_categoria);
          await this.categoriesService.updateCategory(
            this.initialData.id_categoria,
            formData
          );
          this.toaster.showToast({
            severity: 'success',
            summary: 'Actualizado',
            detail: 'Categoría actualizada correctamente'
          });
        } else {
          console.log('Creating new category');
          await this.categoriesService.createCategory(formData);
          this.toaster.showToast({
            severity: 'success',
            summary: 'Creado',
            detail: 'Categoría creada correctamente'
          });
        }

        console.log('Category saved successfully, closing modal...');
        this.modalService.close(true); // Pasar true para indicar éxito
      } catch (error) {
        console.error('Error saving category:', error);
        this.toaster.showToast({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al guardar la categoría'
        });
      }
    } else {
      console.log('Form is invalid, showing errors');
      // Marcar todos los campos como touched para mostrar errores
      if (this.formReference) {
        this.formReference.markAllAsTouched();
      }
      this.toaster.showToast({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor complete todos los campos requeridos correctamente'
      });
    }
  }

  close() {
    console.log('Modal closed without saving');
    this.modalService.close(false); // Pasar false para indicar cancelación
  }
}