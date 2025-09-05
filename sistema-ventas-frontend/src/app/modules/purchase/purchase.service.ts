// purchase.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { Purchase } from '../../interfaces/purchase.interface';
import { ApiResponse, UsersResponse, ProductsResponse, PurchasesResponse } from '../../interfaces/api-response.interface';

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {

  constructor(private http: HttpClient) { }

private extractArrayData(response: any): any[] {
  // Siempre devolver un array, nunca undefined
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
  
  // Si no coincide con ninguna estructura conocida, devolver array vacío
  return [];
}

  async getPurchases(): Promise<Purchase[]> {
    try {
      const response: any = await firstValueFrom(
        this.http.get<PurchasesResponse | Purchase[]>(`${environment.backend}/purchases`)
      );
      return this.extractArrayData(response);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      return [];
    }
  }

  async getPurchaseById(id: string): Promise<Purchase> {
    try {
      const response = await firstValueFrom(
        this.http.get<Purchase>(`${environment.backend}/purchases/${id}`)
      );
      return response;
    } catch (error) {
      console.error('Error fetching purchase:', error);
      throw error;
    }
  }

  async getUsers(): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<UsersResponse | any[]>(`${environment.backend}/users`)
      );
      return this.extractArrayData(response);
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async getProducts(): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<ProductsResponse | any[]>(`${environment.backend}/products`)
      );
      return this.extractArrayData(response);
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
  const { fecha_compra, ...purchaseData } = data;
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