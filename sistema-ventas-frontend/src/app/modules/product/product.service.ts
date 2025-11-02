//sistema-ventas-frontend/src/app/modules/product/product.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GeneralService } from '../../core/gerneral.service';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(
    private http: HttpClient,
    private generalService: GeneralService
  ) { }

  // Obtener la lista de productos con parámetros de consulta opcionales
  getProducts(queryParams?: any) {
    let params = new HttpParams();
    
    if (queryParams) {
      Object.keys(queryParams).forEach(key => {
        params = params.set(key, queryParams[key]);
      });
    }
    
    return firstValueFrom(this.http.get(`${environment.backend}/products`, { params }));
  }

  // Crear un nuevo producto
  createProducts(data: any) {
    return firstValueFrom(this.http.post(`${environment.backend}/products`, data));
  }

  // Actualizar un producto existente
  updateProducts(id: string, data: any) {
    return firstValueFrom(this.http.patch(`${environment.backend}/products/${id}`, data));
  }

  // Obtener la lista de categorías
  getCategories() {
    return firstValueFrom(this.http.get(`${environment.backend}/categories`));
  }
}