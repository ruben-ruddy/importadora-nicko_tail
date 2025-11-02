// sistema-ventas-frontend/src/app/modules/forecast/forecast.component.ts
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ForecastService } from './forecast.service';
import { ForecastRequest, ForecastResult, HistoricalData, ForecastMetrics, ModelInfo, TopSellingDate, TopProduct } from './types';
import { environment } from '../../../environments/environment';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Subject, takeUntil } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-forecast',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './forecast.component.html',
  styleUrls: ['./forecast.component.scss']
})
export class ForecastComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  activeTab: 'config' | 'results' | 'productAnalysis' = 'config';
  // Configuración del pronóstico
  forecastRequest: ForecastRequest = {
    metodo: 'promedio_movil',
    periodo: 'mensual',
    fecha_inicio: this.getDefaultStartDate(),
    fecha_fin: this.getDefaultEndDate(),
    parametros: {
      periodos: 6,
      ventana: 3,
      alpha: 0.3
    }
  };

  // Resultados del pronóstico
  forecastResults: ForecastResult[] = [];
  historicalData: HistoricalData[] = [];
  loading = false;
  error: string | null = null;
  success: string | null = null;

  // Propiedades para análisis de productos
  topSellingDates: TopSellingDate[] = [];
  selectedDateProducts: TopProduct[] = [];
  selectedDateForAnalysis: string | null = null;
  productsLoading = false;
  modelInfo: ModelInfo | null = null;

  // Métricas
  forecastMetrics: ForecastMetrics = {
    mape: 0,
    mae: 0,
    rmse: 0,
    accuracy: 0
  };

  // Estadísticas generales
  totalSales = 0;
  averageSales = 0;
  growthRate = 0;

  // Referencia al gráfico
  @ViewChild(BaseChartDirective) chart!: BaseChartDirective;

  // Configuración de gráficos
  public salesChartType: ChartType = 'line';
  public productsChartType: ChartType = 'bar';

  // Datos y opciones del gráfico de ventas
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

  // Opciones del gráfico de ventas
  public salesChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Tendencia de Ventas - Real vs Pronosticado'
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'BOB'
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Monto de Ventas (BOB)'
        },
        ticks: {
          callback: function(value) {
            return new Intl.NumberFormat('es-ES', {
              style: 'currency',
              currency: 'BOB',
              minimumFractionDigits: 0
            }).format(Number(value));
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Mes'
        }
      }
    }
  };

  // Datos y opciones del gráfico de productos más vendidos
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

  //
  public productsChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Productos Más Vendidos'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'BOB'
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    }
  };

  // Datos y opciones del gráfico de ventas históricas
  public historicalChartType: ChartType = 'line';
public historicalChartData: ChartConfiguration['data'] = {
  labels: [],
  datasets: [
    {
      label: 'Ventas Mensuales',
      data: [],
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4
    }
  ]
};

