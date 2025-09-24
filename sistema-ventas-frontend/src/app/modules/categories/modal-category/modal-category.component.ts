// sistema-ventas-frontend/src/app/modules/categories/modal-category/modal-category.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CategoriesService } from '../categories.service';
import { ToasterService } from '../../../project/services/toaster.service';
import { ApiService } from '../../../project/services/api.service';
import { categoryFormFields } from './schema-category';
import { DynamicFormComponent } from '../../../project/components/dynamic-form/dynamic-form.component';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-modal-category',
  imports: [CommonModule, DynamicFormComponent],
  templateUrl: './modal-category.component.html',
  styleUrl: './modal-category.component.scss'
})
export class ModalCategoryComponent implements OnInit {
  dynamicDialogConfig = inject(DynamicDialogConfig);
  formReference!: FormGroup;
  public formData: any;
  onFormCreated = (form: FormGroup) => {
    this.formReference = form;
  };
  initiaData = this.dynamicDialogConfig.data?.data;
  catalogs: any = {};
  public view = false;
  
  constructor(
    public ref: DynamicDialogRef,
    private categoriesService: CategoriesService,
    private toaster: ToasterService,
    private apiService: ApiService
  ) { }

  async ngOnInit() {
    this.catalogs.CRISTAL = [];
    this.view = true;
    
    // Preparar datos iniciales para el campo activo
    if (this.initiaData) {
      this.initiaData = {
        ...this.initiaData,
        activo: String(this.initiaData.activo), // Convertir a string para el select
        icono_url: this.initiaData.icono_url ? `${environment.backend_file}${this.initiaData.icono_url}` : ''
      };
    }
  }

  PatientsFormFields(catalogs: any): any[] {
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
  }

  async save() {
    if (this.formData?.valid) {
      try {
        const formData = {...this.formData.data};
        
        // Convertir activo de string a booleano para el backend
        if (typeof formData.activo === 'string') {
          formData.activo = formData.activo === 'true';
        }
        
        // El resto del código igual que antes para el icono
        if (formData.icono_url instanceof File) {
          const uploadFormData = new FormData();
          uploadFormData.append('file', formData.icono_url);
          const uploadResponse: any = await this.apiService.postDms(uploadFormData);
          formData.icono_url = uploadResponse.url || uploadResponse.path || '';
        } else if (this.initiaData?.icono_url) {
          formData.icono_url = this.initiaData.icono_url.replace(environment.backend_file, '');
        }
        
        if (this.initiaData?.id_categoria) {
          await this.categoriesService.updateCategory(
            this.initiaData.id_categoria,
            formData
          );
          this.toaster.showToast({
            severity: 'success',
            summary: 'Actualizado',
            detail: 'Categoría actualizada correctamente'
          });
        } else {
          await this.categoriesService.createCategory(formData);
          this.toaster.showToast({
            severity: 'success',
            summary: 'Creado',
            detail: 'Categoría creada correctamente'
          });
        }

        this.ref.close(true);
      } catch (error) {
        this.toaster.showToast({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al guardar la categoría'
        });
      }
    }
  }

  close() {
    this.ref.close();
  }
}