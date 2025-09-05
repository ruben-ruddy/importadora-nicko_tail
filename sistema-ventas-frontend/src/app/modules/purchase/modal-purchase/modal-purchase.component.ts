// modal-purchase.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DynamicFormComponent } from '../../../project/components/dynamic-form/dynamic-form.component';
import { FormArray, FormGroup, Validators, FormBuilder } from '@angular/forms';
import { purchaseFormFields } from './schema';
import { PurchaseService } from '../purchase.service';
import { ToasterService } from '../../../project/services/toaster.service';
import { Purchase, PurchaseDetail } from '../../../interfaces/purchase.interface';

@Component({
  selector: 'app-modal-purchase',
  imports: [CommonModule, DynamicFormComponent],
  standalone: true,
  templateUrl: './modal-purchase.component.html',
  styleUrl: './modal-purchase.component.scss',
})
export class ModalPurchaseComponent implements OnInit {
  dynamicDialogConfig = inject(DynamicDialogConfig);
  formReference!: FormGroup;
  public formData: any;
  onFormCreated = (form: FormGroup) => {
    this.formReference = form;
  };
  
  // Inicializar con valores por defecto
  initialData: Purchase = {
    id_usuario: '',
    numero_compra: '',
    //fecha_compra: new Date().toISOString(),
    total: 0,
    estado: 'pendiente',
    observaciones: '',
    detalle_compras: []
  };
  
  catalogs: any = {};
  public view = false;

