// sistema-ventas-frontend/src/app/modules/forecast/forecast.component.ts

import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ForecastService } from './forecast.service';
import { DateProductAnalysis, ForecastRequest, ForecastResult, HistoricalData, TopProduct, TopSellingDate, TabType, ForecastMetrics, ModelInfo } from './types';
import { LinearRegressionModel } from './models/linear-regression.model';
import { MovingAverageModel } from './models/moving-average.model';
import { SeasonalModel } from './models/seasonal.model';
import { environment } from '../../../environments/environment';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartType, ChartData, ChartOptions, registerables } from 'chart.js';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


// Interface para la respuesta del servicio de pronóstico
interface ForecastResponse {
  results: ForecastResult[];
  metrics: ForecastMetrics;
  model_info?: ModelInfo;
}
Chart.register(...registerables);
@Component({
  selector: 'app-forecast',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './forecast.component.html',
  styleUrls: ['./forecast.component.scss']
})


export class ForecastComponent implements OnInit {
  isPythonEnabled = environment.enablePythonService;
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

  // Nuevas propiedades
  topSellingDates: TopSellingDate[] = [];
  topProductsByDate: DateProductAnalysis[] = [];
  selectedDateForAnalysis: string | null = null;
  productsLoading = false;
  modelInfo: ModelInfo | null = null;
  showAdvancedMetrics = false;
  currentDate: string = new Date().toLocaleDateString();

  // Estadísticas
  totalSales = 0;
  averageSales = 0;
  growthRate = 0;
  overallAccuracy = 0;

  // Métricas de error (NUEVO)
  forecastMetrics: ForecastMetrics = {
    mape: 0,
    mae: 0,
    rmse: 0,
    accuracy: 0,
    totalSales: 0,
    averageSales: 0,
    growthRate: 0,
    periods: 0
  };

  // NUEVO: Referencia al elemento del gráfico
  @ViewChild(BaseChartDirective) chart!: BaseChartDirective;

  // NUEVO: Configuración de gráficos
  public salesChartType: ChartType = 'line';
  public productsChartType: ChartType = 'bar';
  public accuracyChartType: ChartType = 'doughnut';

