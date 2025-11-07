import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { DynamicFormComponent } from '../../../project/components/dynamic-form/dynamic-form.component';
import { FormArray, FormGroup, Validators, FormBuilder } from '@angular/forms';
import { purchaseFormFields } from './schema';
import { PurchaseService } from '../purchase.service';
import { ToasterService } from '../../../project/services/toaster.service';
import { Purchase, PurchaseDetail } from '../../../interfaces/purchase.interface';
import { ModalService } from '../../../project/services/modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-modal-purchase',
  imports: [CommonModule, DynamicFormComponent],
  standalone: true,
  templateUrl: './modal-purchase.component.html',
  styleUrl: './modal-purchase.component.scss',
})
export class ModalPurchaseComponent implements OnInit, OnDestroy {
  @Input() modalData: any = {};
  @Input() modalConfig: any = {};

  formReference!: FormGroup;
  public formData: any;
  private subscriptions: Subscription = new Subscription();
  private isInitialized = false;

  onFormCreated = (form: FormGroup) => {
    this.formReference = form;
    this.setupCalculations();
  };

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
    if (this.isInitialized) {
      return;
    }

    try {
      this.currentUser = this.modalData?.currentUser;
      
      if (this.modalData?.data) {
        this.initialData = {
          ...this.initialData,
          ...this.modalData.data
        };
      }

      if (this.currentUser && !this.initialData.id_compra) {
        this.initialData.id_usuario = this.currentUser.id_usuario;
      }

      // Cargar catálogos en paralelo
      await this.loadCatalogs();

      if (this.initialData.id_compra) {
        await this.loadPurchaseDetails();
      } else {
        this.initialData.detalle_compras = [{
          id_producto: '',
          cantidad: 1,
          precio_unitario: 0,
          subtotal: 0
        }];
      }

      this.view = true;
      this.loading = false;
      this.isInitialized = true;

    } catch (error) {
      this.loading = false;
      this.toaster.showToast({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los datos del formulario'
      });
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.isInitialized = false;
  }

  private async loadCatalogs() {
    const [usersArray, productsArray] = await Promise.all([
      this.purchaseService.getUsers(),
      this.purchaseService.getProducts()
    ]);

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
  }

  private async loadPurchaseDetails() {
    try {
      const purchaseDetails = await this.purchaseService.getPurchaseById(this.initialData.id_compra!);
      
      if (purchaseDetails.detalle_compras && Array.isArray(purchaseDetails.detalle_compras)) {
        this.initialData.detalle_compras = purchaseDetails.detalle_compras.map((detalle: PurchaseDetail) => ({
          id_detalle_compra: detalle.id_detalle_compra,
          id_producto: detalle.id_producto,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          subtotal: detalle.subtotal,
          producto: detalle.producto
        }));
      } else {
        this.initialData.detalle_compras = [];
      }
      
      this.initialData = {
        ...this.initialData,
        ...purchaseDetails
      };
      
    } catch (error) {
      this.initialData.detalle_compras = [];
    }
  }

  // Configurar cálculos automáticos en el formulario
  private setupCalculations() {
    if (!this.formReference) return;

    const detallesArray = this.formReference.get('detalle_compras') as FormArray;
    
    // Suscribirse a cambios en la estructura del array
    const arraySubscription = detallesArray.valueChanges.subscribe(() => {
      this.setupDetailSubscriptions();
      this.calculateTotal();
    });

    this.subscriptions.add(arraySubscription);

    // Configurar suscripciones iniciales
    this.setupDetailSubscriptions();
    
    // Calcular valores iniciales
    this.calculateAllSubtotals();
  }

  // Configurar suscripciones para cada ítem del array de detalles
  private setupDetailSubscriptions() {
    if (!this.formReference) return;

    const detallesArray = this.formReference.get('detalle_compras') as FormArray;
    
    // Limpiar suscripciones anteriores de detalles
    this.subscriptions.add(new Subscription()); // Marcador para limpiar solo detalles

    // Suscribirse a cambios en cada item del array
    detallesArray.controls.forEach((control, index) => {
      const cantidadSubscription = control.get('cantidad')?.valueChanges.subscribe(() => {
        this.calculateSubtotal(index);
      });
      
      const precioSubscription = control.get('precio_unitario')?.valueChanges.subscribe(() => {
        this.calculateSubtotal(index);
      });

      if (cantidadSubscription) {
        this.subscriptions.add(cantidadSubscription);
      }
      
      if (precioSubscription) {
        this.subscriptions.add(precioSubscription);
      }
    });
  }

  // Calcular todos los subtotales
  private calculateAllSubtotals() {
    if (!this.formReference) return;

    const detallesArray = this.formReference.get('detalle_compras') as FormArray;
    
    detallesArray.controls.forEach((_, index) => {
      this.calculateSubtotal(index);
    });
  }

  // Calcular subtotal para un ítem específico
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

  // Calcular el total de la compra
  private calculateTotal() {
    if (!this.formReference) return;

    const detallesArray = this.formReference.get('detalle_compras') as FormArray;
    const detalles = detallesArray.value || [];
    
    const total = detalles.reduce((sum: number, detalle: any) => {
      const subtotal = Number(detalle.subtotal) || 0;
      return sum + subtotal;
    }, 0);

    this.formReference.get('total')?.setValue(total, { emitEvent: false });
  }

  purchaseFormFields(catalogs: any): any[] {
    return purchaseFormFields(catalogs, this.currentUser);
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
        // Recalcular todo antes de guardar
        this.calculateAllSubtotals();
        
        const formData = this.convertNumericFields(this.formData.data);
        
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

        if (this.initialData.id_compra) {
          (purchaseData as any).id_compra = this.initialData.id_compra;
        }

        // Recalcular total final
        purchaseData.total = purchaseData.detalle_compras.reduce(
          (sum: number, detalle: any) => sum + detalle.subtotal, 
          0
        );

        if (this.initialData.id_compra) {
          await this.purchaseService.updatePurchase(this.initialData.id_compra, purchaseData);
          this.toaster.showToast({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Compra actualizada correctamente'
          });
        } else {
          await this.purchaseService.createPurchase(purchaseData);
          this.toaster.showToast({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Compra creada correctamente'
          });
        }
        
        this.modalService.close(true);
        
      } catch (error: any) {
        this.toaster.showToast({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Error del servidor.'
        });
      }
    } else {
      this.toaster.showToast({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, complete todos los campos requeridos correctamente.'
      });
    }
  }

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

  // Agregar un nuevo producto al detalle de la compra
  addNewProduct() {
    if (!this.formReference) return;
    
    const detallesArray = this.formReference.get('detalle_compras') as FormArray;
    
    const newDetail = this.fb.group({
      id_producto: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precio_unitario: [0, [Validators.required, Validators.min(0)]],
      subtotal: [0]
    });
    
    detallesArray.push(newDetail);
    
    // Configurar suscripciones para el nuevo item
    const cantidadSubscription = newDetail.get('cantidad')?.valueChanges.subscribe(() => {
      this.calculateSubtotal(detallesArray.length - 1);
    });
    
    const precioSubscription = newDetail.get('precio_unitario')?.valueChanges.subscribe(() => {
      this.calculateSubtotal(detallesArray.length - 1);
    });

    if (cantidadSubscription) {
      this.subscriptions.add(cantidadSubscription);
    }
    
    if (precioSubscription) {
      this.subscriptions.add(precioSubscription);
    }
    
    // Calcular subtotal inicial
    this.calculateSubtotal(detallesArray.length - 1);
  }
}