// sistema-ventas-frontend/src/app/modules/product/modal-product/modal-product.component.ts
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { DynamicFormComponent } from '../../../project/components/dynamic-form/dynamic-form.component';
import { FormGroup } from '@angular/forms';
import { ProductService } from '../product.service';
import { ToasterService } from '../../../project/services/toaster.service';
import { ApiService } from '../../../project/services/api.service';
import { environment } from '../../../../environments/environment';
import { productFormFields } from './schema';
import { ModalService } from '../../../project/services/modal.service';

@Component({
  selector: 'app-modal-product',
  imports: [CommonModule, DynamicFormComponent],
  templateUrl: './modal-product.component.html',
  styleUrl: './modal-product.component.scss'
})
export class ModalProductComponent implements OnInit, OnChanges {
  @Input() modalData: any = {};
  @Input() modalConfig: any = {};

  formReference!: FormGroup;
  public formData: any;
  onFormCreated = (form: FormGroup) => {
    this.formReference = form;
  };
  
  private _initiaData: any;
  get initiaData(): any {
    return this._initiaData;
  }
  @Input() 
  set initiaData(value: any) {
    this._initiaData = value;
    this.processInitialData();
  }
  
  // Catálogos para los campos del formulario
  catalogs: any = {};
  public view = false;
  public categoriesLoaded = false;
  public formFields: any[] = []; 

  constructor(
    private productService: ProductService,
    private toaster: ToasterService,
    private apiService: ApiService,
    private modalService: ModalService
  ) { }

  // Detectar cambios en las entradas
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['modalData'] && changes['modalData'].currentValue) {
      this.processModalData(changes['modalData'].currentValue);
    }
  }

  // Ciclo de vida del componente
  ngOnInit(): void {
    this.loadCategories();
    this.processModalData(this.modalData);
  }

  // Procesar datos del modal
  private processModalData(modalData: any): void {
    if (modalData?.data) {
      this._initiaData = this.processProductData(modalData.data);
      console.log('Datos iniciales procesados:', this._initiaData);
    }
  }

  // Procesar datos iniciales
  private processInitialData(): void {
    if (this._initiaData) {
      this._initiaData = this.processProductData(this._initiaData);
    }
  }

  // Procesar datos del producto
private processProductData(productData: any): any {
  if (!productData) return null;
  
  let id_categoria = productData.id_categoria;  
  return {
    ...productData,
    activo: Boolean(productData.activo),
    imagen_url: productData.imagen_url ? `${environment.backend_file}${productData.imagen_url}` : '',
    id_categoria: id_categoria 
  };
}

// Cargar categorías para el formulario
async loadCategories() {
  try {

    const categories: any = await this.productService.getCategories();

    this.catalogs.category = categories.map((res: any) => ({
      label: res.nombre_categoria,
      value: res.id_categoria, 
    }));
    
    if (this._initiaData && this._initiaData.id_categoria) {

      const matchingCategory = categories.find((cat: any) => 
        cat.id_categoria === this._initiaData.id_categoria
      );
      
      if (matchingCategory) {

      } else {
        //console.warn('⚠️ No se encontró categoría para el UUID:', this._initiaData.id_categoria);
      }
    }
    
    // Generar los formFields después de cargar las categorías
    this.formFields = this.ProductsFormFields(this.catalogs);
    console.log('FormFields generados:', this.formFields);
    
    this.categoriesLoaded = true;
    this.view = true;
  } catch (error) {
    console.error('Error loading categories:', error);
    this.catalogs.category = [];
    this.formFields = this.ProductsFormFields(this.catalogs);
    this.categoriesLoaded = true;
    this.view = true;
  }
}

// Generar los campos del formulario
  ProductsFormFields(catalogs: any): any[] {
    console.log('Generando formulario con catálogos:', catalogs);
    console.log('Datos iniciales para formulario:', this.initiaData);
    return productFormFields(catalogs);
  }

  // Manejar cambios en el formulario
  handleFormChange(event: {
    data: any;
    valid: boolean;
    touched: boolean;
    dirty: boolean;
    complete: boolean;
  }) {
    this.formData = event;
  }

  // Guardar el producto (crear o actualizar)
  async save() {
    if (this.formData?.valid) {
      try {
        const formData = {...this.formData.data};
        
        console.log("Datos del formulario a guardar:", formData);
        
        // Convertir valores numéricos
        if (formData.precio_venta) formData.precio_venta = Number(formData.precio_venta);
        if (formData.precio_compra) formData.precio_compra = Number(formData.precio_compra);
        if (formData.stock_actual) formData.stock_actual = Number(formData.stock_actual);
        if (formData.stock_minimo) formData.stock_minimo = Number(formData.stock_minimo);
        
        // Asegurar que activo sea booleano
        if (typeof formData.activo === 'string') {
          formData.activo = formData.activo === 'true';
        }
        formData.activo = Boolean(formData.activo);
        
        console.log("Estado activo procesado:", formData.activo, typeof formData.activo);

        // Manejar imagen
        if (formData.imagen_url instanceof File) {
          console.log("Subiendo nueva imagen...");
          const uploadFormData = new FormData();
          uploadFormData.append('file', formData.imagen_url);
          const uploadResponse: any = await this.apiService.postDms(uploadFormData);
          formData.imagen_url = uploadResponse.url || uploadResponse.path || '';
          console.log("Imagen subida:", formData.imagen_url);
        } else if (this.initiaData?.imagen_url && formData.imagen_url === this.initiaData.imagen_url) {
          formData.imagen_url = this.initiaData.imagen_url.replace(environment.backend_file, '');
          console.log("Imagen existente procesada:", formData.imagen_url);
        }

        if (this.initiaData?.id_producto) {
          console.log("Actualizando producto:", this.initiaData.id_producto, formData);
          await this.productService.updateProducts(
            this.initiaData.id_producto,
            formData
          );
          this.toaster.showToast({
            severity: 'success',
            summary: 'Actualizado',
            detail: 'Producto actualizado correctamente'
          });
        } else {
          console.log("Creando nuevo producto:", formData);
          await this.productService.createProducts(formData);
          this.toaster.showToast({
            severity: 'success',
            summary: 'Creado',
            detail: 'Producto creado correctamente'
          });
        }

        this.modalService.close(true);
      } catch (error) {
        console.error('Error al guardar:', error);
        this.toaster.showToast({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al guardar el producto'
        });
      }
    } else {
      console.log("Formulario no válido", this.formData);
      this.toaster.showToast({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor complete todos los campos requeridos'
      });
    }
  }

  // Cerrar el modal
  close() {
    this.modalService.close();
  }
}