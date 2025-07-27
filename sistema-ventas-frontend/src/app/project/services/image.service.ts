// src/app/project/services/image.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { ProductCarouselItem } from '../../interfaces/product.interface'; // Para el carrusel
// Si vas a usar interfaces para la ventana de productos, importarlas aquí
// import { ProductListItem, ProductDetail } from '../../interfaces/product.interface'; // Ejemplo

@Injectable({
  providedIn: 'root'
})
export class ImageService { // Considera renombrar a 'PublicProductsService' si maneja todos los productos

  // URLs hardcodeadas (ya que no quieres modificar environment.ts)
  // URL base para los endpoints de la API (con '/api')
  private apiBaseUrl = 'http://localhost:3000/api'; // Corresponde a environment.backend
  // URL base para servir archivos estáticos (sin '/api')
  private serverBaseUrl = 'http://localhost:3000'; // Corresponde a la baseUrl de tu ProductsService en el backend

  constructor(private http: HttpClient) { }

  // 1. Método para el Carrusel (ya lo tienes, ajustado para usar apiBaseUrl)
  // Endpoint: http://localhost:3000/api/public/products/latest-images
  getLatestProductImages(): Observable<ProductCarouselItem[]> {
    const carouselApiUrl = `${this.apiBaseUrl}/public/products/latest-images`;
    console.log('ImageService (Carousel): Realizando petición a:', carouselApiUrl);

    return this.http.get<ProductCarouselItem[]>(carouselApiUrl).pipe(
      tap(data => console.log('ImageService (Carousel): Datos recibidos (antes de procesar):', data)),
      map(data => {
        const fullImageUrls = data.map(product => ({
          ...product,
          // Prefija con serverBaseUrl, ya que el backend envía la ruta relativa para el carrusel
          imagen_url: `${this.serverBaseUrl}${product.imagen_url}`
        }));
        console.log('ImageService (Carousel): Objetos de producto con URLs de imagen completas:', fullImageUrls);
        return fullImageUrls;
      }),
      catchError(error => {
        console.error('ImageService (Carousel): Error al obtener imágenes:', error);
        return of([]);
      })
    );
  }

  // 2. Método para la Ventana de Productos (todos los productos)
  // Endpoint: http://localhost:3000/api/public/products/all
  getAllPublicProducts(): Observable<ProductCarouselItem[]> { // Tipado a ProductCarouselItem[] si esa es la interfaz que esperas
    const allProductsApiUrl = `${this.apiBaseUrl}/public/products/all`;
    console.log('ImageService (All Products): Realizando petición a:', allProductsApiUrl);

    return this.http.get<ProductCarouselItem[]>(allProductsApiUrl).pipe( // El backend ya debe enviar la URL de imagen completa
      tap(data => console.log('ImageService (All Products): Datos recibidos:', data)),
      catchError(error => {
        console.error('ImageService (All Products): Error al obtener todos los productos:', error);
        return of([]);
      })
    );
  }

  // 3. Método para el Pop-up (detalle de un producto por ID)
  // Endpoint: http://localhost:3000/api/public/products/:id
  getPublicProductDetails(id: string): Observable<ProductCarouselItem | null> { // Tipado
    const productDetailApiUrl = `${this.apiBaseUrl}/public/products/${id}`;
    console.log('ImageService (Product Detail): Realizando petición a:', productDetailApiUrl);

    return this.http.get<ProductCarouselItem>(productDetailApiUrl).pipe( // El backend ya debe enviar la URL de imagen completa
      tap(data => console.log('ImageService (Product Detail): Datos recibidos:', data)),
      catchError(error => {
        console.error(`ImageService (Product Detail): Error al obtener producto con ID ${id}:`, error);
        return of(null); // Retorna null o un objeto vacío en caso de error
      })
    );
  }

  // 4. NUEVO MÉTODO: Obtener productos por ID de categoría
  // Endpoint: http://localhost:3000/api/public/products/category/:categoryId
  // O: http://localhost:3000/api/public/products?categoryId=xxx
  // **Asegúrate de que tu backend tenga uno de estos endpoints para filtrar por categoría**
  getProductsByCategoryId(categoryId: string): Observable<ProductCarouselItem[]> {
    // Usaremos la convención de query parameter como en discusiones anteriores,
    // pero si tu backend usa /category/:id, ajusta esta URL.
    const categoryProductsApiUrl = `${this.apiBaseUrl}/public/products?categoryId=${categoryId}`;
    console.log('ImageService (Products by Category): Realizando petición a:', categoryProductsApiUrl);

    return this.http.get<ProductCarouselItem[]>(categoryProductsApiUrl).pipe(
      tap(data => console.log('ImageService (Products by Category): Datos recibidos:', data)),
      catchError(error => {
        console.error(`ImageService (Products by Category): Error al obtener productos para categoría ${categoryId}:`, error);
        return of([]);
      })
    );
  }
}