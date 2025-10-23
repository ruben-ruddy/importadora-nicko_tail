// sistema-ventas-frontend/src/app/modules/purchase/purchase.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { Purchase } from '../../interfaces/purchase.interface';

export interface PurchaseResponse {
  data: Purchase[];
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

export interface PurchaseQuery {
  page?: number;
  limit?: number;
  search?: string;
  estado?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {

  constructor(private http: HttpClient) { }

  private extractArrayData(response: any): any[] {
    if (Array.isArray(response)) {
      return response;
    }
    
    if (response && Array.isArray(response.data)) {
      return response.data;
    }
    
    if (response && Array.isArray(response.users)) {
      return response.users;
    }
    
    if (response && Array.isArray(response.products)) {
      return response.products;
    }
    
    if (response && Array.isArray(response.purchases)) {
      return response.purchases;
    }
    
    return [];
  }

  async getPurchases(query: PurchaseQuery = {}): Promise<PurchaseResponse> {
    try {
      let params = new HttpParams();
      
      if (query.page) params = params.set('page', query.page.toString());
      if (query.limit) params = params.set('limit', query.limit.toString());
      
      if (query.search) params = params.set('numero_compra', query.search);
      
      if (query.estado) params = params.set('estado', query.estado);
      if (query.startDate) params = params.set('startDate', query.startDate);
      if (query.endDate) params = params.set('endDate', query.endDate);

      console.log('Parámetros enviados al backend:', {
        page: query.page?.toString(),
        limit: query.limit?.toString(),
        numero_compra: query.search,
        estado: query.estado
      });

      const response = await firstValueFrom(
        this.http.get<PurchaseResponse>(`${environment.backend}/purchases`, { params })
      );
      return response;
    } catch (error) {
      console.error('Error fetching purchases:', error);
      return { data: [], total: 0, page: 1, limit: 10, lastPage: 1 };
    }
  }

  async getPurchaseById(id: string): Promise<Purchase> {
    try {
      const response = await firstValueFrom(
        this.http.get<Purchase>(`${environment.backend}/purchases/${id}`)
      );
      console.log('Compra cargada por ID:', response);
      return response;
    } catch (error) {
      console.error('Error fetching purchase:', error);
      throw error;
    }
  }

  async getUsers(): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<any[]>(`${environment.backend}/users`)
      );
      return this.extractArrayData(response);
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async getProducts(): Promise<any[]> {
    try {
      // CORREGIDO: Quitar paginación para obtener TODOS los productos
      const response = await firstValueFrom(
        this.http.get<any>(`${environment.backend}/products?limit=1000`)
      );
      
      const products = this.extractArrayData(response);
      console.log('✅ Productos cargados:', products.length);
      
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  async createPurchase(data: Purchase): Promise<Purchase> {
    // Asegurarse de que no se envíe fecha_compra
    const { fecha_compra, ...purchaseData } = data;
    return firstValueFrom(
      this.http.post<Purchase>(`${environment.backend}/purchases`, purchaseData)
    );
  }

  async updatePurchase(id: string, data: Purchase): Promise<Purchase> {
    // Asegurarse de que no se envíe fecha_compra en updates
    const { fecha_compra, id_compra, ...purchaseData } = data;
    return firstValueFrom(
      this.http.patch<Purchase>(`${environment.backend}/purchases/${id}`, purchaseData)
    );
  }

  deletePurchase(id: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${environment.backend}/purchases/${id}`)
    );
  }
}