// sistema-ventas-frontend/src/app/modules/sales/modal-sales/modal-sales.component.ts

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SalesService } from '../sales.service';
import { ToasterService } from '../../../project/services/toaster.service';
import { Client, User, Product, Sale } from '../types';
import { SaleDetailComponent } from '../sale-detail/sale-detail.component';
import { GeneralService } from '../../../core/gerneral.service';
import { SaleTicketComponent } from '../sale-ticket/sale-ticket.component';
import { DialogService } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-modal-sales',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule,
    SaleDetailComponent,
  ],
  templateUrl: './modal-sales.component.html',
  styleUrl: './modal-sales.component.scss',
})
export class ModalSalesComponent implements OnInit {
  public user: any;
  dynamicDialogConfig = inject(DynamicDialogConfig);
  public form!: FormGroup;
  initiaData = this.dynamicDialogConfig.data?.data;
  catalogs: any = {};
  public view = false;
  totalVenta: number = 0;

  constructor(
    private generalService: GeneralService,
    public ref: DynamicDialogRef,
    private salesService: SalesService,
    private toaster: ToasterService,
    private fb: FormBuilder,
    private dialogService: DialogService 
  ) {
    this.createForm();
  }

  createForm() {
    this.form = this.fb.group({
      id_usuario: [{ value: '', disabled: false }, Validators.required],
      id_cliente: [''],
      subtotal: [0, [Validators.required, Validators.min(0)]],
      descuento: [0, [Validators.min(0)]],
      impuesto: [0, [Validators.min(0)]],
      total: [0, [Validators.required, Validators.min(0)]],
      estado: ['completada', Validators.required],
      observaciones: [''],
      detalle_ventas: this.fb.array([])
    });
  }

  get detalleVentas(): FormArray {
    return this.form.get('detalle_ventas') as FormArray;
  }

  async ngOnInit() {
    this.user = this.generalService.getUser();
    
    if (this.user && this.user.id_usuario) {
      this.form.patchValue({
        id_usuario: this.user.id_usuario
      });
      this.form.get('id_usuario')?.disable();
    }

    try {
      const [clients, users, products] = await Promise.all([
        this.salesService.getClients(),
        this.salesService.getUsers(),
        this.salesService.getProducts()
      ]);

      this.catalogs.clients = clients.map((res: Client) => ({
        label: res.nombre_completo,
        value: res.id_cliente,
      }));

      this.catalogs.users = users.map((res: User) => ({
        label: res.nombre_usuario,
        value: res.id_usuario,
      }));

      this.catalogs.products = products;

      if (this.initiaData) {
        this.loadInitialData();
      }

      this.view = true;
    } catch (error) {
      console.error('Error loading catalogs:', error);
      this.toaster.showToast({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los catálogos'
      });
    }
  }

  loadInitialData() {
    this.form.patchValue({
      ...this.initiaData,
      fecha_venta: this.initiaData.fecha_venta ? 
        new Date(this.initiaData.fecha_venta).toISOString().substring(0, 10) : 
        new Date().toISOString().substring(0, 10)
    });

    if (this.initiaData.detalle_ventas) {
      this.initiaData.detalle_ventas.forEach((detalle: any) => {
        const product = this.catalogs.products.find((p: Product) => p.id_producto === detalle.id_producto);
        this.detalleVentas.push(this.fb.group({
          id_producto: [detalle.id_producto, Validators.required],
          cantidad: [detalle.cantidad, [Validators.required, Validators.min(1)]],
          precio_unitario: [detalle.precio_unitario, [Validators.required, Validators.min(0)]],
          subtotal: [{value: detalle.subtotal, disabled: true}],
          nombre_producto: [product?.nombre_producto || ''],
          codigo_producto: [product?.codigo_producto || ''],
          stock_actual: [product?.stock_actual || 0]
        }));
      });
    }
  }

