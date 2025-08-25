// sistema-ventas-frontend/src/app/modules/sales/modal-sales/modal-sales.component.ts

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms'; // ← Añadir si necesitas ngModel
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SalesService } from '../sales.service';
import { ToasterService } from '../../../project/services/toaster.service';
import { Client, User, Product } from '../types';
import { SaleDetailComponent } from '../sale-detail/sale-detail.component';
import { GeneralService } from '../../../core/gerneral.service';

@Component({
  selector: 'app-modal-sales',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule, // ← Añadir si necesitas ngModel
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
    private fb: FormBuilder
  ) {
    this.createForm();
  }

  createForm() {
    this.form = this.fb.group({
      id_usuario: [{ value: '', disabled: false }, Validators.required],
      id_cliente: [''],
      //numero_venta: ['', Validators.required],
      //fecha_venta: [new Date().toISOString().substring(0, 10)],
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
    // Obtener el usuario logueado al iniciar el componente
    this.user = this.generalService.getUser();
    
    // Si hay un usuario, preseleccionar su id en el formulario
    // Esto asegura que el campo 'Vendedor' esté prellenado
    if (this.user && this.user.id_usuario) {
      this.form.patchValue({
        id_usuario: this.user.id_usuario
      });
      // Deshabilitar el control para evitar que el usuario lo cambie
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

      // Cargar datos iniciales si es edición
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

    // Cargar detalle de ventas si existe
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
        
        // Preparar datos en el formato correcto (sin fecha_venta y numero de venta)
        const saleData = {
          id_usuario: formData.id_usuario,
          id_cliente: formData.id_cliente || null,
          //numero_venta: formData.numero_venta,
          subtotal: parseFloat(formData.subtotal),
          descuento: parseFloat(formData.descuento),
          impuesto: parseFloat(formData.impuesto),
          total: parseFloat(formData.total),
          estado: formData.estado,
          observaciones: formData.observaciones || null,
          detalle_ventas: formData.detalle_ventas.map((item: any) => ({
            id_producto: item.id_producto,
            cantidad: parseInt(item.cantidad),
            precio_unitario: parseFloat(item.precio_unitario)
            // subtotal - se calcula automáticamente en el backend
          }))
        };

        console.log('Datos a enviar:', saleData);

        if (this.initiaData?.id_venta) {
          const result = await this.salesService.updateSale(this.initiaData.id_venta, saleData);
          this.toaster.showToast({
            severity: 'success',
            summary: 'Actualizado',
            detail: 'Venta actualizada correctamente'
          });
          this.ref.close(result);
        } else {
          const result = await this.salesService.createSale(saleData);
          this.toaster.showToast({
            severity: 'success',
            summary: 'Creado',
            detail: 'Venta creada correctamente'
          });
          this.ref.close(result);
        }
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
    } else {
      this.toaster.showToast({
        severity: 'warning',
        summary: 'Validación',
        detail: 'Complete todos los campos requeridos y agregue al menos un producto'
      });
    }
  }

  close() {
    this.ref.close();
  }
}