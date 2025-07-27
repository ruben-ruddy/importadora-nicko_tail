// src/app/interfaces/product.interface.ts

export interface ProductCarouselItem {
  category: string;
  imagen_url: string; // URL completa de la imagen (ej. http://localhost:3000/uploads/...)
  nombre_producto: string;
  descripcion: string;
  price: number;
  id?: string; // Asegúrate de que este campo exista
  stock?: number; // Asegúrate de que este campo exista
  nombre_categoria: string;
  // Agrega cualquier otra propiedad que tu backend pueda devolver
  // y que quieras mostrar en el modal o en la vista de lista.
}