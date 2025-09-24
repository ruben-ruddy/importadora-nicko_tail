// sistema-ventas-frontend/src/app/modules/sales/sale-detail/sale-detail.component.ts

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Product } from '../types';
import { Subscription } from 'rxjs'; // Importar Subscription para gestionar la suscripción

@Component({
  selector: 'app-sale-detail',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './sale-detail.component.html',
  styleUrl: './sale-detail.component.scss'
})
export class SaleDetailComponent implements OnInit, OnDestroy {
  @Input() products: Product[] = [];
  @Input() formArray!: FormArray;
  @Input() isEditMode: boolean = false;
  @Output() totalUpdated = new EventEmitter<number>();

  selectedProduct: any = null;
  cantidad: number = 1;
  productsDetail: any[] = [];

  private formArraySubscription: Subscription | undefined;

  constructor(
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.updateProductsDetail();

    // Suscribirse a los cambios del FormArray
    this.formArraySubscription = this.formArray.valueChanges.subscribe(() => {
      this.updateProductsDetail();
    });
  }

  ngOnDestroy(): void {
    // Es crucial desuscribirse para evitar fugas de memoria
    if (this.formArraySubscription) {
      this.formArraySubscription.unsubscribe();
    }
  }

  addProduct() {
    if (this.isEditMode) {
      alert('No se pueden agregar productos en modo edición');
      return;
    }

    if (!this.selectedProduct) {
      alert('Seleccione un producto');
      return;
    }

    if (this.cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    const product = this.products.find(p => p.id_producto === this.selectedProduct);
    if (!product) {
      alert('Producto no encontrado');
      return;
    }

    // Verificar stock
    if (product.stock_actual < this.cantidad) {
      alert(`Stock insuficiente. Stock disponible: ${product.stock_actual}, solicitado: ${this.cantidad}`);
      return;
    }

    const productGroup = this.fb.group({
      id_producto: [this.selectedProduct, Validators.required],
      cantidad: [this.cantidad, [Validators.required, Validators.min(1)]],
      precio_unitario: [product.precio_venta, [Validators.required, Validators.min(0)]],
      nombre_producto: [product.nombre_producto],
      codigo_producto: [product.codigo_producto],
      stock_actual: [product.stock_actual]
    });

    this.formArray.push(productGroup);
    
    // Resetear formulario de adición
    this.selectedProduct = null;
    this.cantidad = 1;
  }

  removeProduct(index: number) {
    if (this.isEditMode) {
      alert('No se pueden eliminar productos en modo edición');
      return;
    }
    this.formArray.removeAt(index);
  }

  updateProductsDetail() {
    // Mapear los controles del FormArray a un formato visualizable
    this.productsDetail = this.formArray.controls.map((control) => {
      const formGroup = control as FormGroup;
      const cantidad = formGroup.value.cantidad || 0;
      const precioUnitario = formGroup.value.precio_unitario || 0;
      const subtotal = cantidad * precioUnitario;
      
      return {
        ...formGroup.value,
        subtotal: subtotal
      };
    });

    this.calculateTotal();
  }

  calculateTotal() {
    const total = this.productsDetail.reduce((sum, item) => sum + item.subtotal, 0);
    this.totalUpdated.emit(total);
  }

  onCantidadChange(index: number) {
    if (this.isEditMode) {
      alert('No se puede modificar la cantidad en modo edición');
      return;
    }
    
    const control = this.formArray.at(index) as FormGroup;
    const cantidad = control.get('cantidad')?.value || 0;
    const precio = control.get('precio_unitario')?.value || 0;
    const subtotal = cantidad * precio;
    
    control.patchValue({ subtotal }, { emitEvent: false });
    this.updateProductsDetail();
  }


  onPrecioChange(index: number) {
    if (this.isEditMode) {
      alert('No se puede modificar el precio en modo edición');
      return;
    }
    
    const control = this.formArray.at(index) as FormGroup;
    const cantidad = control.get('cantidad')?.value || 0;
    const precio = control.get('precio_unitario')?.value || 0;
    const subtotal = cantidad * precio;
    
    control.patchValue({ subtotal }, { emitEvent: false });
    this.updateProductsDetail();
  }


  getProductOptions() {
    return this.products.map(product => ({
      label: `${product.codigo_producto} - ${product.nombre_producto} (Stock: ${product.stock_actual})`,
      value: product.id_producto,
      precio_venta: product.precio_venta,
      stock_actual: product.stock_actual
    }));
  }

  getTotal(): number {
    return this.productsDetail.reduce((sum, item) => sum + item.subtotal, 0);
  }
}
