// src/app/modules/home/home-categories/home-categories.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment'; // Ajusta la ruta a tu environment
import { Category } from '../../../interfaces/category.interface'; // Ajusta la ruta a tu interfaz Category

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  // Usa environment.backend directamente para las llamadas API con el prefijo /api
  private apiUrl = `${environment.backend}/public/categories`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem(environment.jwtKey); // Usa la key del entorno
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // Este método debe devolver un Observable de Category[]
  getCategories(): Observable<Category[]> { // Mantenemos el nombre getCategories()
    return this.http.get<Category[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  // Si tienes getCategoryById o cualquier otro método, asegúrate de que usen this.apiUrl
  getCategoryById(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}