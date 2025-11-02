// src/app/interfaces/product.interface.ts

// Definición de la interfaz ProductCarouselItem para los elementos del carrusel de productos
export interface ProductCarouselItem {
  category: string;
  imagen_url: string; 
  nombre_producto: string;
  descripcion: string;
  price: number;
  id?: string; 
  stock?: number; 
  nombre_categoria: string;

}