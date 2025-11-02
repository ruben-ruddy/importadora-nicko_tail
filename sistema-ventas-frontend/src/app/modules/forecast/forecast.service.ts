// sistema-ventas-frontend/src/app/modules/forecast/forecast.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  ForecastRequest, 
  ForecastResponse, 
  HistoricalData, 
  HistoryQuery, 
  TopSellingDate, 
  TopDatesQuery, 
  TopProduct 
} from './types';

@Injectable({
  providedIn: 'root'
})
export class ForecastService {
  private apiUrl = `${environment.apiUrl}/forecast`;

  constructor(private http: HttpClient) { }

  // Obtener el historial de ventas para el pronóstico
  async getSalesHistory(query: HistoryQuery): Promise<HistoricalData[]> {
    try {
      let params = new HttpParams()
        .set('fecha_inicio', query.fecha_inicio)
        .set('fecha_fin', query.fecha_fin)
        .set('periodo', query.periodo);

      const response = await firstValueFrom(
        this.http.get<HistoricalData[]>(`${this.apiUrl}/history`, { params })
      );

      return response || [];
    } catch (error: any) {
      console.error('Error getting sales history:', error);
      throw this.handleServiceError(error, 'obtener el historial de ventas');
    }
  }

  // Generar el pronóstico de ventas basado en los datos históricos
  async generateForecast(request: ForecastRequest): Promise<ForecastResponse> {
    try {
      const response = await firstValueFrom(
        this.http.post<ForecastResponse>(`${this.apiUrl}`, request)
      );

      return response;
    } catch (error: any) {
      console.error('Error generating forecast:', error);
      throw this.handleServiceError(error, 'generar el pronóstico');
    }
  }

  async getTopSellingDates(query: TopDatesQuery): Promise<TopSellingDate[]> {
    try {
      let params = new HttpParams()
        .set('fecha_inicio', query.fecha_inicio)
        .set('fecha_fin', query.fecha_fin)
        .set('periodo', query.periodo)
        .set('limit', (query.limit ?? 10).toString());

      const response = await firstValueFrom(
        this.http.get<TopSellingDate[]>(`${this.apiUrl}/top-dates`, { params })
      );

      return response || [];
    } catch (error: any) {
      console.error('Error getting top selling dates:', error);
      throw this.handleServiceError(error, 'obtener los meses con mayores ventas');
    }
  }

  // Obtener los productos más vendidos en una fecha específica
  async getTopProductsByDate(date: string, limit: number = 10): Promise<TopProduct[]> {
    try {
      const formattedDate = encodeURIComponent(date);

      const response = await firstValueFrom(
        this.http.get<TopProduct[]>(`${this.apiUrl}/top-products/${formattedDate}`, {
          params: { limit: limit.toString() }
        })
      );

      return response || [];
    } catch (error: any) {
      console.error('Error getting top products by date:', error);
      throw this.handleServiceError(error, 'obtener los productos del mes');
    }
  }

  // Manejar errores del servicio de manera centralizada
  private handleServiceError(error: any, action: string): Error {
    if (error.status === 404) {
      return new Error(`No se encontraron datos para ${action}`);
    } else if (error.status === 400) {
      const message = error.error?.message || error.message || 'Datos de entrada inválidos';
      return new Error(message);
    } else if (error.status === 500) {
      return new Error('Error interno del servidor. Por favor, contacte al administrador.');
    } else if (error.status === 0) {
      return new Error('Error de conexión. Verifique su conexión a internet e intente nuevamente.');
    } else {
      return new Error(error.message || `Error al ${action}`);
    }
  }
}