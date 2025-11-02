// src/app/modules/home/home-categories/home-categories.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Category } from '../../../interfaces/category.interface';

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  private apiUrl = `${environment.backend}/public/categories`;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  //
  private isClient(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  // Construir los encabezados de autorización
  private getAuthHeaders(): HttpHeaders {
    if (!this.isClient()) {
      return new HttpHeaders();
    }

    const token = localStorage.getItem(environment.jwtKey);
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // Obtener todas las categorías
  getCategories(): Observable<Category[]> {
    if (!this.isClient()) {
      return of([]);
    }

    return this.http.get<Category[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  // Obtener una categoría por ID
  getCategoryById(id: string): Observable<Category> {
    if (!this.isClient()) {
      return of({} as Category);
    }

    return this.http.get<Category>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}