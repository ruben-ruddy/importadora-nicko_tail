// sistema-ventas-frontend/src/app/modules/purchase/modal-purchase/modal-purchase.component.ts
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { DynamicFormComponent } from '../../../project/components/dynamic-form/dynamic-form.component';
import { FormArray, FormGroup, Validators, FormBuilder } from '@angular/forms';
import { purchaseFormFields } from './schema';
import { PurchaseService } from '../purchase.service';
import { ToasterService } from '../../../project/services/toaster.service';
import { Purchase, PurchaseDetail } from '../../../interfaces/purchase.interface';

// Servicio de modales
import { ModalService } from '../../../project/services/modal.service';

@Component({
  selector: 'app-modal-purchase',
  imports: [CommonModule, DynamicFormComponent],
  standalone: true,
  templateUrl: './modal-purchase.component.html',
  styleUrl: './modal-purchase.component.scss',
})
export class ModalPurchaseComponent implements OnInit {
  @Input() modalData: any = {};
  @Input() modalConfig: any = {};

  formReference!: FormGroup;
  public formData: any;
  onFormCreated = (form: FormGroup) => {
    this.formReference = form;
    console.log('✅ Formulario creado:', form);
  };
  
  // Inicializar con valores por defecto según la interface
  initialData: Purchase = {
    id_usuario: '',
    numero_compra: '',
    total: 0,
    estado: 'pendiente',
    observaciones: '',
    detalle_compras: []
  };
  
  catalogs: any = {
    users: [],
    products: []
  };
  public view = false;
  currentUser: any = null;
  loading = true;

  constructor(
    private purchaseService: PurchaseService,
    private toaster: ToasterService,
    private fb: FormBuilder,
    private modalService: ModalService
  ) { }

  async ngOnInit() {
    try {
      console.log('🔄 Iniciando modal de compra...');
      
      // Obtener usuario actual del config
      this.currentUser = this.modalData?.currentUser;
      
      // Si hay datos iniciales, mezclarlos con los valores por defecto
      if (this.modalData?.data) {
        this.initialData = {
          ...this.initialData,
          ...this.modalData.data
        };
        console.log('📦 Datos iniciales recibidos:', this.initialData);
      }

      // Si hay usuario logeado y es una nueva compra, asignarlo automáticamente
      if (this.currentUser && !this.initialData.id_compra) {
        this.initialData.id_usuario = this.currentUser.id_usuario;
        console.log('👤 Usuario asignado automáticamente:', this.currentUser.id_usuario);
      }

      // Cargar catálogos necesarios
      console.log('📥 Cargando catálogos...');
      const [usersArray, productsArray] = await Promise.all([
        this.purchaseService.getUsers(),
        this.purchaseService.getProducts()
      ]);

      console.log('✅ Users loaded:', usersArray.length);
      console.log('✅ Products loaded:', productsArray.length);

      this.catalogs.users = usersArray.map((user: any) => ({
        label: user.nombre_completo || user.nombre_usuario || 'Usuario sin nombre',
        value: user.id_usuario,
      }));

      this.catalogs.products = productsArray.map((product: any) => ({
        label: `${product.nombre_producto} (Stock: ${product.stock_actual})`,
        value: product.id_producto,
        precio_compra: product.precio_compra,
        stock_actual: product.stock_actual
      }));

      // Si estamos editando, cargar los detalles completos de la compra
      if (this.initialData.id_compra) {
        await this.loadPurchaseDetails();
      } else {
        // Para nueva compra, asegurar que haya al menos un detalle vacío
        this.initialData.detalle_compras = [{
          id_producto: '',
          cantidad: 1,
          precio_unitario: 0,
          subtotal: 0
        }];
      }

      this.view = true;
      this.loading = false;

      console.log('✅ Modal listo para mostrar');

    } catch (error) {
      console.error('❌ Error en inicialización:', error);
      this.toaster.showToast({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los datos del formulario'
      });
      this.loading = false;
    }
  }

