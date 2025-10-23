// sistema-ventas-frontend/src/app/modules/home-main/home-products/home-products.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';

// Tus interfaces y servicios
import { ProductCarouselItem } from '../../../interfaces/product.interface';
import { ImageService } from '../../../project/services/image.service';
import { HeaderHomeMainComponent } from "../header-home-main/header-home-main.component";
import { FooterHomeMainComponent } from "../footer-home-main/footer-home-main.component";
import { HomeProductModalComponent } from './home-product-modal/home-product-modal.component';

// Servicio de modales
import { ModalService } from '../../../project/services/modal.service';

@Component({
  selector: 'app-home-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterModule,
    HeaderHomeMainComponent,
    FooterHomeMainComponent,
  ],
  templateUrl: './home-products.component.html',
  styleUrls: ['./home-products.component.scss']
})
export class HomeProductsComponent implements OnInit, OnDestroy {
  products: ProductCarouselItem[] = [];
  filteredProducts: ProductCarouselItem[] = [];
  searchTerm: string = '';
  isLoading = true;
  errorMessage: string | null = null;

  // URL base de tu backend
  backendBaseUrl: string = environment.backend.replace('/api', '');

  private modalSubscription: Subscription | undefined;

  constructor(
    private imageService: ImageService,
    private modalService: ModalService
  ) { }

  ngOnInit(): void {
    this.loadAllProducts();
  }

  ngOnDestroy(): void {
    if (this.modalSubscription) {
      this.modalSubscription.unsubscribe();
    }
  }

  loadAllProducts(): void {
    this.isLoading = true;
    this.errorMessage = null;
    
    this.imageService.getAllPublicProducts().subscribe({
      next: data => {
        this.products = data;
        this.filterProducts();
        this.isLoading = false;
        if (this.products.length === 0) {
          this.errorMessage = 'No se encontraron productos.';
        }
      },
      error: err => {
        console.error('Error al cargar todos los productos:', err);
        this.errorMessage = 'No se pudieron cargar los productos. Inténtalo de nuevo más tarde.';
        this.isLoading = false;
      }
    });
  }

  filterProducts(): void {
    if (!this.searchTerm) {
      this.filteredProducts = [...this.products];
    } else {
      const lowerCaseSearchTerm = this.searchTerm.toLowerCase();
      this.filteredProducts = this.products.filter(product =>
        product.nombre_producto.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }
  }

  getFullImageUrl(relativeUrl: string | null | undefined): string {
    if (relativeUrl) {
      if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
        return relativeUrl;
      }
      return `${this.backendBaseUrl}${relativeUrl}`;
    }
    return 'assets/placeholder-product.png';
  }

  openProductModal(product: ProductCarouselItem): void {
    this.modalService.open(HomeProductModalComponent, {
      title: product.nombre_producto,
      width: '50vw',
      data: {
        product: product
      }
    }).then((result: any) => {
      console.log('Modal de producto cerrado. Resultado:', result);
    });
  }
}