// src/app/services/image.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProductCarouselItem } from '../../interfaces/product.interface'; // <-- ¡Importa la nueva interfaz!

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  
  private apiUrl = 'http://localhost:3000/api/public/products/latest-images'; 
  private serverBaseUrl = 'http://localhost:3000'; 

  constructor(private http: HttpClient) { }

  // Cambia el tipo de retorno a Observable<ProductCarouselItem[]>
  getLatestProductImages(): Observable<ProductCarouselItem[]> {
    console.log('ImageService: Realizando petición a:', this.apiUrl);
    // Cambia el tipo genérico de get a ProductCarouselItem[]
    return this.http.get<ProductCarouselItem[]>(this.apiUrl).pipe(
      tap(data => console.log('ImageService: Datos recibidos (antes de procesar):', data)),
      map(data => {
        // Mapea cada objeto para prefijar la imagen_url y asegurar el tipo
        const fullImageUrls = data.map(product => ({
          ...product, // Copia todas las propiedades del producto
          imagen_url: `${this.serverBaseUrl}${product.imagen_url}` // Actualiza la URL de la imagen
        }));
        console.log('ImageService: Objetos de producto con URLs de imagen completas:', fullImageUrls);
        return fullImageUrls;
      }),
      catchError(error => {
        console.error('ImageService: Error al obtener imágenes:', error);
        return of([]);
      })
    );
  }
}