  // NUEVO: Datos para el gráfico de tendencia de ventas
  public salesChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Ventas Reales',
        data: [],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Ventas Previstas',
        data: [],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        borderDash: [5, 5]
      }
    ]
  };

  public salesChartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Tendencia de Ventas - Real vs Pronosticado'
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Monto de Ventas (BOB)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Período'
        }
      }
    }
  };

  // NUEVO: Gráfico de productos más vendidos
  public productsChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Ventas Totales (BOB)',
        data: [],
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
          '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ]
      }
    ]
  };

  public productsChartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Top 8 Productos Más Vendidos'
      }
    }
  };

  // NUEVO: Gráfico de precisión del modelo
  public accuracyChartData: ChartConfiguration['data'] = {
    labels: ['Precisión', 'Error'],
    datasets: [
      {
        data: [0, 100],
        backgroundColor: ['#10B981', '#EF4444']
      }
    ]
  };

  public accuracyChartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Precisión del Modelo'
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return context.label + ': ' + context.raw + '%';
          }
        }
      }
    }
  };

  constructor(private forecastService: ForecastService) { }

  async ngOnInit() {
    await this.loadHistoricalData();
    // Inicializar gráficos después de cargar datos
    setTimeout(() => {
      this.updateCharts();
    }, 100);

    this.currentDate = new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

  }

  // NUEVO: Actualizar gráficos con datos
  private updateCharts() {
    this.updateSalesChart();
    this.updateProductsChart();
    this.updateAccuracyChart();
  }

  // NUEVO: Actualizar gráfico de ventas
  private updateSalesChart() {
    if (this.historicalData.length === 0 && this.forecastResults.length === 0) return;

    const historicalLabels = this.historicalData.map(item => {
      if (this.forecastRequest.periodo === 'mensual') {
        return item.fecha.substring(0, 7); // YYYY-MM
      }
      return item.fecha;
    });

    const historicalData = this.historicalData.map(item => item.ventas);

    const forecastLabels = this.forecastResults.map(item => item.fecha);
    const forecastData = this.forecastResults.map(item => item.ventas_previstas);

    this.salesChartData = {
      labels: [...historicalLabels, ...forecastLabels],
      datasets: [
        {
          label: 'Ventas Reales',
          data: [...historicalData, ...Array(forecastData.length).fill(null)],
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Ventas Previstas',
          data: [...Array(historicalData.length).fill(null), ...forecastData],
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          borderDash: [5, 5]
        }
      ]
    };

    if (this.chart) {
      this.chart.update();
    }
  }

  // NUEVO: Actualizar gráfico de productos
  private updateProductsChart() {
    if (!this.selectedDateProducts || this.selectedDateProducts.length === 0) return;

    const topProducts = this.selectedDateProducts.slice(0, 8);

    this.productsChartData = {
      labels: topProducts.map(p => p.producto_nombre.substring(0, 20) + (p.producto_nombre.length > 20 ? '...' : '')),
      datasets: [
        {
          label: 'Ventas Totales (BOB)',
          data: topProducts.map(p => p.ingresos_totales),
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
          ]
        }
      ]
    };

    if (this.chart) {
      this.chart.update();
    }
  }

  // NUEVO: Actualizar gráfico de precisión
  private updateAccuracyChart() {
    this.accuracyChartData = {
      labels: ['Precisión', 'Error'],
      datasets: [
        {
          data: [this.forecastMetrics.accuracy, 100 - this.forecastMetrics.accuracy],
          backgroundColor: ['#10B981', '#EF4444']
        }
      ]
    };

    if (this.chart) {
      this.chart.update();
    }
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
      // Primero intentar con el servicio backend (que puede usar Python)
      try {
        const response: ForecastResponse = await this.forecastService.generateForecast(this.forecastRequest) as ForecastResponse;

        this.forecastResults = response.results;
        this.forecastMetrics = response.metrics;
        this.modelInfo = response.model_info || null;

        this.overallAccuracy = this.forecastMetrics.accuracy;
        this.activeTab = 'results';
        this.success = 'Pronóstico generado correctamente con backend avanzado';

      } catch (backendError) {
        console.log('Backend avanzado no disponible, usando métodos locales:', backendError);

        // Fallback a métodos locales TypeScript
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

        // Generar resultados con error porcentual
        this.forecastResults = this.generateForecastResultsWithError(
          predictions,
          confidenceIntervals,
          accuracy,
          salesValues
        );

        // Calcular métricas de error
        this.calculateForecastMetrics(salesValues, predictions);

        // Establecer información del modelo para métodos locales
        this.modelInfo = {
          type: 'typescript_fallback',
          method: this.forecastRequest.metodo
        };

        this.overallAccuracy = this.forecastMetrics.accuracy;
        this.activeTab = 'results';
        this.success = 'Pronóstico generado con métodos locales';
      }

    } catch (error: any) {
      this.error = error.message || 'Error al generar el pronóstico';
      console.error('Error generating forecast:', error);
    } finally {
      this.loading = false;
    }

    setTimeout(() => {
      this.updateCharts();
    }, 100);
  }

  toggleAdvancedMetrics() {
    this.showAdvancedMetrics = !this.showAdvancedMetrics;
  }

  getMethodDisplayName(): string {
    if (!this.modelInfo) {
      return this.forecastRequest.metodo;
    }

    switch (this.modelInfo.type) {
      case 'linear_regression':
        return `Regresión Lineal ${this.forecastMetrics.r2_score ? '(R²: ' + this.forecastMetrics.r2_score.toFixed(3) + ')' : ''}`;
      case 'moving_average':
        return `Promedio Móvil ${this.modelInfo.alpha ? '(α: ' + this.modelInfo.alpha + ')' : ''}`;
      case 'seasonal':
        return `Modelo Estacional ${this.modelInfo.seasonality ? '(Ciclo: ' + this.modelInfo.seasonality + ')' : ''}`;
      case 'typescript_fallback':
        switch (this.forecastRequest.metodo) {
          case 'lineal': return 'Regresión Lineal (Local)';
          case 'promedio_movil': return 'Promedio Móvil (Local)';
          case 'estacional': return 'Modelo Estacional (Local)';
          default: return this.forecastRequest.metodo;
        }
      default:
        return this.forecastRequest.metodo;
    }
  }

  // Método para determinar si usamos Python o métodos locales
  isUsingPythonBackend(): boolean {
    return this.modelInfo !== null &&
      this.modelInfo.type !== 'typescript_fallback' &&
      environment.enablePythonService;
  }

  // NUEVO: Generar resultados con error porcentual
  private generateForecastResultsWithError(
    predictions: number[],
    confidenceIntervals: { inferior: number; superior: number }[],
    accuracy: number,
    historicalData: number[]
  ): ForecastResult[] {
    const results: ForecastResult[] = [];

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

      results.push({
        fecha: this.getFutureDate(i + 1),
        ventas_previstas: prediction,
        ventas_reales: ventasReales,
        error_porcentual: errorPorcentual,
        intervalo_confianza: confidenceIntervals[i] || { inferior: prediction * 0.8, superior: prediction * 1.2 },
        metrica_precision: accuracy - (i * 2) // Disminuir precisión gradualmente
      });
    }

    return results;
  }

  // NUEVO: Calcular métricas de error completas
  private calculateForecastMetrics(actualData: number[], predictedData: number[]): void {
    if (actualData.length === 0 || predictedData.length === 0) {
      this.forecastMetrics = {
        mape: 0,
        mae: 0,
        rmse: 0,
        accuracy: 0,
        totalSales: this.totalSales,
        averageSales: this.averageSales,
        growthRate: this.growthRate,
        periods: actualData.length
      };
      return;
    }

    let totalError = 0;
    let totalAbsoluteError = 0;
    let totalSquaredError = 0;
    let count = 0;

    // Calcular errores para los puntos donde tenemos ambos datos
    for (let i = 0; i < Math.min(actualData.length, predictedData.length); i++) {
      const actual = actualData[actualData.length - i - 1]; // Empezar desde el final
      const predicted = predictedData[i];

      if (actual > 0) { // Solo calcular si hay datos reales positivos
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

    this.forecastMetrics = {
      mape: Number(mape.toFixed(2)),
      mae: Number(mae.toFixed(2)),
      rmse: Number(rmse.toFixed(2)),
      accuracy: Number(accuracy.toFixed(2)),
      totalSales: this.totalSales,
      averageSales: this.averageSales,
      growthRate: this.growthRate,
      periods: actualData.length
    };
  }

  // NUEVO: Calcular error porcentual individual
  private calculateErrorPercentage(actual: number, predicted: number): number {
    if (actual === 0) return predicted === 0 ? 0 : 100;
    return Number((Math.abs((actual - predicted) / actual) * 100).toFixed(2));
  }

  getModelInfoText(): string {
    if (!this.modelInfo) return '';

    switch (this.modelInfo.type) {
      case 'linear_regression':
        return `Regresión Lineal (R²: ${this.forecastMetrics.r2_score?.toFixed(3) || 'N/A'})`;
      case 'exponential_smoothing':
        return 'Suavizado Exponencial (Holt-Winters)';
      case 'arima':
        return `ARIMA ${this.modelInfo.order} (AIC: ${this.modelInfo.aic?.toFixed(2) || 'N/A'})`;
      case 'typescript_fallback':
        return `Método Local: ${this.forecastRequest.metodo}`;
      default:
        return this.forecastRequest.metodo;
    }
  }

  // NUEVO: Método para obtener clase CSS según el error
  getErrorClass(error: number | undefined): string {
    if (error === undefined) return 'text-gray-500 bg-gray-100';
    if (error <= 10) return 'text-green-600 bg-green-50';
    if (error <= 20) return 'text-yellow-600 bg-yellow-50';
    if (error <= 30) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  }

  // NUEVO: Método para obtener icono según el error
  getErrorIcon(error: number | undefined): string {
    if (error === undefined) return '❓';
    if (error <= 10) return '✅';
    if (error <= 20) return '⚠️';
    if (error <= 30) return '🔶';
    return '❌';
  }

  // NUEVO: Obtener recomendaciones basadas en el error
  getErrorRecommendations(): string[] {
    const recommendations: string[] = [];
    const mape = this.forecastMetrics.mape;

    if (mape > 30) {
      recommendations.push('❌ Considera cambiar el método de pronóstico');
      recommendations.push('📈 Aumenta el período de datos históricos');
      recommendations.push('🔍 Revisa la calidad de los datos');
    } else if (mape > 20) {
      recommendations.push('⚙️ Ajusta los parámetros del modelo');
      recommendations.push('📊 Prueba con el método de Promedio Móvil');
      recommendations.push('📅 Considera factores estacionales');
    } else if (mape > 10) {
      recommendations.push('✅ Resultados aceptables, puedes afinar parámetros');
      recommendations.push('📋 Monitorea regularmente la precisión');
    } else {
      recommendations.push('🎯 Excelente precisión, mantén la configuración');
      recommendations.push('📈 Considera extender el período de pronóstico');
    }

    return recommendations;
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

  // ACTUALIZADO: Exportar CSV con nuevas columnas
  exportToCSV() {
    const csvContent = this.convertToCSV();
    this.downloadCSV(csvContent, 'pronostico_ventas.csv');
  }

  private convertToCSV(): string {
    const headers = ['Fecha', 'Ventas Previstas', 'Ventas Reales', 'Error %', 'Límite Inferior', 'Límite Superior', 'Precisión'];
    const rows = this.forecastResults.map(result => [
      result.fecha,
      result.ventas_previstas.toFixed(2),
      result.ventas_reales ? result.ventas_reales.toFixed(2) : 'N/A',
      result.error_porcentual ? `${result.error_porcentual.toFixed(2)}%` : 'N/A',
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

  getPrecisionClass(precision: number | undefined): string {
    if (precision === undefined) return 'text-gray-500';
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
    if (this.forecastResults.length === 0) return null;
    const validPrecisions = this.forecastResults
      .map(r => r.metrica_precision)
      .filter(p => p !== undefined) as number[];
    return validPrecisions.length > 0 ? validPrecisions.reduce((a, b) => a + b, 0) / validPrecisions.length : 0;
  }

  async loadTopSellingDates() {
    try {
      this.loading = true;
      this.topSellingDates = await this.forecastService.getTopSellingDates({
        fecha_inicio: this.forecastRequest.fecha_inicio,
        fecha_fin: this.forecastRequest.fecha_fin,
        periodo: this.forecastRequest.periodo,
        limit: 5
      });
    } catch (error: any) {
      this.error = error.message || 'Error al cargar fechas con mayores ventas';
      console.error('Error loading top selling dates:', error);
    } finally {
      this.loading = false;
    }
  }

  async loadTopProductsForDate(date: string) {
    try {
      this.productsLoading = true;
      this.selectedDateForAnalysis = date;

      let formattedDate = date;
      if (this.forecastRequest.periodo === 'mensual') {
        formattedDate = date.substring(0, 7);
      }

      const products = await this.forecastService.getTopProductsByDate(formattedDate, 10);

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

    setTimeout(() => {
      this.updateProductsChart();
    }, 100);
  }

  predictFutureBestSellers(): TopProduct[] {
    if (this.topProductsByDate.length === 0) return [];

    const productScoreMap = new Map<string, { product: TopProduct, score: number }>();

    this.topProductsByDate.forEach(dateAnalysis => {
      dateAnalysis.productos.forEach((product, index) => {
        const existing = productScoreMap.get(product.producto_id);
        const score = (10 - index) * (product.porcentaje_del_total / 100);

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

    const scoredProducts = Array.from(productScoreMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.product);

    return scoredProducts;
  }

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

  // MÉTODO MEJORADO para exportar PDF
  // forecast.component.ts - NUEVO MÉTODO CORREGIDO
  async exportReportToPDF() {
    try {
      this.loading = true;
      this.success = null;
      this.error = null;

      // Esperar a que Angular actualice la vista
      await new Promise(resolve => setTimeout(resolve, 500));

      // Crear un div temporal para la captura
      const captureElement = document.createElement('div');
      captureElement.style.position = 'fixed';
      captureElement.style.left = '0';
      captureElement.style.top = '0';
      captureElement.style.width = '800px';
      captureElement.style.backgroundColor = '#ffffff';
      captureElement.style.zIndex = '10000';
      captureElement.style.padding = '20px';
      captureElement.style.boxSizing = 'border-box';

      // Clonar el contenido que queremos exportar
      const contentToExport = document.querySelector('.bg-white.rounded-lg.shadow-md.p-6.mb-6');

      if (!contentToExport) {
        throw new Error('No se encontró contenido para exportar');
      }

      // Hacer una copia profunda del contenido
      const contentClone = contentToExport.cloneNode(true) as HTMLElement;

      // Ajustar estilos para mejor visualización en PDF
      contentClone.style.width = '760px';
      contentClone.style.margin = '0';
      contentClone.style.boxShadow = 'none';
      contentClone.style.border = '1px solid #ddd';

      // Asegurar que todo el texto sea visible
      const allElements = contentClone.querySelectorAll('*');
      allElements.forEach(el => {
        const element = el as HTMLElement;
        element.style.color = '#000000 !important';
        element.style.backgroundColor = 'transparent !important';
        element.style.opacity = '1 !important';
        element.style.visibility = 'visible !important';
      });

      captureElement.appendChild(contentClone);
      document.body.appendChild(captureElement);

      // Configuración optimizada para html2canvas
      const canvas = await html2canvas(captureElement, {
        scale: 2, // Alta resolución
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff',
        allowTaint: true,
        removeContainer: true,
        onclone: (clonedDoc, element) => {
          // Forzar estilos para mejor impresión
          const elements = element.querySelectorAll('*');
          elements.forEach((el: any) => {
            el.style.color = '#000000';
            el.style.backgroundColor = 'transparent';
            el.style.opacity = '1';
            el.style.visibility = 'visible';
            el.style.fontWeight = 'normal';
          });
        }
      });

      // Limpiar el elemento temporal
      document.body.removeChild(captureElement);

      // Crear PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png', 1.0);

      // Dimensiones
      const imgWidth = 190; // mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Añadir imagen al PDF
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);

      // Metadatos
      const date = new Date().toLocaleDateString('es-ES');
      pdf.setProperties({
        title: `Reporte de Pronóstico - ${date}`,
        subject: 'Sistema de Pronósticos de Ventas',
        author: 'Sistema de Ventas'
      });

      // Guardar
      const fileName = `reporte_pronostico_${date.replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);

      this.success = '✅ Reporte PDF generado correctamente';

    } catch (error) {
      console.error('Error generando PDF:', error);
      this.error = '❌ Error al generar PDF. Use la exportación estructurada en su lugar.';

      // Fallback automático a PDF estructurado
      this.exportStructuredPDF();
    } finally {
      this.loading = false;
      setTimeout(() => {
        this.success = null;
        this.error = null;
      }, 5000);
    }
  }

  // Método alternativo para PDF con tablas (más estructurado)
  // Método PDF estructurado mejorado
  // forecast.component.ts - MÉTODO ESTRUCTURADO MEJORADO
  async exportStructuredPDF() {
    try {
      this.loading = true;
      this.success = null;
      this.error = null;

      const pdf = new jsPDF();
      const date = new Date().toLocaleDateString('es-ES');

      // CONFIGURACIÓN MEJORADA - TEXTO MÁS OSCURO
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0); // Negro sólido
      pdf.text(' REPORTE DE PRONÓSTICO', 105, 20, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60); // Gris oscuro
      pdf.text(`Generado: ${date}`, 105, 28, { align: 'center' });

      const methodName = this.getMethodDisplayName() || 'Método no especificado';
      pdf.text(`Método: ${methodName}`, 105, 34, { align: 'center' });

      // Línea separadora
      pdf.setDrawColor(100, 100, 100);
      pdf.line(15, 40, 195, 40);

      // MÉTRICAS CON MEJOR CONTRASTE
      let y = 50;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('RESUMEN DE MÉTRICAS', 20, y);

      y += 10;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);

      // Función auxiliar para añadir métricas con buen contraste
      const addMetric = (label: string, value: string, yPos: number) => {
        pdf.setTextColor(40, 40, 40); // Gris muy oscuro
        pdf.text(`${label}:`, 25, yPos);
        pdf.setTextColor(0, 0, 0); // Negro para valores
        pdf.text(value, 80, yPos);
      };

      addMetric('Precisión General', `${this.forecastMetrics.accuracy.toFixed(1)}%`, y);
      y += 7;
      addMetric('Error MAPE', `${this.forecastMetrics.mape.toFixed(1)}%`, y);
      y += 7;
      addMetric('Error MAE', this.formatCurrency(this.forecastMetrics.mae), y);
      y += 7;
      addMetric('Períodos Analizados', this.historicalData.length.toString(), y);

      // TABLA DE RESULTADOS MEJORADA
      y += 15;
      if (y > 250) {
        pdf.addPage();
        y = 30;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text('DETALLE DE PRONÓSTICOS', 20, y);
      y += 8;

      // Cabecera de tabla con fondo oscuro y texto blanco
      pdf.setFillColor(60, 60, 60);
      pdf.rect(15, y - 5, 180, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);

      pdf.text('FECHA', 20, y);
      pdf.text('VENTAS', 60, y);
      pdf.text('INTERVALO', 110, y);
      pdf.text('ERROR', 170, y);

      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');

      // Datos de la tabla
      this.forecastResults.forEach((result, index) => {
        if (y > 270) {
          pdf.addPage();
          y = 20;
          // Redibujar cabecera
          pdf.setFillColor(60, 60, 60);
          pdf.rect(15, y - 5, 180, 8, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.text('FECHA', 20, y);
          pdf.text('VENTAS', 60, y);
          pdf.text('INTERVALO', 110, y);
          pdf.text('ERROR', 170, y);
          pdf.setTextColor(0, 0, 0);
          y += 10;
        }

        y += 6;

        // Fecha - Texto oscuro
        pdf.setTextColor(0, 0, 0);
        pdf.text(result.fecha.substring(0, 10), 20, y);

        // Ventas Previstas
        pdf.text(this.formatCurrency(result.ventas_previstas), 60, y);

        // Intervalo
        const intervalo = `${this.formatCurrency(result.intervalo_confianza.inferior)} - ${this.formatCurrency(result.intervalo_confianza.superior)}`;
        pdf.text(intervalo, 110, y);

        // Error % con colores pero manteniendo contraste
        if (result.error_porcentual !== undefined) {
          const error = result.error_porcentual;
          // Colores más oscuros para mejor impresión
          if (error > 30) pdf.setTextColor(200, 0, 0); // Rojo oscuro
          else if (error > 20) pdf.setTextColor(180, 80, 0); // Naranja oscuro
          else if (error > 10) pdf.setTextColor(0, 120, 0); // Verde oscuro
          else pdf.setTextColor(0, 100, 50); // Verde muy oscuro

          pdf.text(`${error.toFixed(1)}%`, 170, y);
          pdf.setTextColor(0, 0, 0);
        } else {
          pdf.setTextColor(100, 100, 100);
          pdf.text('N/A', 170, y);
          pdf.setTextColor(0, 0, 0);
        }
      });

      // RECOMENDACIONES CON MEJOR LEGIBILIDAD
      y += 15;
      if (y > 250) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text('RECOMENDACIONES', 20, y);

      y += 10;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(40, 40, 40); // Gris oscuro para mejor lectura

      this.getErrorRecommendations().forEach((recommendation, idx) => {
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(`• ${recommendation}`, 25, y);
        y += 6;
      });

      // PIE DE PÁGINA VISIBLE
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(80, 80, 80); // Gris oscuro
        pdf.text(`Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
        pdf.text(`Sistema de Pronósticos - ${date}`, 105, 290, { align: 'center' });
      }

      // Guardar
      const fileName = `reporte_pronostico_${date.replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);

      this.success = '✅ Reporte PDF generado correctamente';

    } catch (error) {
      console.error('Error generando PDF estructurado:', error);
      this.error = '❌ Error al generar el reporte PDF';
    } finally {
      this.loading = false;
      setTimeout(() => {
        this.success = null;
        this.error = null;
      }, 5000);
    }
  }

  // Método auxiliar para añadir métricas
  private addMetric(pdf: any, label: string, value: string, x: number, y: number) {
    pdf.setTextColor(80, 80, 80);
    pdf.text(`${label}:`, x, y);
    pdf.setTextColor(40, 40, 40);
    pdf.text(value, x + 45, y);
  }
}