// Opciones del gráfico de ventas históricas
public historicalChartOptions: ChartConfiguration['options'] = {
  responsive: true,
  plugins: {
    title: {
      display: true,
      text: 'Ventas Históricas'
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Ventas (BOB)'
      },
      ticks: {
        callback: function(value) {
          return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'BOB',
            minimumFractionDigits: 0
          }).format(Number(value));
        }
      }
    },
    x: {
      title: {
        display: true,
        text: 'Mes'
      }
    }
  }
};


  constructor(private forecastService: ForecastService) { }

  // Ciclo de vida del componente
  async ngOnInit() {
    await this.loadHistoricalData();
  }

  // Obtener la fecha de inicio por defecto (hace un año)
  private getDefaultStartDate(): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return date.toISOString().substring(0, 7);
  }

  // Obtener la fecha de fin por defecto (mes actual)
  private getDefaultEndDate(): string {
    return new Date().toISOString().substring(0, 7);
  }

  // Cargar datos históricos de ventas
  async loadHistoricalData() {
    try {
      this.loading = true;
      this.error = null;
      this.success = null;

      this.historicalData = await this.forecastService.getSalesHistory({
        fecha_inicio: this.forecastRequest.fecha_inicio,
        fecha_fin: this.forecastRequest.fecha_fin,
        periodo: this.forecastRequest.periodo
      });

      this.calculateStatistics();
      
      if (this.historicalData.length === 0) {
        this.error = 'No se encontraron datos de ventas para el período seleccionado';
      } else {
        this.success = `Se cargaron ${this.historicalData.length} meses de datos históricos`;
      }

    } catch (error: any) {
      this.handleError(error, 'cargar datos históricos');
    } finally {
      this.loading = false;
    }
  }

  // Calcular estadísticas generales
  async generateForecast() {
    this.loading = true;
    this.error = null;
    this.success = null;

    try {
      // Validaciones previas
      if (this.historicalData.length < this.forecastRequest.parametros.ventana) {
        throw new Error(`Se necesitan al menos ${this.forecastRequest.parametros.ventana} meses de datos históricos`);
      }

      const response = await this.forecastService.generateForecast(this.forecastRequest);
      
      this.forecastResults = response.results;
      this.forecastMetrics = response.metrics;
      this.modelInfo = response.model_info || null;

      this.activeTab = 'results';
      this.success = `Pronóstico generado para ${this.forecastResults.length} meses futuros`;

      // Actualizar gráficos
      setTimeout(() => {
        this.updateSalesChart();
      }, 100);

    } catch (error: any) {
      this.handleError(error, 'generar el pronóstico');
    } finally {
      this.loading = false;
    }
  }

  // Calcular estadísticas generales de ventas
  private updateSalesChart() {
    if (this.historicalData.length === 0 && this.forecastResults.length === 0) return;

    const historicalLabels = this.historicalData.map(item => item.fecha);
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

  // Calcular estadísticas generales de ventas
  private updateProductsChart() {
    if (!this.selectedDateProducts || this.selectedDateProducts.length === 0) return;

    const topProducts = this.selectedDateProducts.slice(0, 8);

    this.productsChartData = {
      labels: topProducts.map(p => {
        const name = p.producto_nombre;
        return name.length > 20 ? name.substring(0, 20) + '...' : name;
      }),
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


  // Calcular estadísticas generales de ventas
  getErrorClass(precision: number | undefined): string {
    if (precision === undefined || precision === null) return 'text-gray-500 bg-gray-100';
    if (precision >= 80) return 'text-green-600 bg-green-50';
    if (precision >= 60) return 'text-yellow-600 bg-yellow-50';
    if (precision >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  }

  // Calcular estadísticas generales de ventas
  getPrecisionClass(precision: number | undefined): string {
    if (precision === undefined) return 'text-gray-500';
    if (precision >= 80) return 'text-green-600';
    if (precision >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }
// Calcular estadísticas generales de ventas
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'BOB'
    }).format(value);
  }

  // Calcular estadísticas generales de ventas
  get totalForecastedSales(): number {
    return this.forecastResults.reduce((sum, r) => sum + r.ventas_previstas, 0);
  }

  // Cargar los meses con mayores ventas
  async loadTopSellingDates() {
    try {
      this.loading = true;
      this.error = null;

      this.topSellingDates = await this.forecastService.getTopSellingDates({
        fecha_inicio: this.forecastRequest.fecha_inicio,
        fecha_fin: this.forecastRequest.fecha_fin,
        periodo: this.forecastRequest.periodo,
        limit: 10
      });

      if (this.topSellingDates.length === 0) {
        this.error = 'No se encontraron meses con ventas significativas';
      }

    } catch (error: any) {
      this.handleError(error, 'cargar meses con mayores ventas');
    } finally {
      this.loading = false;
    }
  }

  // Cargar los productos más vendidos para una fecha seleccionada
  async loadTopProductsForDate(date: string) {
    if (this.destroy$.closed) return;

    try {
      this.productsLoading = true;
      this.selectedDateForAnalysis = date;
      this.error = null;

      this.selectedDateProducts = await this.forecastService.getTopProductsByDate(date, 10);
      
      if (this.selectedDateProducts.length === 0) {
        this.error = 'No se encontraron productos para este mes';
      } else {
        this.updateProductsChart();
      }

    } catch (error: any) {
      if (!this.destroy$.closed) {
        this.handleError(error, 'cargar productos del mes');
        this.selectedDateProducts = [];
      }
    } finally {
      if (!this.destroy$.closed) {
        this.productsLoading = false;
      }
    }
  }

  // Calcular estadísticas generales de ventas
  private handleError(error: any, action: string) {
    console.error(`Error al ${action}:`, error);
    
    if (error.status === 404) {
      this.error = `No se encontraron datos para ${action}`;
    } else if (error.status === 400) {
      this.error = `Datos inválidos: ${error.error?.message || error.message}`;
    } else if (error.status === 500) {
      this.error = 'Error del servidor. Por favor, intente más tarde.';
    } else if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
      this.error = 'Error de conexión. Verifique su internet e intente nuevamente.';
    } else {
      this.error = error.message || `Error al ${action}`;
    }
  }

  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get hasTopSellingDates(): boolean {
    return this.topSellingDates.length > 0;
  }

  
  exportToCSV() {
    try {
      const csvContent = this.convertToCSV();
      this.downloadCSV(csvContent, 'pronostico_ventas_mensual.csv');
      this.success = 'Archivo CSV exportado correctamente';
    } catch (error) {
      this.error = 'Error al exportar el archivo CSV';
    }
  }

  // Convertir los resultados del pronóstico a formato CSV
  private convertToCSV(): string {
    const headers = ['Mes', 'Ventas Previstas', 'Límite Inferior', 'Límite Superior', 'Precisión'];
    const rows = this.forecastResults.map(result => [
      result.fecha,
      result.ventas_previstas.toFixed(2),
      result.intervalo_confianza.inferior.toFixed(2),
      result.intervalo_confianza.superior.toFixed(2),
      result.metrica_precision ? `${result.metrica_precision.toFixed(1)}%` : 'N/A'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  // Descargar el archivo CSV
  private downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Exportar el reporte a PDF
  exportStructuredPDF() {
    try {
      const pdf = new jsPDF();
      const date = new Date().toLocaleDateString('es-ES');

      // Encabezado
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text('REPORTE DE PRONÓSTICO DE VENTAS MENSUALES', 105, 20, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.text(`Generado: ${date}`, 105, 28, { align: 'center' });
      pdf.text(`Período analizado: ${this.forecastRequest.fecha_inicio} a ${this.forecastRequest.fecha_fin}`, 105, 35, { align: 'center' });

      // Métricas
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('RESUMEN DE MÉTRICAS', 20, 50);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);

      let yPosition = 60;
      this.addMetric(pdf, 'Precisión General', `${this.forecastMetrics.accuracy.toFixed(1)}%`, 25, yPosition); yPosition += 7;
      this.addMetric(pdf, 'Error MAPE', `${this.forecastMetrics.mape.toFixed(1)}%`, 25, yPosition); yPosition += 7;
      this.addMetric(pdf, 'Error MAE', this.formatCurrency(this.forecastMetrics.mae), 25, yPosition); yPosition += 7;
      this.addMetric(pdf, 'Meses Analizados', this.historicalData.length.toString(), 25, yPosition); yPosition += 7;
      this.addMetric(pdf, 'Meses Pronosticados', this.forecastResults.length.toString(), 25, yPosition);

      // Tabla de resultados
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('DETALLE DE PRONÓSTICOS MENSUALES', 20, 95);

      // Preparar datos para la tabla
      const tableData = this.forecastResults.map(result => [
        result.fecha,
        this.formatCurrency(result.ventas_previstas),
        this.formatCurrency(result.intervalo_confianza.inferior) + ' - ' + this.formatCurrency(result.intervalo_confianza.superior),
        result.metrica_precision ? `${result.metrica_precision.toFixed(1)}%` : 'N/A'
      ]);

      // Crear tabla
      autoTable(pdf, {
        head: [['Mes', 'Ventas Previstas', 'Intervalo de Confianza', 'Precisión']],
        body: tableData,
        startY: 100,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        }
      });

      // Guardar
      const fileName = `reporte_pronostico_${date.replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);
      this.success = 'Reporte PDF generado correctamente';

    } catch (error) {
      this.error = 'Error al generar el reporte PDF';
    }
  }

  // Agregar una métrica al PDF
  private addMetric(pdf: any, label: string, value: string, x: number, y: number) {
    pdf.setTextColor(80, 80, 80);
    pdf.text(`${label}:`, x, y);
    pdf.setTextColor(40, 40, 40);
    pdf.text(value, x + 45, y);
  }

  private updateHistoricalChart() {
  if (this.historicalData.length === 0) return;

  const labels = this.historicalData.map(item => item.fecha);
  const data = this.historicalData.map(item => item.ventas);

  this.historicalChartData = {
    labels: labels,
    datasets: [
      {
        label: 'Ventas Mensuales',
        data: data,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };
}

// Calcular la tasa de crecimiento real
getSalesPattern(): string {
  if (this.historicalData.length < 3) return 'Datos insuficientes para análisis';
  
  const sales = this.historicalData.map(item => item.ventas);
  const firstHalf = sales.slice(0, Math.floor(sales.length / 2));
  const secondHalf = sales.slice(Math.floor(sales.length / 2));
  
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const growth = ((avgSecond - avgFirst) / avgFirst) * 100;
  
  if (Math.abs(growth) < 5) return 'Tendencia estable';
  if (growth > 10) return 'Tendencia creciente';
  if (growth < -10) return 'Tendencia decreciente';
  return 'Tendencia variable';
}

// Calcular el nivel de volatilidad
getVolatilityLevel(): string {
  if (this.historicalData.length < 2) return 'Datos insuficientes';
  
  const sales = this.historicalData.map(item => item.ventas);
  const average = sales.reduce((a, b) => a + b, 0) / sales.length;
  const deviations = sales.map(sale => Math.abs(sale - average));
  const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
  const volatility = (avgDeviation / average) * 100;
  
  if (volatility < 15) return 'Baja volatilidad';
  if (volatility < 30) return 'Volatilidad moderada';
  return 'Alta volatilidad';
}

// Generar recomendaciones para la ventana
getWindowRecommendation(): string {
  const volatility = this.getVolatilityLevel();
  const pattern = this.getSalesPattern();
  const currentWindow = this.forecastRequest.parametros.ventana;
  
  if (volatility === 'Alta volatilidad' && currentWindow < 4) {
    return '🔍 Recomendación: Aumentar la ventana a 4-5 meses para suavizar la volatilidad';
  }
  
  if (volatility === 'Baja volatilidad' && currentWindow > 3) {
    return '✅ Ventana actual adecuada para datos estables';
  }
  
  if (pattern.includes('creciente') && currentWindow < 4) {
    return '📈 Considera ventana media (3-4) para capturar la tendencia creciente';
  }
  
  return '⚖️ Ventana actual balanceada para el patrón detectado';
}

// Generar recomendaciones para el alpha
getAlphaRecommendation(): string {
  const volatility = this.getVolatilityLevel();
  const currentAlpha = this.forecastRequest.parametros.alpha;
  const dataLength = this.historicalData.length;
  
  if (volatility === 'Alta volatilidad' && currentAlpha > 0.5) {
    return '🛡️ Recomendación: Reducir alpha a 0.2-0.3 para suavizar el ruido';
  }
  
  if (volatility === 'Baja volatilidad' && currentAlpha < 0.4) {
    return '🎯 Considera aumentar alpha a 0.5-0.7 para responder mejor a cambios';
  }
  
  if (dataLength < 6 && currentAlpha > 0.6) {
    return '📊 Con pocos datos, alpha bajo (0.3-0.5) puede ser más estable';
  }
  
  return '⚖️ Alpha actual adecuado para el nivel de volatilidad';
}

// Obtener recomendación combinada
getCurrentRecommendation(): string {
  const windowRec = this.getWindowRecommendation();
  const alphaRec = this.getAlphaRecommendation();
  const volatility = this.getVolatilityLevel();
  
  if (volatility === 'Alta volatilidad') {
    return 'Configuración sugerida: Ventana 4-5, Alpha 0.2-0.3';
  } else if (volatility === 'Baja volatilidad') {
    return 'Configuración sugerida: Ventana 3, Alpha 0.5-0.7';
  } else {
    return 'Configuración sugerida: Ventana 3-4, Alpha 0.3-0.5';
  }
}

updateRecommendations() {
  // Este método se llama cuando cambian los parámetros
  // Podemos forzar la actualización de la vista si es necesario
  setTimeout(() => {
    this.updateHistoricalChart();
  }, 100);
}

// Calcular estadísticas generales de ventas
private calculateStatistics() {
  this.totalSales = this.historicalData.reduce((sum, item) => sum + item.ventas, 0);
  this.averageSales = this.historicalData.length > 0 ? this.totalSales / this.historicalData.length : 0;

  if (this.historicalData.length > 1) {
    this.growthRate = this.calculateRealGrowthRate();
  } else {
    this.growthRate = 0;
  }
  
  this.updateHistoricalChart();
}

// Calcular la tasa de crecimiento real basada en datos históricos
private calculateRealGrowthRate(): number {
  if (this.historicalData.length < 2) return 0;

  // Si hay suficientes datos, usar promedio de últimos meses
  if (this.historicalData.length >= 6) {
    const recentMonths = this.historicalData.slice(-3);
    const earlyMonths = this.historicalData.slice(0, 3);
    
    const avgRecent = recentMonths.reduce((sum, item) => sum + item.ventas, 0) / recentMonths.length;
    const avgEarly = earlyMonths.reduce((sum, item) => sum + item.ventas, 0) / earlyMonths.length;
    
    return avgEarly > 0 ? ((avgRecent - avgEarly) / avgEarly) * 100 : 0;
  } else {
    // Para pocos datos, usar crecimiento mensual promedio
    let totalGrowth = 0;
    let growthCount = 0;

    for (let i = 1; i < this.historicalData.length; i++) {
      const current = this.historicalData[i].ventas;
      const previous = this.historicalData[i - 1].ventas;
      
      if (previous > 0) {
        const monthlyGrowth = ((current - previous) / previous) * 100;
        totalGrowth += monthlyGrowth;
        growthCount++;
      }
    }

    return growthCount > 0 ? totalGrowth / growthCount : 0;
  }
}

// Métodos de recomendaciones inteligentes
getConfidenceLevel(): string {
  if (this.forecastMetrics.accuracy >= 90) return 'MUY ALTO';
  if (this.forecastMetrics.accuracy >= 80) return 'ALTO';
  if (this.forecastMetrics.accuracy >= 70) return 'MODERADO';
  return 'BAJO';
}

getModelGrade(): string {
  if (this.forecastMetrics.accuracy >= 90) return 'A+ EXCELENTE';
  if (this.forecastMetrics.accuracy >= 85) return 'A MUY BUENO';
  if (this.forecastMetrics.accuracy >= 80) return 'B+ BUENO';
  if (this.forecastMetrics.accuracy >= 75) return 'B ACEPTABLE';
  return 'C NECESITA MEJORA';
}

getModelEvaluation(): string {
  const accuracy = this.forecastMetrics.accuracy;
  const mape = this.forecastMetrics.mape;
  
  if (accuracy >= 90) {
    return 'Tu modelo tiene precisión excelente. Puedes confiar plenamente en los pronósticos para decisiones estratégicas.';
  } else if (accuracy >= 85) {
    return 'Precisión muy buena. El modelo es confiable para planificación operativa y presupuestos.';
  } else if (accuracy >= 80) {
    return 'Buena precisión. Recomendado para planificación a corto y mediano plazo.';
  } else if (accuracy >= 75) {
    return 'Precisión aceptable. Útil como guía general, pero verifica con datos actuales.';
  } else {
    return 'Considera ajustar los parámetros o recolectar más datos históricos para mejorar la precisión.';
  }
}

getBusinessRecommendations(): string[] {
  const recommendations: string[] = [];
  const avgMonthly = this.totalForecastedSales / this.forecastResults.length;
  const growthRate = this.growthRate;
  const accuracy = this.forecastMetrics.accuracy;

  // Recomendación basada en precisión
  if (accuracy >= 85) {
    recommendations.push('Puedes planificar tu inventario y personal con alta confianza en estos números.');
  } else {
    recommendations.push('Mantén un margen de seguridad del 15-20% en tu planificación.');
  }

  // Recomendación basada en tendencia
  if (growthRate > 10) {
    recommendations.push('Considera aumentar capacidad para aprovechar la tendencia creciente.');
  } else if (growthRate < -5) {
    recommendations.push('Evalúa estrategias para reactivar las ventas en el corto plazo.');
  } else {
    recommendations.push('Mantén estrategias estables, el mercado muestra comportamiento consistente.');
  }

  // Recomendación basada en volatilidad
  const volatility = this.getVolatilityLevel();
  if (volatility === 'Alta volatilidad') {
    recommendations.push('Diversifica tu inventario para manejar fluctuaciones imprevistas.');
  }

  // Recomendación financiera
  if (avgMonthly > 50000) {
    recommendations.push('Explora oportunidades de inversión o expansión con el flujo proyectado.');
  } else if (avgMonthly > 20000) {
    recommendations.push('Enfócate en optimizar operaciones y mejorar márgenes de utilidad.');
  }

  return recommendations.slice(0, 4); // Máximo 4 recomendaciones
}

getMinimumExpectedRevenue(): number {
  // Usar el límite inferior del primer mes como referencia conservadora
  return this.forecastResults[0].intervalo_confianza.inferior * this.forecastResults.length;
}

getMaximumExpectedRevenue(): number {
  // Usar el límite superior del primer mes como referencia optimista
  return this.forecastResults[0].intervalo_confianza.superior * this.forecastResults.length;
}

// Generar recomendación de presupuesto basada en volatilidad
getBudgetRecommendation(): string {
  const minRevenue = this.getMinimumExpectedRevenue();
  const maxRevenue = this.getMaximumExpectedRevenue();
  const avgRevenue = this.totalForecastedSales;
  
  const volatility = ((maxRevenue - minRevenue) / avgRevenue) * 100;
  
  if (volatility < 20) {
    return 'Baja volatilidad proyectada. Puedes planificar con un presupuesto ajustado.';
  } else if (volatility < 40) {
    return 'Volatilidad moderada. Recomendado mantener un colchón del 15-20% en tu presupuesto.';
  } else {
    return 'Alta volatilidad esperada. Considera presupuestos por escenarios (optimista/conservador).';
  }
}

// Consideraciones importantes para el usuario
getImportantConsiderations(): string[] {
  const considerations: string[] = [];
  const dataMonths = this.historicalData.length;
  const forecastMonths = this.forecastResults.length;

  if (dataMonths < 6) {
    considerations.push('Limitados datos históricos. La precisión mejorará con más meses de data.');
  }

  if (this.forecastMetrics.mape > 20) {
    considerations.push('Error de pronóstico moderado-alto. Monitorea ventas reales mensualmente.');
  }

  if (forecastMonths > 6) {
    considerations.push('Pronósticos a largo plazo (más de 6 meses) tienen mayor incertidumbre.');
  }

  const volatility = this.getVolatilityLevel();
  if (volatility === 'Alta volatilidad') {
    considerations.push('Mercado volátil. Los pronósticos pueden requerir ajustes frecuentes.');
  }

  considerations.push('Actualiza los datos mensualmente para mejorar la precisión del modelo.');

  return considerations;
}

// Evaluar el nivel de riesgo del pronóstico
getRiskLevel(): string {
  const accuracy = this.forecastMetrics.accuracy;
  const dataMonths = this.historicalData.length;
  const volatility = this.getVolatilityLevel();

  if (accuracy >= 85 && dataMonths >= 6 && volatility === 'Baja volatilidad') {
    return 'BAJO';
  } else if (accuracy >= 75 && dataMonths >= 4) {
    return 'MODERADO';
  } else {
    return 'ALTO';
  }
}

// Obtener clase CSS para el nivel de riesgo
getRiskLevelClass(): string {
  const riskLevel = this.getRiskLevel();
  switch (riskLevel) {
    case 'BAJO': return 'bg-green-100 text-green-800';
    case 'MODERADO': return 'bg-yellow-100 text-yellow-800';
    case 'ALTO': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

getRiskExplanation(): string {
  const riskLevel = this.getRiskLevel();
  switch (riskLevel) {
    case 'BAJO':
      return 'Bajo riesgo de desviación. Puedes proceder con confianza en la planificación.';
    case 'MODERADO':
      return 'Riesgo moderado. Recomendado monitoreo mensual y márgenes de seguridad.';
    case 'ALTO':
      return 'Alto riesgo. Verifica pronósticos con datos actuales frecuentemente.';
    default:
      return 'Evalúa factores de riesgo antes de tomar decisiones importantes.';
  }
}

// Generar resumen ejecutivo del pronóstico
getExecutiveSummary(): string {
  const accuracy = this.forecastMetrics.accuracy;
  const totalSales = this.totalForecastedSales;
  const growth = this.growthRate;
  const riskLevel = this.getRiskLevel();

  return `El modelo proyecta ventas anuales de ${this.formatCurrency(totalSales)} con una precisión del ${accuracy.toFixed(1)}%. 
          ${growth >= 0 ? 'Crecimiento positivo del ' + growth.toFixed(1) + '%' : 'Contracción del ' + Math.abs(growth).toFixed(1) + '%'} en la tendencia histórica. 
          Nivel de riesgo ${riskLevel.toLowerCase()}. ${this.getPrimaryRecommendation()}`;
}

// Obtener la recomendación principal basada en métricas clave
getPrimaryRecommendation(): string {
  const accuracy = this.forecastMetrics.accuracy;
  const growth = this.growthRate;

  if (accuracy >= 85 && growth > 5) {
    return 'Condiciones favorables para expansión y crecimiento.';
  } else if (accuracy >= 80 && growth > 0) {
    return 'Estabilidad operativa recomendada con crecimiento orgánico.';
  } else if (growth < 0) {
    return 'Enfoque en estrategias de reactivación y optimización de costos.';
  } else {
    return 'Mantenimiento de operaciones con monitoreo cercano de indicadores.';
  }
}

// Obtener clase CSS para la precisión
getPrecisionBadgeClass(accuracy: number): string {
  if (accuracy >= 90) return 'bg-green-100 text-green-800';
  if (accuracy >= 80) return 'bg-blue-100 text-blue-800';
  if (accuracy >= 70) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

// Obtener ícono para la recomendación
getRecommendationIconClass(index: number): string {
  const icons = ['📈', '💰', '🛒', '👥', '📊', '🎯'];
  return icons[index] || '✅';
}

}