  private async loadPurchaseDetails() {
    try {
      console.log('📥 Cargando detalles de compra para edición...');
      const purchaseDetails = await this.purchaseService.getPurchaseById(this.initialData.id_compra!);
      console.log('✅ Detalles cargados:', purchaseDetails);
      
      if (purchaseDetails.detalle_compras && Array.isArray(purchaseDetails.detalle_compras)) {
        this.initialData.detalle_compras = purchaseDetails.detalle_compras.map((detalle: PurchaseDetail) => ({
          id_detalle_compra: detalle.id_detalle_compra,
          id_producto: detalle.id_producto,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          subtotal: detalle.subtotal,
          producto: detalle.producto
        }));
        console.log('✅ Detalles procesados:', this.initialData.detalle_compras.length);
      } else {
        this.initialData.detalle_compras = [];
        console.warn('⚠️ No hay detalles de compra');
      }
      
      // Actualizar otros campos de la compra
      this.initialData = {
        ...this.initialData,
        ...purchaseDetails
      };
      
    } catch (error) {
      console.error('❌ Error loading purchase details:', error);
      this.initialData.detalle_compras = [];
    }
  }

  private setupCalculations() {
    if (!this.formReference) {
      console.warn('⚠️ FormReference no disponible');
      return;
    }

    const detallesArray = this.formReference.get('detalle_compras') as FormArray;
    
    // Suscribirse a cambios en la estructura del array
    detallesArray.valueChanges.subscribe(() => {
      this.setupArraySubscriptions();
      this.calculateTotal();
    });

    // Configurar suscripciones iniciales
    this.setupArraySubscriptions();
    
    console.log('✅ Cálculos configurados');
  }

  private setupArraySubscriptions() {
    if (!this.formReference) return;

    const detallesArray = this.formReference.get('detalle_compras') as FormArray;
    
    // Suscribirse a cambios en cada item del array
    detallesArray.controls.forEach((control, index) => {
      control.get('cantidad')?.valueChanges.subscribe(() => {
        this.calculateSubtotal(index);
      });
      
      control.get('precio_unitario')?.valueChanges.subscribe(() => {
        this.calculateSubtotal(index);
      });
    });
  }

  private calculateAllSubtotals() {
    if (!this.formReference) return;

    const detallesArray = this.formReference.get('detalle_compras') as FormArray;
    detallesArray.controls.forEach((_, index) => {
      this.calculateSubtotal(index);
    });
  }

  private calculateSubtotal(index: number) {
    if (!this.formReference) return;

    const detallesArray = this.formReference.get('detalle_compras') as FormArray;
    
    if (index < 0 || index >= detallesArray.length) return;

    const detalleGroup = detallesArray.at(index);
    const cantidad = Number(detalleGroup.get('cantidad')?.value) || 0;
    const precio = Number(detalleGroup.get('precio_unitario')?.value) || 0;
    const subtotal = cantidad * precio;

    detalleGroup.get('subtotal')?.setValue(subtotal, { emitEvent: false });
    this.calculateTotal();
  }

  private calculateTotal() {
    if (!this.formReference) return;

    const detallesArray = this.formReference.get('detalle_compras') as FormArray;
    const detalles = detallesArray.value || [];
    
    const total = detalles.reduce((sum: number, detalle: any) => {
      const subtotal = Number(detalle.subtotal) || 
                      (Number(detalle.cantidad) || 0) * (Number(detalle.precio_unitario) || 0);
      return sum + subtotal;
    }, 0);

    this.formReference.get('total')?.setValue(total, { emitEvent: false });
  }

  purchaseFormFields(catalogs: any): any[] {
    const fields = purchaseFormFields(catalogs, this.currentUser);
    console.log('📋 Form fields generated - Users:', catalogs.users?.length, 'Products:', catalogs.products?.length);
    return fields;
  }

