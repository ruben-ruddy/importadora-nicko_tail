// // sistema-ventas-frontend/src/app/modules/forecast/forecast.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ForecastRequest, ForecastResult, HistoricalData } from './types';

@Injectable({
  providedIn: 'root'
})
export class ForecastService {
  private apiUrl = environment.backend;

  constructor(private http: HttpClient) { }

  async getSalesHistory(params: any): Promise<HistoricalData[]> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}/forecast/history`, { params })
      );
      return response.data || response;
    } catch (error) {
      console.error('Error getting sales history:', error);
      throw error;
    }
  }

  async generateForecast(request: ForecastRequest): Promise<ForecastResult[]> {
    try {
      const response: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/forecast`, request)
      );
      return response.data || response;
    } catch (error) {
      console.error('Error generating forecast:', error);
      throw error;
    }
  }

  async getProducts(): Promise<any[]> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}/products`)
      );
      return response.products || response;
    } catch (error) {
      console.error('Error getting products:', error);
      throw error;
    }
  }

  async getCategories(): Promise<any[]> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}/categories`)
      );
      return response.categories || response;
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }

  // Métodos locales para pronósticos simples (fallback)
  static linearRegressionForecast(data: number[], periods: number): number[] {
    const n = data.length;
    const x: number[] = Array.from({ length: n }, (_, i) => i + 1);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = data.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum: number, val: number, idx: number) => sum + val * data[idx], 0);
    const sumX2 = x.reduce((sum: number, val: number) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const predictions: number[] = [];
    for (let i = 1; i <= periods; i++) {
      predictions.push(intercept + slope * (n + i));
    }
    
    return predictions;
  }

  static movingAverageForecast(data: number[], periods: number, alpha: number = 0.3): number[] {
    const predictions: number[] = [];
    const forecastData: number[] = [...data];
    
    for (let i = 0; i < periods; i++) {
      const window: number[] = forecastData.slice(-3);
      const average = window.reduce((a, b) => a + b, 0) / window.length;
      const smoothedPrediction = alpha * average + (1 - alpha) * (forecastData[forecastData.length - 1] || average);
      
      predictions.push(smoothedPrediction);
      forecastData.push(smoothedPrediction);
    }
    
    return predictions;
  }

  // forecast.service.ts - Métodos adicionales

async getTopSellingDates(params: any): Promise<any[]> {
  try {
    console.log('Enviando parámetros al backend:', params);
    
    const response: any = await firstValueFrom(
      this.http.get(`${this.apiUrl}/forecast/top-dates`, { 
        params: this.sanitizeParams(params) 
      })
    );
    
    console.log('Respuesta del backend:', response);
    return response.data || response;
  } catch (error: any) {
    console.error('Error completo en getTopSellingDates:', error);
    if (error.response) {
      console.error('Respuesta de error:', error.response.data);
    }
    throw error;
  }
}

private sanitizeParams(params: any): any {
  // Asegurarse de que los parámetros sean strings
  const sanitized: any = {};
  for (const key in params) {
    if (params[key] !== null && params[key] !== undefined) {
      sanitized[key] = params[key].toString();
    }
  }
  return sanitized;
}

async getTopProductsByDate(date: string, limit: number = 10): Promise<any[]> {
  try {
    const response: any = await firstValueFrom(
      this.http.get(`${this.apiUrl}/forecast/top-products/${date}`, { 
        params: { limit: limit.toString() } 
      })
    );
    return response.data || response;
  } catch (error) {
    console.error('Error getting top products by date:', error);
    throw error;
  }
}


}