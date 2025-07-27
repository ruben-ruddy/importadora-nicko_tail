// src/app/modules/home-main/home-products/home-product-modal/home-product-modal.component.ts
import { Component, OnInit } from '@angular/core'; // Ya no necesitas Input ni Output
import { CommonModule, CurrencyPipe } from '@angular/common';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { ProductCarouselItem } from '../../../../interfaces/product.interface';

@Component({
  selector: 'app-home-product-modal',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CurrencyPipe
  ],
  templateUrl: './home-product-modal.component.html',
  styleUrls: ['./home-product-modal.component.scss']
})
export class HomeProductModalComponent implements OnInit {

  product: ProductCarouselItem | null = null;
  // --- ¡Asegúrate de que 'isVisible' NO esté aquí! ---
  // @Input() isVisible: boolean = false; // <-- ¡Elimina esta línea si existe!

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) { }

  ngOnInit(): void {
    if (this.config.data && this.config.data.product) {
      this.product = this.config.data.product as ProductCarouselItem;
      console.log('HomeProductModalComponent: Producto recibido en el modal:', this.product);
    } else {
      console.warn('HomeProductModalComponent: No se recibieron datos de producto en el modal.');
    }
  }

  closeModal(): void {
    this.ref.close();
  }
}