// sistema-ventas-frontend/src/app/modules/home-main/home-products/home-product-modal/home-product-modal.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductCarouselItem } from '../../../../interfaces/product.interface';
import { environment } from '../../../../../environments/environment';
import { ModalService } from '../../../../project/services/modal.service';

@Component({
  selector: 'app-home-product-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home-product-modal.component.html',
  styleUrls: ['./home-product-modal.component.scss']
})
export class HomeProductModalComponent implements OnInit {
  @Input() modalData: any = {};
  @Input() modalConfig: any = {};

  product: ProductCarouselItem | null = null;
  quantity: number = 1;
  backendBaseUrl: string = environment.backend.replace('/api', '');

  constructor(private modalService: ModalService) {}

  // Ciclo de vida del componente
  ngOnInit(): void {
    if (this.modalData?.product) {
      this.product = this.modalData.product;
    }
  }

  // Obtener la URL completa de la imagen del producto
  getFullImageUrl(relativeUrl: string | null | undefined): string {
    if (relativeUrl) {
      if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
        return relativeUrl;
      }
      return `${this.backendBaseUrl}${relativeUrl}`;
    }
    return 'assets/placeholder-product.png';
  }

  // Incrementar o decrementar la cantidad
  incrementQuantity(): void {
    this.quantity++;
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  // Agregar el producto al carrito (simulado)
  addToCart(): void {
    if (this.product) {
      console.log('Producto agregado al carrito:', {
        product: this.product,
        quantity: this.quantity
      });
      this.closeModal();
    }
  }

  // Cerrar el modal
  closeModal(): void {
    this.modalService.close();
  }
}