  constructor(
    public ref: DynamicDialogRef,
    private purchaseService: PurchaseService,
    private toaster: ToasterService,
    private fb: FormBuilder
  ) { }


  
async ngOnInit() {
  
  // Si hay datos iniciales, mezclarlos con los valores por defecto
  if (this.dynamicDialogConfig.data?.data) {
    this.initialData = {
      ...this.initialData,
      ...this.dynamicDialogConfig.data.data
    };

  }

  

  // Inicializar catálogos vacíos
  this.catalogs = {
    users: [],
    products: []
  };

  // Cargar catálogos necesarios
  try {
    const [usersArray, productsArray] = await Promise.all([
      this.purchaseService.getUsers(),
      this.purchaseService.getProducts()
    ]);

    console.log('Users loaded:', usersArray);
    console.log('Products loaded:', productsArray);

    this.catalogs.users = usersArray.map((user: any) => ({
      label: user.nombre_completo || user.nombre_usuario || 'Usuario sin nombre',
      value: user.id_usuario,
    }));

    this.catalogs.products = productsArray.map((product: any) => ({
      label: product.nombre_producto,
      value: product.id_producto,
      precio_compra: product.precio_compra
    }));

  } catch (error) {
    console.error('Error loading catalogs:', error);
  }

  // Si estamos editando, cargar los detalles de la compra
  if (this.initialData.id_compra) {
    try {
      const purchaseDetails: any = await this.purchaseService.getPurchaseById(this.initialData.id_compra);
      this.initialData.detalle_compras = Array.isArray(purchaseDetails.detalle_compras) 
        ? purchaseDetails.detalle_compras 
        : [];
    } catch (error) {
      console.error('Error loading purchase details:', error);
      this.initialData.detalle_compras = [];
    }
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
  // Configurar cálculos después de que el formulario esté listo
    setTimeout(() => {
      this.setupCalculations();
      // Calcular valores iniciales
      this.calculateAllSubtotals();
      this.calculateTotal();
    }, 100);

    // Suscribirse a cambios para calcular totales
  this.setupCalculations();
}

private setupCalculations() {
  if (!this.formReference) return;

  const detallesArray = this.formReference.get('detalle_compras') as FormArray;
  
  // Suscribirse a cambios en la estructura del array (agregar/eliminar items)
  detallesArray.valueChanges.subscribe(() => {
    // Reconfigurar suscripciones cuando cambia la estructura del array
    this.setupArraySubscriptions();
    this.calculateTotal();
  });

  // Configurar suscripciones iniciales
  this.setupArraySubscriptions();
}

private setupArraySubscriptions() {
  if (!this.formReference) return;

  const detallesArray = this.formReference.get('detalle_compras') as FormArray;
  
  // Limpiar suscripciones anteriores
  // (Necesitarías mantener un array de subscriptions para limpiarlas)
  
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
  
  // Verificar que el índice sea válido
  if (index < 0 || index >= detallesArray.length) return;

  const detalleGroup = detallesArray.at(index);
  const cantidad = Number(detalleGroup.get('cantidad')?.value) || 0;
  const precio = Number(detalleGroup.get('precio_unitario')?.value) || 0;
  const subtotal = cantidad * precio;

  // Actualizar subtotal
  detalleGroup.get('subtotal')?.setValue(subtotal, { emitEvent: false });
  
  // Recalcular el total
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

    // Actualizar total sin emitir evento
    this.formReference.get('total')?.setValue(total, { emitEvent: false });
  }

private calculateTotals() {
  if (!this.formReference) return;

  const detalles = this.formReference.get('detalle_compras')?.value || [];
  
  // Calcular subtotales y total
  let total = 0;
  detalles.forEach((detalle: any, index: number) => {
    const cantidad = detalle.cantidad || 0;
    const precio = detalle.precio_unitario || 0;
    const subtotal = cantidad * precio;
    
    // Actualizar subtotal en el form
    const subtotalControl = this.formReference.get(`detalle_compras.${index}.subtotal`);
    if (subtotalControl) {
      subtotalControl.setValue(subtotal, { emitEvent: false });
    }
    
    total += subtotal;
  });

  // Actualizar total en el form
  const totalControl = this.formReference.get('total');
  if (totalControl) {
    totalControl.setValue(total, { emitEvent: false });
  }
}


  purchaseFormFields(catalogs: any): any[] {
  const fields = purchaseFormFields(catalogs);
  console.log('Form fields generated:', fields);
  console.log('Catalogs available:', catalogs);
  return fields;
}
  handleFormChange(event: {
  data: any;
  valid: boolean;
  touched: boolean;
  dirty: boolean;
  complete: boolean;
}) {
  console.log('Form changed:', event);
  this.formData = event;
}

async save() {
  if (this.formData?.valid) {
    try {
      // Convertir todos los campos numéricos de strings a números
      const formData = this.convertNumericFields(this.formData.data);
      
      // Preparar datos para enviar al backend
      const purchaseData: Purchase = {
        ...formData,
        estado: formData.estado || 'pendiente',
        detalle_compras: formData.detalle_compras.map((detail: any) => ({
          id_producto: detail.id_producto,
          cantidad: Number(detail.cantidad),
          precio_unitario: Number(detail.precio_unitario),
          subtotal: Number(detail.cantidad) * Number(detail.precio_unitario)
        }))
      };

      // Calcular el total
      purchaseData.total = purchaseData.detalle_compras.reduce(
        (sum: number, detalle: any) => sum + detalle.subtotal, 
        0
      );

      // DEBUG: Ver qué se está enviando
      console.log('Datos a enviar al backend:', JSON.stringify(purchaseData, null, 2));

      if (this.initialData.id_compra) {
        await this.purchaseService.updatePurchase(this.initialData.id_compra, purchaseData);
        // ... éxito ...
      } else {
        await this.purchaseService.createPurchase(purchaseData);
        // ... éxito ...
      }
    } catch (error: any) {
      console.error('Error completo:', error);
      // Mostrar más detalles del error
      if (error.error) {
        console.error('Respuesta del servidor:', error.error);
      }
      this.toaster.showToast({
        severity: 'error',
        summary: 'Error',
        detail: error.error?.message || 'Error del servidor. Ver la consola para más detalles.',
      });
    }
  }
}

// Función para convertir campos numéricos de strings a números
private convertNumericFields(data: any): any {
  const numericFields = ['total', 'cantidad', 'precio_unitario', 'subtotal'];
  const result = { ...data };
  
  // Convertir campos principales
  if (result.total) result.total = Number(result.total);
  
  // Convertir campos en detalle_compras
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
    this.ref.close();
  }

  forceRecalculation() {
  if (!this.formReference) return;
  
  // Forzar recálculo de todos los subtotales y total
  const detallesArray = this.formReference.get('detalle_compras') as FormArray;
  const detalles = detallesArray.value || [];
  
  detalles.forEach((detalle: any, index: number) => {
    const cantidad = Number(detalle.cantidad) || 0;
    const precio = Number(detalle.precio_unitario) || 0;
    const subtotal = cantidad * precio;
    
    const subtotalControl = detallesArray.at(index).get('subtotal');
    if (subtotalControl) {
      subtotalControl.setValue(subtotal, { emitEvent: false });
    }
  });
  
  this.calculateTotal();
}

private refreshForm() {
  if (!this.formReference) return;
  
  // Forzar actualización de la vista
  this.formReference.updateValueAndValidity();
  
  // Recalcular todos los subtotales
  this.calculateAllSubtotals();
}

// Llamar este método después de agregar items
addArrayItem() {
  if (!this.formReference) return;
  
  const formArray = this.formReference.get('detalle_compras') as FormArray;
  const newItem = this.createArrayItem();
  formArray.push(newItem);
  
  // Forzar actualización después de agregar item
  setTimeout(() => {
    this.refreshForm();
  }, 100);
}

// Método para crear un item del array
private createArrayItem(): FormGroup {
  return this.fb.group({
    id_producto: ['', Validators.required],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    precio_unitario: [0, [Validators.required, Validators.min(0)]],
    subtotal: [0]
  });
}

addNewProduct() {
  if (!this.formReference) return;
  
  const detallesArray = this.formReference.get('detalle_compras') as FormArray;
  
  // Crear nuevo grupo de detalle usando this.fb
  const newDetail = this.fb.group({
    id_producto: ['', Validators.required],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    precio_unitario: [0, [Validators.required, Validators.min(0)]],
    subtotal: [0]
  });
  
  detallesArray.push(newDetail);
  
  // Suscribirse a cambios en el nuevo item
  newDetail.get('cantidad')?.valueChanges.subscribe(() => {
    this.calculateSubtotal(detallesArray.length - 1);
  });
  
  newDetail.get('precio_unitario')?.valueChanges.subscribe(() => {
    this.calculateSubtotal(detallesArray.length - 1);
  });
  
  // Calcular subtotal inicial
  setTimeout(() => {
    this.calculateSubtotal(detallesArray.length - 1);
  }, 100);
}



}