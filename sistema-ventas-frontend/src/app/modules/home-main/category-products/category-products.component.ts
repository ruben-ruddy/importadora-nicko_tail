// src/app/modules/home-main/category-products/category-products.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

import { HeaderHomeMainComponent } from '../header-home-main/header-home-main.component';
import { FooterHomeMainComponent } from '../footer-home-main/footer-home-main.component';
import { ProductCarouselItem } from '../../../interfaces/product.interface'; // Asegura la ruta correcta y la interfaz
import { ImageService } from '../../../project/services/image.service'; // Asegura la ruta correcta
import { HomeProductModalComponent } from '../home-products/home-product-modal/home-product-modal.component';


@Component({
  selector: 'app-category-products',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
    HeaderHomeMainComponent,
    FooterHomeMainComponent,
    //CurrencyPipe
  ],
  templateUrl: './category-products.component.html',
  styleUrls: ['./category-products.component.scss'],
  providers: [DialogService]
})
export class CategoryProductsComponent implements OnInit, OnDestroy {
  categoryName: string = ''; // Esta será la variable que usaremos para el título
  products: ProductCarouselItem[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  ref: DynamicDialogRef | undefined;
  private routeSubscription: Subscription | undefined;
  private modalSubscription: Subscription | undefined;

  constructor(
    private route: ActivatedRoute,
    private imageService: ImageService,
    private dialogService: DialogService
  ) { }

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const categoryId = params.get('categoryId');
      // No necesitamos categoryName de la ruta aquí si lo vamos a obtener de los productos
      // const categoryNameFromRoute = params.get('categoryName');

      // Eliminamos la lógica de formatCategoryName aquí ya que la obtendremos de los datos de producto
      this.categoryName = 'Cargando categoría...'; // Establece un valor provisional

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
    if (this.ref) {
      this.ref.close();
    }
  }

  loadProductsByCategory(categoryId: string): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.products = []; // Limpia productos anteriores

    this.imageService.getProductsByCategoryId(categoryId).subscribe({
      next: data => {
        this.products = data;
        this.isLoading = false;

        // **** LA NUEVA LÓGICA CLAVE AQUÍ ****
        if (this.products && this.products.length > 0) {
          // Asumiendo que cada ProductCarouselItem tiene una propiedad 'category'
          // que contiene el nombre de la categoría (ej. "Electrónica", "Computación").
          // Si tu propiedad es 'nombre_categoria' u otra, ajusta aquí.
          this.categoryName = this.products[0].category; // <--- O product.nombre_categoria, etc.

          // Si el nombre de la categoría aún necesita alguna limpieza (ej. quitar guiones si aún vienen de la base de datos de esa forma),
          // podrías aplicar una función de formato muy simple aquí.
          // Pero si ya vienen perfectos, no es necesario.
        } else {
          this.errorMessage = 'No se encontraron productos para esta categoría.';
          this.categoryName = 'Categoría Desconocida'; // O algún mensaje por defecto
        }
      },
      error: err => {
        console.error('Error al cargar productos por categoría:', err);
        this.errorMessage = 'No se pudieron cargar los productos de esta categoría. Inténtalo de nuevo más tarde.';
        this.isLoading = false;
        this.categoryName = 'Error al cargar categoría'; // Mensaje en caso de error
      }
    });
  }

  // Eliminamos la función formatCategoryName si ya no la necesitamos, o la hacemos muy simple
  // private formatCategoryName(name: string): string {
  //   // Si los nombres vienen perfectos del backend, esta función podría ser mínima
  //   return name; // O simplemente elimina la función si no hay procesamiento extra
  // }

  openProductModal(product: ProductCarouselItem): void {
    this.ref = this.dialogService.open(HomeProductModalComponent, {
      data: {
        product: product
      },
      showHeader: false,
      width: '50vw',
      modal: true,
      closable: true,
      position: 'center'
    });

    this.modalSubscription = this.ref.onClose.subscribe((result: any) => {
      console.log('Modal de producto cerrado. Resultado:', result);
      this.ref = undefined;
    });
  }

  getFullImageUrl(relativeUrl: string | null | undefined): string {
    // Asegúrate de que esta función realmente construye la URL completa de la imagen
    // Si tus imágenes están en /uploads/XXXX.png y tu backend en localhost:3000
    // return `http://localhost:3000${relativeUrl}`;
    return relativeUrl || 'assets/placeholder-product.png';
  }
}