  onTotalUpdated(total: number) {
    const descuento = this.form.get('descuento')?.value || 0;
    const impuesto = this.form.get('impuesto')?.value || 0;
    const totalFinal = total - descuento + impuesto;

    this.form.patchValue({
      subtotal: total,
      total: totalFinal
    }, { emitEvent: false });

    this.totalVenta = totalFinal;
  }

async save() {
  if (this.form.valid && this.detalleVentas.length > 0) {
    try {
      const formData = this.form.getRawValue();
      
      // Preparar datos para enviar al backend
      const saleData: any = {
        id_usuario: formData.id_usuario,
        estado: formData.estado,
        observaciones: formData.observaciones || null
      };

      // Solo incluir campos permitidos para actualización
      if (this.initiaData?.id_venta) {
        // Para edición, solo enviar campos permitidos
        saleData.id_cliente = formData.id_cliente || null;
        saleData.descuento = parseFloat(formData.descuento) || 0;
        saleData.impuesto = parseFloat(formData.impuesto) || 0;
        
        // Nota: No enviamos detalle_ventas, subtotal ni total para edición
        // ya que el backend no permite modificar estos campos
      } else {
        // Para creación, enviar todos los campos
        saleData.id_cliente = formData.id_cliente || null;
        saleData.subtotal = parseFloat(formData.subtotal);
        saleData.descuento = parseFloat(formData.descuento) || 0;
        saleData.impuesto = parseFloat(formData.impuesto) || 0;
        saleData.total = parseFloat(formData.total);
        saleData.detalle_ventas = formData.detalle_ventas.map((item: any) => ({
          id_producto: item.id_producto,
          cantidad: parseInt(item.cantidad),
          precio_unitario: parseFloat(item.precio_unitario)
        }));
      }

      console.log('Datos a enviar:', saleData);

      let result: Sale;

      if (this.initiaData?.id_venta) {
        result = await this.salesService.updateSale(this.initiaData.id_venta, saleData);
        this.toaster.showToast({
          severity: 'success',
          summary: 'Actualizado',
          detail: 'Venta actualizada correctamente'
        });
      } else {
        result = await this.salesService.createSale(saleData);
        this.toaster.showToast({
          severity: 'success',
          summary: 'Creado',
          detail: 'Venta creada correctamente'
        });
      }

      // Construir los datos completos para el ticket usando la información local
      const ticketData = this.buildTicketData(result, formData);

      // Mostrar ticket después de guardar (solo para nuevas ventas)
      if (!this.initiaData?.id_venta) {
        this.dialogService.open(SaleTicketComponent, {
          data: { saleData: ticketData },
          header: 'Ticket de Venta',
          width: '500px',
          style: { 'max-width': '90vw' },
          closable: true
        });
      }

      this.ref.close(result);
      
    } catch (error: unknown) {
      console.error('Error saving sale:', error);
      
      let errorMessage = 'Error al guardar la venta';
      
      if (typeof error === 'object' && error !== null) {
        const errorObj = error as { error?: { message?: string }; message?: string };
        
        if (errorObj.error?.message) {
          errorMessage = errorObj.error.message;
        } else if (errorObj.message) {
          errorMessage = errorObj.message;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      this.toaster.showToast({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage
      });
    }
  }
}


  close() {
    this.ref.close();
  }

  // Nuevo método para construir los datos del ticket
private buildTicketData(result: Sale, formData: any): any {
  // Obtener información del cliente seleccionado
  const selectedClient = formData.id_cliente ? 
    this.catalogs.clients.find((c: Client) => c.value === formData.id_cliente) : 
    null;

  // Obtener información del vendedor seleccionado
  const selectedUser = this.catalogs.users.find((u: User) => u.value === formData.id_usuario);

  // Construir el detalle de ventas con información completa de productos
  const detalleVentas = formData.detalle_ventas.map((item: any) => {
    const product = this.catalogs.products.find((p: Product) => p.id_producto === item.id_producto);
    return {
      ...item,
      producto: product ? {
        nombre_producto: product.nombre_producto,
        codigo_producto: product.codigo_producto
      } : undefined,
      subtotal: item.cantidad * item.precio_unitario
    };
  });

  return {
    ...result,
    numero_venta: result.numero_venta || `VENTA-${new Date().getTime()}`,
    fecha_venta: result.fecha_venta || new Date().toISOString(),
    client: selectedClient ? {
      nombre_completo: selectedClient.label
    } : undefined,
    user: selectedUser ? {
      nombre_usuario: selectedUser.label
    } : undefined,
    detalle_ventas: detalleVentas,
    subtotal: formData.subtotal,
    descuento: formData.descuento,
    impuesto: formData.impuesto,
    total: formData.total,
    observaciones: formData.observaciones
  };
}

}