import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Category } from '../../../interfaces/category.interface';// Asegúrate de que la ruta sea correcta
import { environment } from '../../../../environments/environment'; // Para la URL base del API

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = `${environment.backend}/categories`; // Ajusta la URL de tu API de categorías

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todas las categorías desde el backend.
   * @returns Un Observable de un array de Category.
   */
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  // Puedes añadir otros métodos como getCategoryById, createCategory, etc.

  private handleError(error: any) {
    console.error('An error occurred:', error);
    // En un caso real, podrías enviar el error a un servicio de loggin remoto
    // o mostrar un mensaje de error al usuario.
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }
}