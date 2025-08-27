// // sistema-ventas-frontend/src/app/modules/forecast/forecast.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ForecastService } from './forecast.service';
import { DateProductAnalysis, ForecastRequest, ForecastResult, HistoricalData, TopProduct, TopSellingDate, TabType } from './types';
import { LinearRegressionModel } from './models/linear-regression.model';
import { MovingAverageModel } from './models/moving-average.model';
import { SeasonalModel } from './models/seasonal.model';


@Component({
  selector: 'app-forecast',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forecast.component.html',
  styleUrls: ['./forecast.component.scss']
})
export class ForecastComponent implements OnInit {
  activeTab: TabType = 'config';
  forecastRequest: ForecastRequest = {
    metodo: 'lineal',
    periodo: 'mensual',
    fecha_inicio: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fecha_fin: new Date().toISOString().split('T')[0],
    parametros: {
      periodos: 6,
      alpha: 0.3,
      estacionalidad: 12
    }
  };


  forecastResults: ForecastResult[] = [];
  historicalData: HistoricalData[] = [];
  loading = false;
  error: string | null = null;
  success: string | null = null;
  //activeTab: 'config' | 'results' | 'reports' = 'config';

  // Nuevas propiedades
topSellingDates: TopSellingDate[] = [];
topProductsByDate: DateProductAnalysis[] = [];
selectedDateForAnalysis: string | null = null;
productsLoading = false;

  // Estadísticas
  totalSales = 0;
  averageSales = 0;
  growthRate = 0;
  overallAccuracy = 0;

  constructor(private forecastService: ForecastService) {}

  async ngOnInit() {
    await this.loadHistoricalData();
  }

  async loadHistoricalData() {
    try {
      this.loading = true;
      this.error = null;
      
      this.historicalData = await this.forecastService.getSalesHistory({
        fecha_inicio: this.forecastRequest.fecha_inicio,
        fecha_fin: this.forecastRequest.fecha_fin,
        periodo: this.forecastRequest.periodo
      });
      
      this.calculateStatistics();
      this.success = 'Datos históricos cargados correctamente';
      
    } catch (error: any) {
      this.error = error.message || 'Error al cargar datos históricos';
      console.error('Error loading historical data:', error);
    } finally {
      this.loading = false;
    }
  }

  async generateForecast() {
    this.loading = true;
    this.error = null;
    this.success = null;

    try {
      let predictions: number[] = [];
      let confidenceIntervals: { inferior: number; superior: number }[] = [];
      let accuracy = 0;

      const salesValues = this.historicalData.map(item => item.ventas);

      switch (this.forecastRequest.metodo) {
        case 'lineal':
          const linearResult = LinearRegressionModel.predict(salesValues, this.forecastRequest.parametros?.periodos || 6);
          predictions = linearResult.predictions;
          confidenceIntervals = LinearRegressionModel.calculateConfidenceInterval(predictions, salesValues);
          accuracy = linearResult.rSquared * 100;
          break;

        case 'promedio_movil':
          const maResult = MovingAverageModel.predict(
            salesValues, 
            this.forecastRequest.parametros?.periodos || 6,
            3,
            this.forecastRequest.parametros?.alpha || 0.3
          );
          predictions = maResult.predictions;
          confidenceIntervals = MovingAverageModel.calculateConfidenceInterval(predictions, salesValues);
          accuracy = maResult.accuracy * 100;
          break;

        case 'estacional':
          const seasonalResult = SeasonalModel.predict(
            salesValues,
            this.forecastRequest.parametros?.periodos || 6,
            this.forecastRequest.parametros?.estacionalidad || 12
          );
          predictions = seasonalResult.predictions;
          confidenceIntervals = SeasonalModel.calculateConfidenceInterval(
            predictions, 
            salesValues, 
            this.forecastRequest.parametros?.estacionalidad || 12
          );
          accuracy = 85; // Valor por defecto para estacional
          break;
      }

      this.forecastResults = predictions.map((pred, index) => ({
        fecha: this.getFutureDate(index + 1),
        ventas_previstas: pred,
        intervalo_confianza: confidenceIntervals[index] || { inferior: pred * 0.8, superior: pred * 1.2 },
        metrica_precision: accuracy - (index * 2)
      }));

      this.overallAccuracy = accuracy;
      this.activeTab = 'results';
      this.success = 'Pronóstico generado correctamente';
      
    } catch (error: any) {
      this.error = error.message || 'Error al generar el pronóstico';
      console.error('Error generating forecast:', error);
    } finally {
      this.loading = false;
    }
  }

  private calculateStatistics() {
    this.totalSales = this.historicalData.reduce((sum, item) => sum + item.ventas, 0);
    this.averageSales = this.historicalData.length > 0 ? this.totalSales / this.historicalData.length : 0;
    
    if (this.historicalData.length > 1) {
      const first = this.historicalData[0].ventas;
      const last = this.historicalData[this.historicalData.length - 1].ventas;
      this.growthRate = first > 0 ? ((last - first) / first) * 100 : 0;
    }
  }

