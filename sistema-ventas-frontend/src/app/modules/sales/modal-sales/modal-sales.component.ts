// sistema-ventas-frontend/src/app/modules/sales/modal-sales/modal-sales.component.ts
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { SalesService } from '../sales.service';
import { ToasterService } from '../../../project/services/toaster.service';
import { Client, User, Product, Sale } from '../types';
import { SaleDetailComponent } from '../sale-detail/sale-detail.component';
import { GeneralService } from '../../../core/gerneral.service';
import { SaleTicketComponent } from '../sale-ticket/sale-ticket.component';

// Servicio de modales
import { ModalService } from '../../../project/services/modal.service';

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
  @Input() modalData: any = {};
  @Input() modalConfig: any = {};

  public user: any;
  public form!: FormGroup;
  initiaData: any = null;
  catalogs: any = {
    clients: [],
    users: [],
    products: []
  };
  public view = false;
  totalVenta: number = 0;

  constructor(
    private generalService: GeneralService,
    private salesService: SalesService,
    private toaster: ToasterService,
    private fb: FormBuilder,
    private modalService: ModalService
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
    // INICIALIZAR initiaData DESPUÉS del constructor
    this.initiaData = this.modalData?.data || null;
    
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
        label: res.nombre_usuario || res.nombre_completo,
        value: res.id_usuario,
      }));

      this.catalogs.products = products;

      console.log('Productos cargados:', this.catalogs.products.length);
      console.log('Datos iniciales:', this.initiaData);

      // CARGAR DATOS DE EDICIÓN DESPUÉS de cargar los catálogos
      if (this.initiaData) {
        await this.loadInitialData();
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

  async loadInitialData() {
    try {
      console.log('Cargando datos iniciales para edición:', this.initiaData);
      
      // Si no tenemos los detalles completos, cargarlos
      if (this.initiaData && !this.initiaData.detalle_ventas) {
        const saleWithDetails = await this.salesService.getSaleWithDetails(this.initiaData.id_venta);
        this.initiaData = { ...this.initiaData, ...saleWithDetails };
      }

      // Parchar el formulario principal
      this.form.patchValue({
        id_usuario: this.initiaData.id_usuario,
        id_cliente: this.initiaData.id_cliente || '',
        subtotal: this.initiaData.subtotal || 0,
        descuento: this.initiaData.descuento || 0,
        impuesto: this.initiaData.impuesto || 0,
        total: this.initiaData.total || 0,
        estado: this.initiaData.estado || 'completada',
        observaciones: this.initiaData.observaciones || ''
      });

      // Limpiar el array existente
      while (this.detalleVentas.length !== 0) {
        this.detalleVentas.removeAt(0);
      }

      // Agregar detalles de venta al FormArray
      if (this.initiaData.detalle_ventas && this.initiaData.detalle_ventas.length > 0) {
        this.initiaData.detalle_ventas.forEach((detalle: any) => {
          const product = this.catalogs.products.find((p: Product) => p.id_producto === detalle.id_producto);
          
          const detalleGroup = this.fb.group({
            id_producto: [detalle.id_producto, Validators.required],
            cantidad: [detalle.cantidad, [Validators.required, Validators.min(1)]],
            precio_unitario: [detalle.precio_unitario, [Validators.required, Validators.min(0)]],
            subtotal: [{value: detalle.subtotal, disabled: true}],
            nombre_producto: [product?.nombre_producto || detalle.producto?.nombre_producto || ''],
            codigo_producto: [product?.codigo_producto || detalle.producto?.codigo_producto || ''],
            stock_actual: [product?.stock_actual || 0]
          });

          this.detalleVentas.push(detalleGroup);
        });

        // Actualizar totales
        const total = this.initiaData.subtotal || this.detalleVentas.controls.reduce((sum, control) => {
          const cantidad = control.get('cantidad')?.value || 0;
          const precio = control.get('precio_unitario')?.value || 0;
          return sum + (cantidad * precio);
        }, 0);
        
        this.onTotalUpdated(total);
      }

      console.log('Formulario después de cargar datos:', this.form.value);
      console.log('Detalles cargados:', this.detalleVentas.length);

    } catch (error) {
      console.error('Error loading initial data:', error);
      this.toaster.showToast({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los datos de la venta'
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
          this.modalService.open(SaleTicketComponent, {
            title: 'Ticket de Venta',
            width: '500px',
            data: { saleData: ticketData }
          });
        }

        this.modalService.close(result);
        
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
    this.modalService.close();
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