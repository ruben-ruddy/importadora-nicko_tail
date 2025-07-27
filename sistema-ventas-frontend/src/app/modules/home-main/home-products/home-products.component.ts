// src/app/modules/home-main/home-products/home-products.component.ts
// (o src/app/modules/home-main/public-products/public-products.component.ts)

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment'; // Asegúrate de que esta ruta es correcta

// PrimeNG imports
//import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

// Tus interfaces y servicios
import { ProductCarouselItem } from '../../../interfaces/product.interface';
import { ImageService } from '../../../project/services/image.service'; // Tu servicio que obtiene productos
import { HeaderHomeMainComponent } from "../header-home-main/header-home-main.component";
import { FooterHomeMainComponent } from "../footer-home-main/footer-home-main.component";
import { HomeProductModalComponent } from './home-product-modal/home-product-modal.component'; // Tu componente modal


@Component({
  selector: 'app-home-products', // Verifica que este sea el selector correcto para tu componente
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterModule,
    //CardModule,
    InputTextModule,
    HeaderHomeMainComponent,
    FooterHomeMainComponent,
    //CurrencyPipe
  ],
  templateUrl: './home-products.component.html',
  styleUrls: ['./home-products.component.scss'],
  providers: [DialogService]
})
export class HomeProductsComponent implements OnInit, OnDestroy { // O el nombre de tu clase
  products: ProductCarouselItem[] = [];
  filteredProducts: ProductCarouselItem[] = [];
  searchTerm: string = '';
  isLoading = true;
  errorMessage: string | null = null;

  // --- ¡CLAVE! La URL base de tu backend ---
  // Ajusta esto si tu backend no está en http://localhost:3000
  backendBaseUrl: string = environment.backend.replace('/api', ''); // Asumiendo que environment.backend es ej. http://localhost:3000/api


  ref: DynamicDialogRef | undefined;
  private modalSubscription: Subscription | undefined;

  constructor(
    private imageService: ImageService,
    private dialogService: DialogService
  ) { }

  ngOnInit(): void {
    this.loadAllProducts();
  }

  ngOnDestroy(): void {
    if (this.modalSubscription) {
      this.modalSubscription.unsubscribe();
    }
    if (this.ref) {
      this.ref.close();
    }
  }

  loadAllProducts(): void {
    this.isLoading = true;
    this.errorMessage = null;
    // Asumiendo que ImageService.getAllPublicProducts() devuelve ProductCarouselItem[]
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

  // --- ¡CLAVE! Método para construir la URL completa de la imagen ---
  getFullImageUrl(relativeUrl: string | null | undefined): string {
    if (relativeUrl) {
      // Si la URL ya es absoluta (ej. empieza con http), úsala directamente
      if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
        return relativeUrl;
      }
      // Si es una ruta relativa (ej. /uploads/...), concaténala con la base del backend
      return `${this.backendBaseUrl}${relativeUrl}`;
    }
    // Si no hay URL, usa un placeholder
    return 'assets/placeholder-product.png';
  }

  openProductModal(product: ProductCarouselItem): void {
    this.ref = this.dialogService.open(HomeProductModalComponent, {
      data: {
        product: product
      },
      header: '',
      width: '50vw',
      modal: true,
      closable: false,
      position: 'center' // Opcional: posición del modal
    });

    this.modalSubscription = this.ref.onClose.subscribe((result: any) => {
      console.log('Modal de producto cerrado. Resultado:', result);
      this.ref = undefined;
    });
  }
}