  private getFutureDate(offset: number): string {
    const date = new Date();
    switch (this.forecastRequest.periodo) {
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

  exportToCSV() {
    const csvContent = this.convertToCSV();
    this.downloadCSV(csvContent, 'pronostico_ventas.csv');
  }

  private convertToCSV(): string {
    const headers = ['Fecha', 'Ventas Previstas', 'Límite Inferior', 'Límite Superior', 'Precisión'];
    const rows = this.forecastResults.map(result => [
      result.fecha,
      result.ventas_previstas.toFixed(2),
      result.intervalo_confianza.inferior.toFixed(2),
      result.intervalo_confianza.superior.toFixed(2),
      result.metrica_precision ? `${result.metrica_precision.toFixed(2)}%` : 'N/A'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  getPrecisionClass(precision: number): string {
    if (precision >= 80) return 'text-green-600';
    if (precision >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('es-ES').format(value);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'BOB'
    }).format(value);
  }

  formatPercent(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'percent',
      minimumFractionDigits: 2
    }).format(value / 100);
  }

  onMethodChange() {
    // Resetear parámetros según el método
    this.forecastRequest.parametros = {
      periodos: 6,
      alpha: 0.3,
      estacionalidad: 12
    };
  }
get totalForecastedSales(): number {
  return this.forecastResults.reduce((sum, r) => sum + r.ventas_previstas, 0);
}
get averagePrecision(): number | null {
  if (this.forecastResults.length === 0) {
    return null;
  }
  const total = this.forecastResults.reduce((sum, r) => sum + (r.metrica_precision || 0), 0);
  return total / this.forecastResults.length;
}

// Método para obtener fechas con mayores ventas
async loadTopSellingDates() {
  try {
    this.loading = true;
    this.topSellingDates = await this.forecastService.getTopSellingDates({
      fecha_inicio: this.forecastRequest.fecha_inicio,
      fecha_fin: this.forecastRequest.fecha_fin,
      periodo: this.forecastRequest.periodo,
      limit: 5 // Top 5 fechas
    });
  } catch (error: any) {
    this.error = error.message || 'Error al cargar fechas con mayores ventas';
    console.error('Error loading top selling dates:', error);
  } finally {
    this.loading = false;
  }
}

// Método para obtener productos de una fecha específica
async loadTopProductsForDate(date: string) {
  try {
    this.productsLoading = true;
    this.selectedDateForAnalysis = date;

    // Formatear la fecha según el período seleccionado
    let formattedDate = date;

    if (this.forecastRequest.periodo === 'mensual') {
      // Para período mensual, usar YYYY-MM
      formattedDate = date.substring(0, 7);
    } else if (this.forecastRequest.periodo === 'semanal') {
      // Para período semanal, necesitarías calcular la semana
      // Por ahora, usar la fecha completa y dejar que el backend lo maneje
      formattedDate = date;
    }

    console.log('Solicitando productos para fecha formateada:', formattedDate);
    
    const products = await this.forecastService.getTopProductsByDate(formattedDate, 10);
    
    //const products = await this.forecastService.getTopProductsByDate(date, 10);
    
    // Buscar si ya tenemos análisis para esta fecha
    const existingIndex = this.topProductsByDate.findIndex(item => item.fecha === date);
    
    if (existingIndex >= 0) {
      this.topProductsByDate[existingIndex].productos = products;
    } else {
      this.topProductsByDate.push({
        fecha: date,
        productos: products
      });
    }
  } catch (error: any) {
    this.error = error.message || 'Error al cargar productos para la fecha';
    console.error('Error loading top products for date:', error);
  } finally {
    this.productsLoading = false;
  }
}

// Método para predecir productos que podrían ser populares
predictFutureBestSellers(): TopProduct[] {
  if (this.topProductsByDate.length === 0) return [];
  
  // Agrupar productos por ID y sumar sus apariciones en las fechas top
  const productScoreMap = new Map<string, { product: TopProduct, score: number }>();
  
  this.topProductsByDate.forEach(dateAnalysis => {
    dateAnalysis.productos.forEach((product, index) => {
      const existing = productScoreMap.get(product.producto_id);
      const score = (10 - index) * (product.porcentaje_del_total / 100); // Ponderación
      
      if (existing) {
        existing.score += score;
      } else {
        productScoreMap.set(product.producto_id, {
          product: product,
          score: score
        });
      }
    });
  });
  
  // Convertir a array y ordenar por score
  const scoredProducts = Array.from(productScoreMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 10) // Top 10
    .map(item => item.product);
  
  return scoredProducts;
}

// Agregar estas propiedades computadas
get selectedDateProducts(): TopProduct[] | null {
  if (!this.selectedDateForAnalysis) return null;
  const analysis = this.topProductsByDate.find(d => d.fecha === this.selectedDateForAnalysis);
  return analysis ? analysis.productos : null;
}

get hasTopSellingDates(): boolean {
  return this.topSellingDates.length > 0;
}

get hasProductAnalysis(): boolean {
  return this.topProductsByDate.length > 1;
}

getProductCount(product: any): number {
  return this.topProductsByDate.filter(d => d.productos.some(p => p.producto_id === product.producto_id)).length;
}


}