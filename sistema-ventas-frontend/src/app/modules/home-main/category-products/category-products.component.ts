// sistema-ventas-frontend/src/app/modules/home-main/category-products/category-products.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Subscription } from 'rxjs';

import { HeaderHomeMainComponent } from '../header-home-main/header-home-main.component';
import { FooterHomeMainComponent } from '../footer-home-main/footer-home-main.component';
import { ProductCarouselItem } from '../../../interfaces/product.interface';
import { ImageService } from '../../../project/services/image.service';
import { HomeProductModalComponent } from '../home-products/home-product-modal/home-product-modal.component';

// Servicio de modales
import { ModalService } from '../../../project/services/modal.service';

@Component({
  selector: 'app-category-products',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
    HeaderHomeMainComponent,
    FooterHomeMainComponent,
  ],
  templateUrl: './category-products.component.html',
  styleUrls: ['./category-products.component.scss']
})
export class CategoryProductsComponent implements OnInit, OnDestroy {
  categoryName: string = '';
  products: ProductCarouselItem[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  private routeSubscription: Subscription | undefined;
  private modalSubscription: Subscription | undefined;

  constructor(
    private route: ActivatedRoute,
    private imageService: ImageService,
    private modalService: ModalService
  ) { }

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const categoryId = params.get('categoryId');
      this.categoryName = 'Cargando categoría...';

      if (categoryId) {
        this.loadProductsByCategory(categoryId);
      } else {
        this.errorMessage = 'ID de categoría no proporcionado.';
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    if (this.modalSubscription) {
      this.modalSubscription.unsubscribe();
    }
  }

  loadProductsByCategory(categoryId: string): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.products = [];

    this.imageService.getProductsByCategoryId(categoryId).subscribe({
      next: data => {
        this.products = data;
        this.isLoading = false;

        if (this.products && this.products.length > 0) {
          this.categoryName = this.products[0].category;
        } else {
          this.errorMessage = 'No se encontraron productos para esta categoría.';
          this.categoryName = 'Categoría Desconocida';
        }
      },
      error: err => {
        console.error('Error al cargar productos por categoría:', err);
        this.errorMessage = 'No se pudieron cargar los productos de esta categoría. Inténtalo de nuevo más tarde.';
        this.isLoading = false;
        this.categoryName = 'Error al cargar categoría';
      }
    });
  }

  getFullImageUrl(relativeUrl: string | null | undefined): string {
    return relativeUrl || 'assets/placeholder-product.png';
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