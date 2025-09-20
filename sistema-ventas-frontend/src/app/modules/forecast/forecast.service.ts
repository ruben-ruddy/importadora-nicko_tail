// sistema-ventas-frontend/src/app/modules/forecast/forecast.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  ForecastRequest, 
  ForecastResponse, 
  HistoricalData, 
  HistoryQuery, 
  TopSellingDate, 
  TopDatesQuery, 
  TopProduct, 
  ForecastResult
} from './types';

@Injectable({
  providedIn: 'root'
})
export class ForecastService {
  private apiUrl = `${environment.apiUrl}/forecast`;

  constructor(private http: HttpClient) { }

  async getTopProductsByDate(date: string, limit: number = 10): Promise<any[]> {
    try {
      console.log('📦 Buscando productos para fecha:', date);
      
      // Formatear la fecha correctamente
      const formattedDate = encodeURIComponent(date);

      // URL CORREGIDA - sin duplicar /forecast/
      const url = `${this.apiUrl}/top-products/${formattedDate}`;
      console.log('🌐 URL correcta:', url);

      const response: any = await firstValueFrom(
        this.http.get(url, {
          params: { 
            limit: limit.toString()
          }
        })
      );

      console.log('📦 Productos encontrados:', response.length);
      return response;

    } catch (error: any) {
      console.error('❌ Error getting top products by date:', error);
      
      if (error.status === 404) {
        throw new Error('No se encontraron productos para esta fecha.');
      } else if (error.status === 400) {
        throw new Error('Formato de fecha inválido.');
      } else {
        throw new Error('Error de conexión con el servidor.');
      }
    }
  } 

getSalesHistory(query: HistoryQuery): Promise<HistoricalData[]> {
  let params = new HttpParams()
    .set('fecha_inicio', query.fecha_inicio)
    .set('fecha_fin', query.fecha_fin)
    .set('periodo', query.periodo);

  return this.http.get<HistoricalData[]>(`${this.apiUrl}/history`, { params })
    .toPromise()
    .then(res => res ?? []);
}

async generateForecast(request: ForecastRequest): Promise<ForecastResponse> {
  try {
    // Obtener datos históricos
    const historicalData = await this.getSalesHistory({
      fecha_inicio: request.fecha_inicio,
      fecha_fin: request.fecha_fin,
      periodo: request.periodo
    });

    if (historicalData.length === 0) {
      throw new Error('No hay datos históricos para el período seleccionado');
    }

    // Determinar frecuencia para Python
    let frequency: string;
    switch (request.periodo) {
      case 'diario': frequency = 'D'; break;
      case 'semanal': frequency = 'W'; break;
      case 'mensual': frequency = 'M'; break;
      default: frequency = 'D';
    }

    // Llamar al servicio Python
    const pythonServiceUrl = environment.pythonForecastService || 'http://localhost:8000';
    
    const response: any = await firstValueFrom(
      this.http.post(`${pythonServiceUrl}/forecast`, {
        historical_data: historicalData,
        method: 'moving_average',
        periods: request.parametros.periodos,
        frequency: frequency,
        window_size: request.parametros.ventana,
        alpha: request.parametros.alpha
      })
    );

    // Mapear la respuesta
    const results: ForecastResult[] = response.predictions.map((pred: any) => ({
      fecha: pred.fecha,
      ventas_previstas: pred.ventas_previstas,
      intervalo_confianza: pred.intervalo_confianza,
      metrica_precision: response.metrics.accuracy
    }));

    return {
      results,
      metrics: {
        mape: response.metrics.mape,
        mae: response.metrics.mae,
        rmse: response.metrics.rmse || 0,
        accuracy: response.metrics.accuracy
      },
      model_info: response.model_info
    };

  } catch (error) {
    console.error('Error generating forecast:', error);
    throw error;
  }
}
getTopSellingDates(query: TopDatesQuery): Promise<TopSellingDate[]> {
  let params = new HttpParams()
    .set('fecha_inicio', query.fecha_inicio)
    .set('fecha_fin', query.fecha_fin)
    .set('periodo', query.periodo)
    .set('limit', (query.limit ?? 10).toString());

  return this.http.get<TopSellingDate[]>(`${this.apiUrl}/top-dates`, { params })
    .toPromise()
    .then(res => res ?? []);
}

}