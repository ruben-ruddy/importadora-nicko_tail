// sistema-ventas-frontend/src/app/modules/product/modal-product/modal-product.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DynamicFormComponent } from '../../../project/components/dynamic-form/dynamic-form.component';
import { FormGroup } from '@angular/forms';
import { productFormFields } from './schema';
import { ProductService } from '../product.service';
import { ToasterService } from '../../../project/services/toaster.service';
import { ApiService } from '../../../project/services/api.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-modal-product',
  imports: [CommonModule, DynamicFormComponent],
  standalone: true,
  templateUrl: './modal-product.component.html',
  styleUrl: './modal-product.component.scss',
})
export class ModalProductComponent implements OnInit {
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
    private productService: ProductService,
    private toaster: ToasterService,
    private apiService: ApiService
  ) { }

  async ngOnInit() {
    if (this.initiaData) {
      console.log("initiaData", this.initiaData);
      // Asegurar que el campo activo sea booleano
      this.initiaData.activo = Boolean(this.initiaData.activo);
      
      // Solo procesar la URL de imagen si existe
      if (this.initiaData.imagen_url) {
        this.initiaData.imagen_url = `${environment.backend_file}${this.initiaData.imagen_url}`;
      }
    }

    const category: any = await this.productService.getCategories();
    this.catalogs.category = category.map((res: any) => ({
      label: res.nombre_categoria,
      value: res.id_categoria,
    }));
    
    this.view = true;
  }

  PatientsFormFields(catalogs: any): any[] {
    return productFormFields(catalogs);
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
    console.log("Datos del formulario:", this.formData.data);
    
    // Convertir valores numéricos
    this.formData.data.precio_compra = parseFloat(this.formData.data.precio_compra);
    this.formData.data.precio_venta = parseFloat(this.formData.data.precio_venta);
    this.formData.data.stock_actual = parseInt(this.formData.data.stock_actual);
    this.formData.data.stock_minimo = parseInt(this.formData.data.stock_minimo);
    
    // Convertir activo a booleano (puede venir como string "true"/"false")
    if (typeof this.formData.data.activo === 'string') {
      this.formData.data.activo = this.formData.data.activo === 'true';
    }
    this.formData.data.activo = Boolean(this.formData.data.activo);
    
    console.log("Estado activo:", this.formData.data.activo, typeof this.formData.data.activo);

    if (this.initiaData?.id_producto) {
      // Si hay una nueva imagen, guardarla
      if (typeof this.formData.data.imagen_url === 'object') {
        const file = await this.saveFile(this.formData.data.imagen_url);
        this.formData.data.imagen_url = file.url;
      } else if (this.formData.data.imagen_url && this.formData.data.imagen_url.startsWith(environment.backend_file)) {
        // Si es una URL existente, quitar el prefijo para guardar solo la ruta relativa
        this.formData.data.imagen_url = this.formData.data.imagen_url.replace(environment.backend_file, '');
      }
      
      console.log("Datos a actualizar:", this.formData.data);
      this.productService.updateProducts(this.initiaData.id_producto, this.formData.data).then(res => {
        this.toaster.showToast({
          severity: 'success',
          summary: 'Actualizado',
          detail: 'Producto actualizado correctamente',
        });
        this.ref.close(res);
      }).catch(error => {
        console.error("Error al actualizar:", error);
        this.toaster.showToast({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el producto',
        });
      });
    } else {
      const file = await this.saveFile(this.formData.data.imagen_url);
      this.formData.data.imagen_url = file.url;
      
      this.productService.createProducts(this.formData.data).then(res => {
        this.toaster.showToast({
          severity: 'success',
          summary: 'Guardado',
          detail: 'Producto creado correctamente',
        });
        this.ref.close(res);
      }).catch(error => {
        console.error("Error al crear:", error);
        this.toaster.showToast({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear el producto',
        });
      });
    }
  } else {
    console.log("Formulario no válido");
    this.toaster.showToast({
      severity: 'error',
      summary: 'Error',
      detail: 'Por favor complete todos los campos requeridos',
    });
  }
}
  async saveFile(file: any) {
    if (typeof file == 'object') {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'documento');
      formData.append('user', 'user1');
      const r: any = await this.apiService.postDms(formData);
      return r;
    } else {
      return { url: file };
    }
  }

  close() {
    this.ref.close();
  }
}