  handleFormChange(event: {
    data: any;
    valid: boolean;
    touched: boolean;
    dirty: boolean;
    complete: boolean;
  }) {
    console.log('📝 Form changed - Valid:', event.valid);
    this.formData = event;
    
    // Configurar cálculos cuando el formulario esté listo
    if (event.complete && !this.formReference) {
      setTimeout(() => {
        this.setupCalculations();
        this.calculateAllSubtotals();
        this.calculateTotal();
      }, 200);
    }
  }

  async save() {
    if (this.formData?.valid) {
      try {
        console.log('💾 Guardando compra...');
        
        // Convertir todos los campos numéricos de strings a números
        const formData = this.convertNumericFields(this.formData.data);
        
        // Preparar datos para enviar al backend según la interface
        const purchaseData: Purchase = {
          id_usuario: formData.id_usuario,
          numero_compra: formData.numero_compra,
          total: formData.total,
          estado: formData.estado || 'pendiente',
          observaciones: formData.observaciones || '',
          detalle_compras: formData.detalle_compras.map((detail: any) => ({
            id_producto: detail.id_producto,
            cantidad: Number(detail.cantidad),
            precio_unitario: Number(detail.precio_unitario),
            subtotal: Number(detail.cantidad) * Number(detail.precio_unitario)
          }))
        };

        // Incluir ID si estamos editando
        if (this.initialData.id_compra) {
          (purchaseData as any).id_compra = this.initialData.id_compra;
        }

        // Calcular el total
        purchaseData.total = purchaseData.detalle_compras.reduce(
          (sum: number, detalle: any) => sum + detalle.subtotal, 
          0
        );

        console.log('📤 Datos a enviar al backend:', purchaseData);

        if (this.initialData.id_compra) {
          await this.purchaseService.updatePurchase(this.initialData.id_compra, purchaseData);
          this.toaster.showToast({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Compra actualizada correctamente'
          });
          this.modalService.close(true);
        } else {
          await this.purchaseService.createPurchase(purchaseData);
          this.toaster.showToast({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Compra creada correctamente'
          });
          this.modalService.close(true);
        }
      } catch (error: any) {
        console.error('❌ Error completo:', error);
        if (error.error) {
          console.error('📡 Respuesta del servidor:', error.error);
        }
        this.toaster.showToast({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Error del servidor. Ver la consola para más detalles.',
        });
      }
    } else {
      console.warn('⚠️ Formulario inválido');
      this.toaster.showToast({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, complete todos los campos requeridos correctamente.'
      });
    }
  }

  // Función para convertir campos numéricos de strings a números
  private convertNumericFields(data: any): any {
    const result = { ...data };
    
    if (result.total) result.total = Number(result.total);
    
    if (result.detalle_compras && Array.isArray(result.detalle_compras)) {
      result.detalle_compras = result.detalle_compras.map((detail: any) => ({
        ...detail,
        cantidad: Number(detail.cantidad),
        precio_unitario: Number(detail.precio_unitario),
        subtotal: Number(detail.subtotal) || Number(detail.cantidad) * Number(detail.precio_unitario)
      }));
    }
    
    return result;
  }

  close() {
    this.modalService.close();
  }

  addNewProduct() {
    if (!this.formReference) {
      console.warn('⚠️ FormReference no disponible');
      return;
    }
    
    const detallesArray = this.formReference.get('detalle_compras') as FormArray;
    
    const newDetail = this.fb.group({
      id_producto: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precio_unitario: [0, [Validators.required, Validators.min(0)]],
      subtotal: [0]
    });
    
    detallesArray.push(newDetail);
    
    newDetail.get('cantidad')?.valueChanges.subscribe(() => {
      this.calculateSubtotal(detallesArray.length - 1);
    });
    
    newDetail.get('precio_unitario')?.valueChanges.subscribe(() => {
      this.calculateSubtotal(detallesArray.length - 1);
    });
    
    setTimeout(() => {
      this.calculateSubtotal(detallesArray.length - 1);
    }, 100);
    
    console.log('➕ Nuevo producto agregado');
  }
}