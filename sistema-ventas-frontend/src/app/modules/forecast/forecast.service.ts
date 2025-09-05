// sistema-ventas-frontend/src/app/modules/forecast/forecast.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ForecastRequest, ForecastResponse, ForecastResult, HistoricalData, ForecastMetrics, ModelInfo } from './types';

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

  async generateForecast(request: ForecastRequest): Promise<ForecastResponse> {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/forecast`, request)
      );

      // Asegurar que la respuesta tenga el formato correcto
      return this.normalizeForecastResponse(response);
    } catch (error) {
      console.error('Error generating forecast:', error);

      // Fallback a métodos locales si el servidor falla
      return this.generateLocalForecast(request);
    }
  }

  private normalizeForecastResponse(response: any): ForecastResponse {
    // Crear objeto de respuesta básico
    const forecastResponse: ForecastResponse = {
      results: [],
      metrics: {
        mape: 0,
        mae: 0,
        rmse: 0,
        accuracy: 0
      }
    };

    // Si la respuesta ya está en el formato correcto
    if (response.results && response.metrics) {
      forecastResponse.results = response.results;
      forecastResponse.metrics = this.normalizeMetrics(response.metrics);
      if (response.model_info) {
        forecastResponse.model_info = response.model_info;
      }
      return forecastResponse;
    }

    // Si la respuesta viene en formato diferente (ej: data.results, data.metrics)
    if (response.data && response.data.results) {
      forecastResponse.results = response.data.results;
      forecastResponse.metrics = this.normalizeMetrics(response.data.metrics || {});
      if (response.data.model_info) {
        forecastResponse.model_info = response.data.model_info;
      }
      return forecastResponse;
    }

    // Fallback: devolver respuesta básica
    return forecastResponse;
  }

  private normalizeMetrics(metrics: any): ForecastMetrics {
    return {
      mape: metrics.mape || 0,
      mae: metrics.mae || 0,
      rmse: metrics.rmse || 0,
      accuracy: metrics.accuracy || 0,
      r2_score: metrics.r2_score,
      totalSales: metrics.totalSales,
      averageSales: metrics.averageSales,
      growthRate: metrics.growthRate,
      periods: metrics.periods
    };
  }

  private async generateLocalForecast(request: ForecastRequest): Promise<ForecastResponse> {
    try {
      // Obtener datos históricos para el fallback local
      const historicalData = await this.getSalesHistory({
        fecha_inicio: request.fecha_inicio,
        fecha_fin: request.fecha_fin,
        periodo: request.periodo
      });

      if (historicalData.length === 0) {
        throw new Error('No hay datos históricos para el período seleccionado');
      }

      const salesValues = historicalData.map(item => item.ventas);
      let predictions: number[] = [];
      let confidenceIntervals: { inferior: number; superior: number }[] = [];
      let accuracy = 0;
      let modelInfo: ModelInfo | null = null;

      switch (request.metodo) {
        case 'lineal':
          const linearResult = ForecastService.linearRegressionForecast(salesValues, request.parametros?.periodos || 6);
          predictions = linearResult.predictions;
          confidenceIntervals = linearResult.confidenceIntervals;
          accuracy = linearResult.accuracy;
          modelInfo = {
            type: 'typescript_fallback',
            r2_score: linearResult.rSquared
          };
          break;

        case 'promedio_movil':
          const maResult = ForecastService.movingAverageForecast(
            salesValues,
            request.parametros?.periodos || 6,
            request.parametros?.alpha || 0.3
          );
          predictions = maResult.predictions;
          confidenceIntervals = maResult.confidenceIntervals;
          accuracy = maResult.accuracy;
          modelInfo = {
            type: 'typescript_fallback',
            alpha: request.parametros?.alpha || 0.3
          };
          break;

        case 'estacional':
          const seasonalResult = ForecastService.seasonalForecast(
            salesValues,
            request.parametros?.periodos || 6,
            request.parametros?.estacionalidad || 12
          );
          predictions = seasonalResult.predictions;
          confidenceIntervals = seasonalResult.confidenceIntervals;
          accuracy = seasonalResult.accuracy;
          modelInfo = {
            type: 'typescript_fallback',
            seasonality: request.parametros?.estacionalidad || 12
          };
          break;

        default:
          throw new Error('Método de pronóstico no válido');
      }

      // Generar resultados
      const results: ForecastResult[] = this.generateForecastResults(
        predictions,
        confidenceIntervals,
        accuracy,
        salesValues,
        request.periodo
      );

      // Calcular métricas
      const metrics = this.calculateForecastMetrics(salesValues, predictions);

      // Crear respuesta
      const response: ForecastResponse = {
        results,
        metrics
      };

      // Añadir model_info solo si existe
      if (modelInfo) {
        response.model_info = modelInfo;
      }

      return response;

    } catch (error) {
      console.error('Error en forecast local:', error);
      throw error;
    }
  }

  private generateForecastResults(
    predictions: number[],
    confidenceIntervals: { inferior: number; superior: number }[],
    accuracy: number,
    historicalData: number[],
    periodo: string
  ): ForecastResult[] {
    const results: ForecastResult[] = [];
    const lastDate = new Date();

    for (let i = 0; i < predictions.length; i++) {
      const prediction = predictions[i];
      let errorPorcentual: number | undefined;
      let ventasReales: number | undefined;

      // Calcular error comparando con datos históricos si están disponibles
      if (i < historicalData.length) {
        const historicalIndex = historicalData.length - i - 1;
        if (historicalIndex >= 0) {
          ventasReales = historicalData[historicalIndex];
          errorPorcentual = this.calculateErrorPercentage(ventasReales, prediction);
        }
      }

      // Calcular fecha futura
      const fecha = this.getFutureDate(lastDate, i + 1, periodo);

      results.push({
        fecha,
        ventas_previstas: prediction,
        ventas_reales: ventasReales,
        error_porcentual: errorPorcentual,
        intervalo_confianza: confidenceIntervals[i] || { inferior: prediction * 0.8, superior: prediction * 1.2 },
        metrica_precision: accuracy - (i * 0.5)
      });
    }

    return results;
  }

  private calculateErrorPercentage(actual: number, predicted: number): number {
    if (actual === 0) return predicted === 0 ? 0 : 100;
    return Number((Math.abs((actual - predicted) / actual) * 100).toFixed(2));
  }

  private calculateForecastMetrics(actualData: number[], predictedData: number[]): ForecastMetrics {
    if (actualData.length === 0 || predictedData.length === 0) {
      return {
        mape: 0,
        mae: 0,
        rmse: 0,
        accuracy: 0
      };
    }

    let totalError = 0;
    let totalAbsoluteError = 0;
    let totalSquaredError = 0;
    let count = 0;

    for (let i = 0; i < Math.min(actualData.length, predictedData.length); i++) {
      const actual = actualData[actualData.length - i - 1];
      const predicted = predictedData[i];

      if (actual > 0) {
        const error = Math.abs(actual - predicted);
        const percentageError = (error / actual) * 100;

        totalError += percentageError;
        totalAbsoluteError += error;
        totalSquaredError += error * error;
        count++;
      }
    }

    const mape = count > 0 ? totalError / count : 0;
    const mae = count > 0 ? totalAbsoluteError / count : 0;
    const rmse = count > 0 ? Math.sqrt(totalSquaredError / count) : 0;
    const accuracy = Math.max(0, 100 - mape);

    return {
      mape: Number(mape.toFixed(2)),
      mae: Number(mae.toFixed(2)),
      rmse: Number(rmse.toFixed(2)),
      accuracy: Number(accuracy.toFixed(2))
    };
  }

  private getFutureDate(baseDate: Date, offset: number, periodo: string): string {
    const date = new Date(baseDate);

    switch (periodo) {
      case 'diario':
        date.setDate(date.getDate() + offset);
        break;
      case 'semanal':
        date.setDate(date.getDate() + (offset * 7));
        break;
      case 'mensual':
        date.setMonth(date.getMonth() + offset);
        break;
    }

    return date.toISOString().split('T')[0];
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

  static linearRegressionForecast(data: number[], periods: number): { predictions: number[], confidenceIntervals: { inferior: number; superior: number }[], accuracy: number, rSquared: number } {
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

    const yMean = sumY / n;
    const ssTot = data.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const ssRes = data.reduce((sum, val, idx) => sum + Math.pow(val - (intercept + slope * x[idx]), 2), 0);
    const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;

    const confidenceIntervals = predictions.map(pred => ({
      inferior: pred * 0.9,
      superior: pred * 1.1
    }));

    const accuracy = rSquared * 100;

    return { predictions, confidenceIntervals, accuracy, rSquared };
  }

  static movingAverageForecast(data: number[], periods: number, alpha: number = 0.3): { predictions: number[], confidenceIntervals: { inferior: number; superior: number }[], accuracy: number } {
    const predictions: number[] = [];
    const forecastData: number[] = [...data];

    for (let i = 0; i < periods; i++) {
      const window: number[] = forecastData.slice(-3);
      const average = window.reduce((a, b) => a + b, 0) / window.length;
      const smoothedPrediction = alpha * average + (1 - alpha) * (forecastData[forecastData.length - 1] || average);

      predictions.push(smoothedPrediction);
      forecastData.push(smoothedPrediction);
    }

    const confidenceIntervals = predictions.map(pred => ({
      inferior: pred * 0.9,
      superior: pred * 1.1
    }));

    let accuracy = 85;
    if (data.length > 5) {
      const valSize = Math.min(5, data.length - 1);
      const actuals = data.slice(-valSize);
      const preds = predictions.slice(0, valSize);

      if (actuals.length === preds.length) {
        const totalError = actuals.reduce((sum, actual, idx) => {
          return sum + Math.abs(actual - preds[idx]) / actual;
        }, 0);
        accuracy = Math.max(0, 100 - (totalError / valSize * 100));
      }
    }

    return { predictions, confidenceIntervals, accuracy };
  }

  static seasonalForecast(data: number[], periods: number, seasonality: number): { predictions: number[], confidenceIntervals: { inferior: number; superior: number }[], accuracy: number } {
    const predictions: number[] = [];

    const seasonalAverages = new Array(seasonality).fill(0).map((_, i) => {
      const values = data.filter((_, idx) => (idx + 1) % seasonality === (i + 1) % seasonality);
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    });

    for (let i = 0; i < periods; i++) {
      predictions.push(seasonalAverages[(data.length + i) % seasonality]);
    }

    const confidenceIntervals = predictions.map(pred => ({
      inferior: pred * 0.8,
      superior: pred * 1.2
    }));

    const accuracy = 80;

    return { predictions, confidenceIntervals, accuracy };
  }

  async getTopSellingDates(params: any): Promise<any[]> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}/forecast/top-dates`, {
          params: this.sanitizeParams(params)
        })
      );
      return response.data || response;
    } catch (error: any) {
      console.error('Error en getTopSellingDates:', error);
      throw error;
    }
  }

  private sanitizeParams(params: any): any {
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