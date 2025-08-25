// sistema-ventas-frontend/src/app/modules/sales/sales.service.ts

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Client, User, Product, Sale, SaleDetail } from './types';

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private apiUrl = environment.backend;

  constructor(private http: HttpClient) { }

  private handleError(error: any): never {
    console.error('Error en servicio de ventas:', error);
    throw error;
  }

  async getSales(queryParams?: any): Promise<any> {
    try {
      const params = queryParams ? { params: queryParams } : {};
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/sales`, params));
      return response.sales || response;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getSale(id: string): Promise<Sale> {
  try {
    const response: any = await firstValueFrom(
      this.http.get(`${this.apiUrl}/sales/${id}`)
    );
    return response as Sale;
  } catch (error: unknown) {
    return this.handleError(error);
  }
}

  async createSale(data: any): Promise<Sale> {
    try {
      const response: any = await firstValueFrom(this.http.post(`${this.apiUrl}/sales`, data));
      return response as Sale;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateSale(id: string, data: any): Promise<Sale> {
    try {
      const response: any = await firstValueFrom(this.http.patch(`${this.apiUrl}/sales/${id}`, data));
      return response as Sale;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteSale(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/sales/${id}`));
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getClients(): Promise<Client[]> {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/clients`));
      return response.clients || [];
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/users`));
      return response.users || [];
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getProducts(): Promise<Product[]> {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.apiUrl}/products`));
      return response.products || [];
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Verificar stock disponible
  async checkStock(productId: string, quantity: number): Promise<boolean> {
    try {
      const products = await this.getProducts();
      const product = products.find(p => p.id_producto === productId);
      return product ? product.stock_actual >= quantity : false;
    } catch (error) {
      console.error('Error verificando stock:', error);
      return false;
    }
  }

  
}