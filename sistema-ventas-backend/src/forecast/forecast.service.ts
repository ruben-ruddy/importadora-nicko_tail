import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ForecastRequestDto } from './dto/forecast-request.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { ForecastResponse, ForecastResult, HistoricalData, TopProduct, TopSellingDate } from './interfaces/forecast.interface';
import { TopDatesQueryDto } from './dto/top-dates-query.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class ForecastService {
  constructor(
    private prisma: PrismaService,
    private readonly httpService: HttpService,
    private configService: ConfigService
  ) {}
// Obtener historial de ventas mensual
  async getSalesHistory(query: HistoryQueryDto): Promise<HistoricalData[]> {
    try {
      const { fecha_inicio, fecha_fin, periodo } = query;
      
      // Validar que el período sea mensual
      if (periodo !== 'mensual') {
        throw new BadRequestException('Solo se permite el análisis mensual');
      }

      // Validar fechas
      const startDate = new Date(fecha_inicio);
      const endDate = new Date(fecha_fin);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestException('Las fechas proporcionadas no son válidas');
      }
      
      if (startDate > endDate) {
        throw new BadRequestException('La fecha de inicio no puede ser mayor que la fecha de fin');
      }

      // Obtener ventas del período
      const sales = await this.prisma.sale.findMany({
        where: {
          fecha_venta: {
            gte: startDate,
            lte: endDate,
          },
          estado: 'completada',
        },
        include: {
          detalle_ventas: {
            include: {
              producto: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
        orderBy: {
          fecha_venta: 'asc',
        },
      });

      return this.processHistoricalData(sales, periodo);
    } catch (error) {
      console.error('Error getting sales history:', error);
      throw error;
    }
  }
// Procesar datos históricos para agrupar por mes
  private processHistoricalData(sales: any[], periodo: string): HistoricalData[] {
    const groupedData: { [key: string]: number } = {};

    sales.forEach(sale => {
      sale.detalle_ventas.forEach(detalle => {
        const fechaKey = this.getDateKey(sale.fecha_venta, periodo);
        const ventaActual = detalle.subtotal?.toNumber() ?? 0;
        groupedData[fechaKey] = (groupedData[fechaKey] || 0) + ventaActual;
      });
    });

    // Convertir a array y ordenar
    return Object.entries(groupedData)
      .map(([fecha, ventas]) => ({ fecha, ventas }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }
// Obtener clave de fecha según el período
  private getDateKey(date: Date, periodo: string): string {
    const d = new Date(date);
    return d.toISOString().substring(0, 7); // YYYY-MM (solo mensual)
  }
// Generar pronóstico de ventas
  async generateForecast(forecastRequest: ForecastRequestDto): Promise<ForecastResponse> {
    try {
      const { fecha_inicio, fecha_fin, parametros } = forecastRequest;

      // Validar parámetros
      if (parametros.periodos < 1 || parametros.periodos > 12) {
        throw new BadRequestException('Los períodos a pronosticar deben estar entre 1 y 12 meses');
      }

      if (parametros.ventana < 2 || parametros.ventana > 6) {
        throw new BadRequestException('El tamaño de ventana debe estar entre 2 y 6 meses');
      }

      if (parametros.alpha < 0.1 || parametros.alpha > 1.0) {
        throw new BadRequestException('El factor de suavizado debe estar entre 0.1 y 1.0');
      }

      // Obtener datos históricos
      const historicalData = await this.getSalesHistory({
        fecha_inicio,
        fecha_fin,
        periodo: 'mensual',
      });

      if (historicalData.length === 0) {
        throw new NotFoundException('No se encontraron datos de ventas para el período seleccionado');
      }

      if (historicalData.length < parametros.ventana) {
        throw new BadRequestException(`Se necesitan al menos ${parametros.ventana} meses de datos históricos para el análisis`);
      }
      const pythonServiceUrl = this.configService.get('PYTHON_FORECAST_SERVICE') || 'http://localhost:8000';
      
      const response = await firstValueFrom(
        this.httpService.post(`${pythonServiceUrl}/forecast`, {
          historical_data: historicalData,
          method: 'moving_average',
          periods: parametros.periodos,
          frequency: 'M',
          window_size: parametros.ventana,
          alpha: parametros.alpha
        })
      );

      // Mapear la respuesta
      const results: ForecastResult[] = (response.data as any).predictions.map((pred: any) => ({
        fecha: pred.fecha,
        ventas_previstas: pred.ventas_previstas,
        intervalo_confianza: pred.intervalo_confianza,
        metrica_precision: pred.metrica_precision
      }));

      return {
        results,
        metrics: {
          mape: (response.data as any).metrics.mape,
          mae: (response.data as any).metrics.mae,
          rmse: (response.data as any).metrics.rmse || 0,
          accuracy: (response.data as any).metrics.accuracy
        },
        model_info: (response.data as any).model_info
      };

    } catch (error) {
      console.error('Error generating forecast:', error);
      if (error.response?.status === 500 || error.code === 'ECONNREFUSED') {
        return await this.localMovingAverageForecast(forecastRequest);
      }
      
      throw error;
    }
  }

  // Pronóstico local de promedio móvil como respaldo
  private async localMovingAverageForecast(forecastRequest: ForecastRequestDto): Promise<ForecastResponse> {
    const historicalData = await this.getSalesHistory({
      fecha_inicio: forecastRequest.fecha_inicio,
      fecha_fin: forecastRequest.fecha_fin,
      periodo: 'mensual',
    });

    const salesValues = historicalData.map(item => item.ventas);
    const { results, predictions } = this.calculateMovingAverage(
      salesValues,
      forecastRequest.parametros.periodos,
      forecastRequest.parametros.ventana,
      forecastRequest.parametros.alpha
    );

    const metrics = this.calculateForecastAccuracy(salesValues, predictions);

    return {
      results,
      metrics,
      model_info: {
        type: 'moving_average_local',
        window_size: forecastRequest.parametros.ventana,
        alpha: forecastRequest.parametros.alpha
      }
    };
  }
 // Cálculo de promedio móvil con suavizado exponencial
  private calculateMovingAverage(
    data: number[], 
    periods: number, 
    windowSize: number, 
    alpha: number
  ): { results: ForecastResult[]; predictions: number[] } {
    const results: ForecastResult[] = [];
    const predictions: number[] = [];
    const forecastData = [...data];
    const lastDate = new Date(forecastData.length > 0 ? 
      new Date().setMonth(new Date().getMonth() - 1) : new Date().getTime());

    for (let i = 0; i < periods; i++) {
      const window = forecastData.slice(-windowSize);
      const average = window.reduce((sum, val) => sum + val, 0) / window.length;
      
      // Suavizado exponencial
      const smoothedPrediction = alpha * average + (1 - alpha) * (forecastData[forecastData.length - 1] || average);
      predictions.push(smoothedPrediction);
      
      // Calcular intervalo de confianza
      const confidenceInterval = this.calculateConfidenceInterval(smoothedPrediction, data);
      
      // Calcular fecha del próximo mes
      const nextDate = new Date(lastDate);
      nextDate.setMonth(nextDate.getMonth() + i + 1);
      const fecha = nextDate.toISOString().substring(0, 7);

      // Calcular precisión decreciente
      const baseAccuracy = 85; // Precisión base estimada
      const monthlyPrecision = this.calculateMonthlyPrecision(baseAccuracy, i);

      results.push({
        fecha,
        ventas_previstas: smoothedPrediction,
        intervalo_confianza: confidenceInterval,
        metrica_precision: monthlyPrecision
      });

      forecastData.push(smoothedPrediction);
    }

    return { results, predictions };
  }
// Calcular intervalo de confianza
  private calculateConfidenceInterval(prediction: number, historicalData: number[]) {
    const stdDev = this.calculateStandardDeviation(historicalData);
    const marginOfError = 1.96 * stdDev;
    
    return {
      inferior: Math.max(0, prediction - marginOfError),
      superior: prediction + marginOfError
    };
  }
// Calcular desviación estándar
  private calculateStandardDeviation(data: number[]): number {
    if (data.length === 0) return 0;
    
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const squaredDiffs = data.map(value => Math.pow(value - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
    return Math.sqrt(variance);
  }
// Calcular precisión mensual decreciente
  private calculateMonthlyPrecision(baseAccuracy: number, monthIndex: number): number {
    // La precisión disminuye 3% cada mes futuro
    const precision = baseAccuracy * Math.pow(0.97, monthIndex);
    return Math.max(30, Math.min(baseAccuracy, precision)); // Límites: 30% - baseAccuracy
  }
// Calcular métricas de precisión del pronóstico
  private calculateForecastAccuracy(historicalData: number[], predictions: number[]): {
    mape: number;
    mae: number;
    rmse: number;
    accuracy: number;
  } {
    if (historicalData.length < 3 || predictions.length < 3) {
      return { mape: 0, mae: 0, rmse: 0, accuracy: 0 };
    }

    // Usar los últimos 3 meses para validación
    const actualRecent = historicalData.slice(-3);
    const predictedRecent = predictions.slice(0, 3);

    let totalError = 0;
    let totalAbsoluteError = 0;
    let totalSquaredError = 0;
    let count = 0;

    for (let i = 0; i < actualRecent.length; i++) {
      const actual = actualRecent[i];
      const predicted = predictedRecent[i];
      
      if (actual > 0) {
        const error = Math.abs(actual - predicted);
        const percentageError = (error / actual) * 100;
        
        totalError += Math.min(percentageError, 100); // Máximo 100% de error
        totalAbsoluteError += error;
        totalSquaredError += error * error;
        count++;
      }
    }

    if (count === 0) return { mape: 0, mae: 0, rmse: 0, accuracy: 0 };

    const mape = totalError / count;
    const mae = totalAbsoluteError / count;
    const rmse = Math.sqrt(totalSquaredError / count);
    const accuracy = Math.max(0, 100 - mape);

    return { mape, mae, rmse, accuracy };
  }
  // Obtener meses con mayores ventas
  async getTopSellingDates(query: TopDatesQueryDto): Promise<TopSellingDate[]> {
    try {
      const { fecha_inicio, fecha_fin, limit = 10 } = query;

      const startDate = new Date(fecha_inicio);
      const endDate = new Date(fecha_fin);

      const sales = await this.prisma.sale.findMany({
        where: {
          fecha_venta: {
            gte: startDate,
            lte: endDate,
          },
          estado: 'completada',
        },
        include: {
          detalle_ventas: {
            include: {
              producto: true,
            },
          },
        },
      });

      if (sales.length === 0) {
        return [];
      }

      const groupedSales = this.groupSalesByMonth(sales);
      return groupedSales
        .sort((a, b) => b.total_ventas - a.total_ventas)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top selling dates:', error);
      throw new Error(`Error al obtener fechas con mayores ventas: ${error.message}`);
    }
  }

  private groupSalesByMonth(sales: any[]): TopSellingDate[] {
    const groupedData: { [key: string]: { total_ventas: number, cantidad_transacciones: number, cantidad_productos: number } } = {};

    sales.forEach(sale => {
      const monthKey = sale.fecha_venta.toISOString().substring(0, 7);
      
      if (!groupedData[monthKey]) {
        groupedData[monthKey] = {
          total_ventas: 0,
          cantidad_transacciones: 0,
          cantidad_productos: 0
        };
      }

      groupedData[monthKey].total_ventas += sale.total.toNumber();
      groupedData[monthKey].cantidad_transacciones += 1;
      groupedData[monthKey].cantidad_productos += sale.detalle_ventas.length;
    });

    return Object.entries(groupedData).map(([fecha, datos]) => ({
      fecha,
      total_ventas: datos.total_ventas,
      cantidad_transacciones: datos.cantidad_transacciones,
      cantidad_productos: datos.cantidad_productos
    }));
  }
// Obtener productos más vendidos en un mes específico
  async getTopProductsByDate(date: string, limit: number = 10): Promise<TopProduct[]> {
    try {
      const [startDate, endDate] = this.getMonthRangeFromString(date);

      const sales = await this.prisma.sale.findMany({
        where: {
          fecha_venta: {
            gte: startDate,
            lt: endDate,
          },
          estado: 'completada',
        },
        include: {
          detalle_ventas: {
            include: {
              producto: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });

      if (sales.length === 0) {
        return [];
      }

      const productMap = new Map();
      let totalVentasPeriodo = 0;

      sales.forEach(sale => {
        sale.detalle_ventas.forEach(detalle => {
          const productId = detalle.producto.id_producto;
          const subtotalValue = detalle.subtotal ? detalle.subtotal.toNumber() : 0;
          totalVentasPeriodo += subtotalValue;

          if (productMap.has(productId)) {
            const existing = productMap.get(productId);
            existing.cantidad_vendida += detalle.cantidad;
            existing.ingresos_totales += subtotalValue;
          } else {
            productMap.set(productId, {
              producto_id: productId,
              producto_nombre: detalle.producto.nombre_producto,
              categoria: detalle.producto.category?.nombre_categoria || 'Sin categoría',
              cantidad_vendida: detalle.cantidad,
              ingresos_totales: subtotalValue,
            });
          }
        });
      });

      const products = Array.from(productMap.values()).map(product => ({
        ...product,
        porcentaje_del_total: totalVentasPeriodo > 0 
          ? (product.ingresos_totales / totalVentasPeriodo) * 100 
          : 0,
      }));

      return products
        .sort((a, b) => b.ingresos_totales - a.ingresos_totales)
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting top products by date:', error);
      throw new Error(`Error al obtener productos: ${error.message}`);
    }
  }
// Obtener rango de fechas para un mes específico
  private getMonthRangeFromString(monthString: string): [Date, Date] {
    try {
      const [year, month] = monthString.split('-');
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      
      if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        throw new Error('Formato de mes inválido');
      }

      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 1);
      
      return [startDate, endDate];
    } catch (error) {
      throw new Error(`Formato de mes inválido: ${monthString}`);
    }
  }
}