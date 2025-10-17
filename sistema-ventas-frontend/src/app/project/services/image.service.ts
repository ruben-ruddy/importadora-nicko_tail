// src/app/project/services/image.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { ProductCarouselItem } from '../../interfaces/product.interface';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private apiBaseUrl = 'http://localhost:3000/api';
  private serverBaseUrl = 'http://localhost:3000';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  private isClient(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  getLatestProductImages(): Observable<ProductCarouselItem[]> {
    if (!this.isClient()) {
      return of([]);
    }

    const carouselApiUrl = `${this.apiBaseUrl}/public/products/latest-images`;
    console.log('ImageService (Carousel): Realizando petición a:', carouselApiUrl);

    return this.http.get<ProductCarouselItem[]>(carouselApiUrl).pipe(
      tap(data => console.log('ImageService (Carousel): Datos recibidos (antes de procesar):', data)),
      map(data => {
        const fullImageUrls = data.map(product => ({
          ...product,
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

  getAllPublicProducts(): Observable<ProductCarouselItem[]> {
    if (!this.isClient()) {
      return of([]);
    }

    const allProductsApiUrl = `${this.apiBaseUrl}/public/products/all`;
    console.log('ImageService (All Products): Realizando petición a:', allProductsApiUrl);

    return this.http.get<ProductCarouselItem[]>(allProductsApiUrl).pipe(
      tap(data => console.log('ImageService (All Products): Datos recibidos:', data)),
      catchError(error => {
        console.error('ImageService (All Products): Error al obtener todos los productos:', error);
        return of([]);
      })
    );
  }

  getPublicProductDetails(id: string): Observable<ProductCarouselItem | null> {
    if (!this.isClient()) {
      return of(null);
    }

    const productDetailApiUrl = `${this.apiBaseUrl}/public/products/${id}`;
    console.log('ImageService (Product Detail): Realizando petición a:', productDetailApiUrl);

    return this.http.get<ProductCarouselItem>(productDetailApiUrl).pipe(
      tap(data => console.log('ImageService (Product Detail): Datos recibidos:', data)),
      catchError(error => {
        console.error(`ImageService (Product Detail): Error al obtener producto con ID ${id}:`, error);
        return of(null);
      })
    );
  }

  getProductsByCategoryId(categoryId: string): Observable<ProductCarouselItem[]> {
    if (!this.isClient()) {
      return of([]);
    }

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