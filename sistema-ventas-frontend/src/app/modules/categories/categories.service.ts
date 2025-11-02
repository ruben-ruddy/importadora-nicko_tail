// sistema-ventas-frontend/src/app/modules/categories/categories.service.ts
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {

  constructor(private http: HttpClient) { }

        // Obtener la lista de categorías
        getCategory() {
          return firstValueFrom(this.http.get(`${environment.backend}/categories`));
         }
         // Crear una nueva categoría
         createCategory(data:any) {
          return firstValueFrom(this.http.post(`${environment.backend}/categories`, data));
        }
         // Actualizar una categoría existente
         updateCategory(id:string,data:any) {
          return firstValueFrom(this.http.patch(`${environment.backend}/categories/${id}`, data));
        }
}
