// sistema-ventas-backend/src/forecast/forecast.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ForecastRequestDto } from './dto/forecast-request.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { ForecastResponse, ForecastResult, HistoricalData, TopProduct, TopSellingDate } from './interfaces/forecast.interface';
import { TopDatesQueryDto } from './dto/top-dates-query.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
@Injectable()
export class ForecastService {
  constructor(private prisma: PrismaService,
              private readonly httpService: HttpService
  ) {}

  async getSalesHistory(query: HistoryQueryDto): Promise<HistoricalData[]> {
    const { fecha_inicio, fecha_fin, periodo, producto, categoria } = query;
    
    // Construir consulta base
    let whereClause: any = {
      fecha_venta: {
        gte: new Date(fecha_inicio),
        lte: new Date(fecha_fin),
      },
      estado: 'completada', // Solo ventas completadas
    };

    // Filtrar por producto si se especifica
    if (producto) {
      whereClause.detalle_ventas = {
        some: {
          id_producto: producto,
        },
      };
    }

    // Agrupar ventas por período
    const sales = await this.prisma.sale.findMany({
      where: whereClause,
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

    // Procesar y agrupar datos según el período
    return this.processHistoricalData(sales, periodo, categoria);
  }

  private processHistoricalData(sales: any[], periodo: string, categoria?: string): HistoricalData[] {
    const groupedData: { [key: string]: number } = {};

    sales.forEach(sale => {
      sale.detalle_ventas.forEach(detalle => {
        // Filtrar por categoría si se especifica
        if (categoria && detalle.producto?.category?.id_categoria !== categoria) {
          return;
        }

        const fechaKey = this.getDateKey(sale.fecha_venta, periodo);

        // === CORRECCIÓN AQUÍ ===
        // Usar ?. para evitar errores si subtotal es null o undefined
        // Usar ?? para proporcionar un valor predeterminado (0) si la conversión falla
        const ventaActual = detalle.subtotal?.toNumber() ?? 0;
        groupedData[fechaKey] = (groupedData[fechaKey] || 0) + ventaActual;
      });
    });

    // Convertir a array y ordenar
    return Object.entries(groupedData)
      .map(([fecha, ventas]) => ({ fecha, ventas }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  private getDateKey(date: Date, periodo: string): string {
    const d = new Date(date);
    
    switch (periodo) {
      case 'diario':
        return d.toISOString().split('T')[0]; // YYYY-MM-DD
      case 'semanal':
        const year = d.getFullYear();
        const week = this.getWeekNumber(d);
        return `${year}-W${week.toString().padStart(2, '0')}`;
      case 'mensual':
        return d.toISOString().substring(0, 7); // YYYY-MM
      default:
        return d.toISOString().split('T')[0];
    }
  }
  
  private getWeekNumber(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  }

  // Actualizar el método generateForecast para incluir métricas de error
async generateForecast(forecastRequest: ForecastRequestDto): Promise<ForecastResponse> {
  const { metodo, periodo, fecha_inicio, fecha_fin, parametros } = forecastRequest;

  // Obtener datos históricos
  const historicalData = await this.getSalesHistory({
    fecha_inicio,
    fecha_fin,
    periodo,
  });

  if (historicalData.length === 0) {
    throw new NotFoundException('No hay datos históricos para el período seleccionado');
  }

  // Determinar frecuencia para Python
  let frequency: string;
  switch (periodo) {
    case 'diario': frequency = 'D'; break;
    case 'semanal': frequency = 'W'; break;
    case 'mensual': frequency = 'M'; break;
    default: frequency = 'D';
  }

  try {
    // Llamar al servicio Python - AQUÍ VA EL CÓDIGO ACTUALIZADO
    const pythonServiceUrl = process.env.PYTHON_FORECAST_SERVICE || 'http://localhost:8000';
    
    const response = await firstValueFrom(
      this.httpService.post(`${pythonServiceUrl}/forecast`, {
        historical_data: historicalData,
        method: 'moving_average', // Cambiado de 'metodo' a 'method'
        periods: parametros?.periodos || 6,
        frequency: frequency,
        window_size: parametros?.ventana || 3, // Nuevo parámetro
        alpha: parametros?.alpha || 0.3 // Nuevo parámetro
      })
    );

    // Mapear la respuesta de Python al formato esperado
    const results: ForecastResult[] = (response.data as any).predictions.map((pred: any) => ({
      fecha: pred.fecha,
      ventas_previstas: pred.ventas_previstas,
      intervalo_confianza: pred.intervalo_confianza,
      metrica_precision: (response.data as any).metrics.accuracy
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
    // Fallback a métodos TypeScript si el servicio Python falla
    console.error('Error calling Python service, falling back to TS methods:', error);
    
    // Extraer solo los valores de ventas
    const salesValues = historicalData.map(item => item.ventas);

    // Usar siempre promedio móvil como fallback
    const movingAverageResult = this.movingAverageForecast(
      salesValues, 
      parametros?.periodos || 6, 
      parametros?.ventana || 3,
      parametros?.alpha || 0.3, 
      periodo
    );
    
    // Calcular métricas de error
    const metrics = this.calculateForecastAccuracy(salesValues, movingAverageResult.predictions);

    return {
      results: movingAverageResult.results,
      metrics
    };
  }
}

private movingAverageForecast(
  data: number[], 
  periods: number, 
  windowSize: number, 
  alpha: number, 
  periodo: string
): { results: ForecastResult[]; predictions: number[] } {
  const results: ForecastResult[] = [];
  const predictions: number[] = [];
  const forecastData = [...data];
  const lastDate = new Date();

  for (let i = 0; i < periods; i++) {
    const window = forecastData.slice(-windowSize);
    const average = window.reduce((sum, val) => sum + val, 0) / window.length;
    
    // Suavizado exponencial
    const smoothedPrediction = alpha * average + (1 - alpha) * (forecastData[forecastData.length - 1] || average);
    predictions.push(smoothedPrediction);
    
    const confidenceInterval = this.calculateConfidenceInterval(smoothedPrediction, data);
    
    results.push({
      fecha: this.getFutureDate(lastDate, i + 1, periodo),
      ventas_previstas: smoothedPrediction,
      intervalo_confianza: confidenceInterval,
      metrica_precision: this.calculatePrecision(data, smoothedPrediction)
    });

    forecastData.push(smoothedPrediction);
  }

  return { results, predictions };
}

private linearRegressionForecast(data: number[], periods: number, periodo: string): { 
  results: ForecastResult[]; 
  predictions: number[] 
} {
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i + 1);
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = data.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, val, idx) => sum + val * data[idx], 0);
  const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  const results: ForecastResult[] = [];
  const predictions: number[] = [];
  const lastDate = new Date();
  
  for (let i = 1; i <= periods; i++) {
    const prediction = intercept + slope * (n + i);
    predictions.push(prediction);
    
    const confidenceInterval = this.calculateConfidenceInterval(prediction, data);
    
    results.push({
      fecha: this.getFutureDate(lastDate, i, periodo),
      ventas_previstas: prediction,
      intervalo_confianza: confidenceInterval,
      metrica_precision: this.calculatePrecision(data, prediction)
    });
  }
  
  return { results, predictions };
}

private seasonalForecast(data: number[], periods: number, seasonality: number, periodo: string): { 
  results: ForecastResult[]; 
  predictions: number[] 
} {
  const results: ForecastResult[] = [];
  const predictions: number[] = [];
  const lastDate = new Date();

  for (let i = 1; i <= periods; i++) {
    const baseIndex = data.length % seasonality;
    const seasonalIndex = (baseIndex + i - 1) % seasonality;
    const baseValue = data.slice(-seasonality).reduce((a, b) => a + b, 0) / seasonality;
    
    const prediction = baseValue * 1.0; // Aquí deberías usar tus factores estacionales
    predictions.push(prediction);
    
    const confidenceInterval = this.calculateConfidenceInterval(prediction, data);

    results.push({
      fecha: this.getFutureDate(lastDate, i, periodo),
      ventas_previstas: prediction,
      intervalo_confianza: confidenceInterval,
      metrica_precision: this.calculatePrecision(data, prediction)
    });
  }

  return { results, predictions };
}


  private calculateSeasonalFactors(data: number[], seasonality: number): number[] {
  const factors: number[] = Array(seasonality).fill(1);
  
  if (data.length >= seasonality * 2) {
    for (let i = 0; i < seasonality; i++) {
      const seasonalValues: number[] = []; // ← Especificar tipo explícitamente
      
      for (let j = i; j < data.length; j += seasonality) {
        if (j < data.length) {
          seasonalValues.push(data[j]); // ← Ahora funciona
        }
      }
      
      if (seasonalValues.length > 0) {
        factors[i] = seasonalValues.reduce((a, b) => a + b, 0) / seasonalValues.length;
      }
    }
    
    const avgFactor = factors.reduce((a, b) => a + b, 0) / seasonality;
    return factors.map(f => f / avgFactor);
  }
  
  return factors;
}

  private calculateConfidenceInterval(prediction: number, historicalData: number[]) {
    const stdDev = this.calculateStandardDeviation(historicalData);
    const marginOfError = 1.96 * stdDev; // 95% confidence interval
    
    return {
      inferior: Math.max(0, prediction - marginOfError),
      superior: prediction + marginOfError
    };
  }

  private calculateStandardDeviation(data: number[]): number {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const squaredDiffs = data.map(value => Math.pow(value - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
    return Math.sqrt(variance);
  }

private calculatePrecision(historicalData: number[], prediction: number): number {
  if (historicalData.length === 0) return 0;
  
  // Calcular el error porcentual promedio
  const errors = historicalData.map(actual => {
    if (actual === 0) return 0;
    return Math.abs((actual - prediction) / actual) * 100;
  });
  
  const averageError = errors.reduce((sum, error) => sum + error, 0) / errors.length;
  return Math.max(0, 100 - averageError);
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

async getTopSellingDates(query: TopDatesQueryDto): Promise<any[]> {
  console.log('Query recibida:', query);
  const { fecha_inicio, fecha_fin, periodo, limit = 10 } = query;
  
  try {
    // Convertir y validar fechas
    console.log('Convirtiendo fechas...');
    const startDate = new Date(fecha_inicio);
    const endDate = new Date(fecha_fin);
    console.log('Fechas convertidas:', startDate, endDate);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Fechas inválidas');
    }

    // Obtener ventas en el período especificado
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
      orderBy: {
        fecha_venta: 'asc',
      },
    });

    if (sales.length === 0) {
      return []; // Retornar array vacío en lugar de error
    }

    // Agrupar ventas por fecha según el período
    const groupedSales = this.groupSalesByPeriod(sales, periodo);

    // Ordenar por total de ventas (descendente) y tomar el límite
    return groupedSales
      .sort((a, b) => b.total_ventas - a.total_ventas)
      .slice(0, limit);
  } catch (error) {
    console.error('Error detallado:', error);
    console.error('Error en getTopSellingDates:', error);
    throw new Error(`Error al obtener fechas con mayores ventas: ${error.message}`);
  }
}
async getTopProductsByDate(date: string, limit: number = 10): Promise<any[]> {
  try {
    console.log('📦 Buscando productos para fecha:', date);

    // Determinar el tipo de fecha y crear el rango
    let startDate: Date;
    let endDate: Date;

    if (date.includes('W')) {
      // Formato semanal: YYYY-WXX
      [startDate, endDate] = this.getWeekRangeFromString(date);
    } else if (date.length === 7 && date[4] === '-') {
      // Formato mensual: YYYY-MM
      [startDate, endDate] = this.getMonthRangeFromString(date);
    } else if (date.length === 10 && date[4] === '-' && date[7] === '-') {
      // Formato diario: YYYY-MM-DD
      startDate = new Date(date + 'T00:00:00');
      endDate = new Date(date + 'T00:00:00');
      endDate.setDate(endDate.getDate() + 1);
    } else {
      // Intentar parsear como fecha completa
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error(`Formato de fecha no reconocido: ${date}`);
      }
      startDate = new Date(parsedDate);
      endDate = new Date(parsedDate);
      endDate.setDate(endDate.getDate() + 1);
    }

    console.log('📅 Rango de fechas:', startDate.toISOString(), 'a', endDate.toISOString());

    // Obtener ventas del período específico
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

    console.log('🛒 Ventas encontradas:', sales.length);

    if (sales.length === 0) {
      return []; // Retornar array vacío
    }

    // Agrupar productos
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

    // Calcular porcentajes y ordenar
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
    console.error('❌ Error en getTopProductsByDate:', error);
    throw new Error(`Error al obtener productos: ${error.message}`);
  }
}

private getWeekRangeFromString(weekString: string): [Date, Date] {
  try {
    // Formato: YYYY-WXX
    const [year, week] = weekString.split('-W');
    const yearNum = parseInt(year);
    const weekNum = parseInt(week);
    
    if (isNaN(yearNum) || isNaN(weekNum) || weekNum < 1 || weekNum > 53) {
      throw new Error('Formato de semana inválido');
    }

    // Primer día del año
    const firstDayOfYear = new Date(yearNum, 0, 1);
    
    // Días para agregar: (semana - 1) * 7 + ajuste por día de la semana
    const daysToAdd = (weekNum - 1) * 7;
    
    const startDate = new Date(firstDayOfYear);
    startDate.setDate(firstDayOfYear.getDate() + daysToAdd);
    
    // Ajustar al primer día de la semana (lunes)
    const dayOfWeek = startDate.getDay();
    const adjustToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + adjustToMonday);
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);
    
    return [startDate, endDate];
  } catch (error) {
    console.error('Error parsing week:', error);
    throw new Error(`Formato de semana inválido: ${weekString}`);
  }
}

private getMonthRangeFromString(monthString: string): [Date, Date] {
  try {
    // Formato: YYYY-MM
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
    console.error('Error parsing month:', error);
    throw new Error(`Formato de mes inválido: ${monthString}`);
  }
}

  private groupSalesByPeriod(sales: any[], periodo: string): any[] {
    const groupedData: { [key: string]: { total_ventas: number, cantidad_transacciones: number } } = {};

    sales.forEach(sale => {
      const dateKey = this.getDateKey(sale.fecha_venta, periodo);
      
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          total_ventas: 0,
          cantidad_transacciones: 0,
        };
      }

      // Sumar el total de la venta
      groupedData[dateKey].total_ventas += sale.total.toNumber();
      groupedData[dateKey].cantidad_transacciones += 1;
    });

    // Convertir a array con formato
    return Object.entries(groupedData).map(([fecha, datos]) => ({
      fecha,
      total_ventas: datos.total_ventas,
      cantidad_transacciones: datos.cantidad_transacciones,
    }));
  }
  private parseDateString(dateString: string): { startDate: Date; endDate: Date; type: string } {
  if (dateString.includes('W')) {
    // Formato semanal
    const [start, end] = this.getWeekRangeFromString(dateString);
    return { startDate: start, endDate: end, type: 'semanal' };
  } else if (dateString.length === 7) {
    // Formato mensual
    const [start, end] = this.getMonthRangeFromString(dateString);
    return { startDate: start, endDate: end, type: 'mensual' };
  } else if (dateString.length === 10) {
    // Formato diario
    const startDate = new Date(dateString);
    const endDate = new Date(dateString);
    endDate.setDate(endDate.getDate() + 1);
    return { startDate, endDate, type: 'diario' };
  } else {
    throw new Error(`Formato de fecha no reconocido: ${dateString}`);
  }
}
// Método para calcular error porcentual
private calculateErrorPercentage(actual: number, predicted: number): number {
  if (actual === 0) return predicted === 0 ? 0 : 100;
  return Math.abs((actual - predicted) / actual) * 100;
}
// Método para calcular métricas de error completas
private calculateForecastAccuracy(historicalData: number[], predictions: number[]): {
  mape: number;       // Mean Absolute Percentage Error
  mae: number;        // Mean Absolute Error
  rmse: number;       // Root Mean Square Error
  accuracy: number;   // Precisión general (100 - MAPE)
} {
  if (historicalData.length === 0 || predictions.length === 0) {
    return { mape: 0, mae: 0, rmse: 0, accuracy: 0 };
  }

  let totalError = 0;
  let totalAbsoluteError = 0;
  let totalSquaredError = 0;
  let count = 0;

  // Calcular errores para cada punto de datos
  for (let i = 0; i < Math.min(historicalData.length, predictions.length); i++) {
    const actual = historicalData[i];
    const predicted = predictions[i];
    
    if (actual > 0) { // Solo calcular si hay datos reales
      const error = Math.abs(actual - predicted);
      const percentageError = this.calculateErrorPercentage(actual, predicted);
      
      totalError += percentageError;
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

public async validateForecastModel(forecastRequest: ForecastRequestDto): Promise<{
  training_period: { start: string; end: string; points: number };
  test_period: { start: string; end: string; points: number };
  metrics: { mape: number; mae: number; rmse: number; accuracy: number };
}> {
  const fullData = await this.getSalesHistory({
    fecha_inicio: forecastRequest.fecha_inicio,
    fecha_fin: forecastRequest.fecha_fin,
    periodo: forecastRequest.periodo
  });

  if (fullData.length < 10) {
    throw new Error('Se necesitan al menos 10 puntos de datos para validación');
  }

  const splitIndex = Math.floor(fullData.length * 0.8);
  const trainingData = fullData.slice(0, splitIndex);
  const testData = fullData.slice(splitIndex);

  // Extraer valores de entrenamiento
  const trainingValues = trainingData.map(item => item.ventas);
  let predictions: number[];

  // Usar los métodos internos (ahora son accesibles dentro del servicio)
  switch (forecastRequest.metodo) {
    case 'lineal':
      predictions = this.linearRegressionForecast(trainingValues, testData.length, forecastRequest.periodo).predictions;
      break;
    // case 'promedio_movil':
    //   predictions = this.movingAverageForecast(trainingValues, testData.length, forecastRequest.parametros?.alpha || 0.3, forecastRequest.periodo).predictions;
    //   break;
    // case 'estacional':
    //   predictions = this.seasonalForecast(trainingValues, testData.length, forecastRequest.parametros?.estacionalidad || 12, forecastRequest.periodo).predictions;
    //   break;
    default:
      throw new Error('Método de pronóstico no válido');
  }

  const testValues = testData.map(item => item.ventas);
  const metrics = this.calculateForecastAccuracy(testValues, predictions);

  return {
    training_period: {
      start: trainingData[0].fecha,
      end: trainingData[trainingData.length - 1].fecha,
      points: trainingData.length
    },
    test_period: {
      start: testData[0].fecha,
      end: testData[testData.length - 1].fecha,
      points: testData.length
    },
    metrics
  };
}

}