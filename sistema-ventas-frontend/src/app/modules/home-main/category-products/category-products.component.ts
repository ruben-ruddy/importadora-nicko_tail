import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

// Componentes compartidos en home-main
import { HeaderHomeMainComponent } from '../header-home-main/header-home-main.component'; // Ajusta la ruta si es diferente
import { FooterHomeMainComponent } from '../footer-home-main/footer-home-main.component'; // Ajusta la ruta si es diferente

// Interfaz de Producto
import { Category } from '../../../interfaces/category.interface';
import { ProductCarouselItem } from '../../../interfaces/product.interface'; // Ruta relativa a 'interfaces'

@Component({
  selector: 'app-category-products-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderHomeMainComponent,
    FooterHomeMainComponent,
  ],
  templateUrl: './category-products.component.html',
  styleUrls: ['./category-products.component.scss']
})
export class CategoryProductsPageComponent implements OnInit {
  categoryName: string = '';
  allProducts: ProductCarouselItem[] = []; // Todos los productos simulados
  productsByCategory: ProductCarouselItem[] = []; // Productos filtrados por esta categoría
  searchTerm: string = ''; // Buscador específico para esta página de categoría

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    // Suscribirse a los cambios de parámetros de la URL
    this.route.paramMap.subscribe(params => {
      this.categoryName = params.get('categoryName') || '';
      // Limpia el término de búsqueda al cambiar de categoría
      this.searchTerm = '';
      this.loadAndFilterProductsByCategory();
    });
  }

  // Simular carga de productos. Asegúrate de que tus productos tienen la propiedad 'category'.
  private loadAllProducts(): ProductCarouselItem[] {
    return [
      {  nombre_producto: 'Laptop Gaming X', descripcion: 'Potente laptop para gamers con RTX 4080.', imagen_url: 'https://i.imgur.com/P1i1Y2Q.jpeg', category: 'electronica', price: 1500 }, //
      {  nombre_producto: 'Teclado Mecánico RGB', descripcion: 'Teclado con switches Cherry MX y retroiluminación RGB.', imagen_url: 'https://i.imgur.com/R3x3L4G.jpeg', category: 'electronica', price: 120 }, //
      {  nombre_producto: 'Monitor UltraWide 4K', descripcion: 'Experiencia inmersiva con resolución 4K y ultra gran angular.', imagen_url: 'https://i.imgur.com/W5y5K6J.jpeg', category: 'electronica', price: 800 }, //
      {  nombre_producto: 'Camiseta Deportiva Dry-Fit', descripcion: 'Camiseta transpirable para tus entrenamientos.', imagen_url: 'https://i.imgur.com/Q7z7X8P.jpeg', category: 'ropa y moda', price: 30 }, //
      {  nombre_producto: 'Zapatillas Running Pro', descripcion: 'Amortiguación avanzada para corredores.', imagen_url: 'https://i.imgur.com/S9a9B0C.jpeg', category: 'deportes', price: 90 }, //
      { nombre_producto: 'Sofá Modular Confort', descripcion: 'Sofá adaptable a cualquier espacio.', imagen_url: 'https://i.imgur.com/U1c1D2E.jpeg', category: 'hogar y cocina', price: 700 }, //
      {  nombre_producto: 'Set de Utensilios de Cocina', descripcion: 'Juego completo de acero inoxidable.', imagen_url: 'https://i.imgur.com/V3f3G4H.jpeg', category: 'hogar y cocina', price: 50 }, //
      { nombre_producto: 'Vestido de Noche Elegante', descripcion: 'Diseño exclusivo para ocasiones especiales.', imagen_url: 'https://i.imgur.com/X5j5K6L.jpeg', category: 'ropa y moda', price: 200 }, //
      { nombre_producto: 'Pantalón Vaquero Slim Fit', descripcion: 'Clásico vaquero de corte ajustado.', imagen_url: 'https://i.imgur.com/Y7l7M8N.jpeg', category: 'ropa y moda', price: 60 }, //
      { nombre_producto: 'Aventuras de Tom Sawyer', descripcion: 'Clásico de la literatura juvenil.', imagen_url: 'https://i.imgur.com/Z9o9P0Q.jpeg', category: 'libros', price: 15 } //
    ];
  }

  loadAndFilterProductsByCategory(): void {
    this.allProducts = this.loadAllProducts(); // Carga todos los productos
    const lowerCaseCategory = this.categoryName.toLowerCase();
    this.productsByCategory = this.allProducts.filter(product =>
      product.category && product.category.toLowerCase() === lowerCaseCategory
    );
    this.applySearchFilterToCategoryProducts(); // Aplica el filtro de búsqueda si ya hay un término
  }

  filterProducts(): void {
    this.applySearchFilterToCategoryProducts();
  }

  private applySearchFilterToCategoryProducts(): void {
    const lowerCaseSearchTerm = this.searchTerm.toLowerCase();
    // Filtramos sobre los productos YA filtrados por categoría de `allProducts`
    this.productsByCategory = this.allProducts.filter(product =>
      product.category && product.category.toLowerCase() === this.categoryName.toLowerCase() &&
      product.nombre_producto.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }
}