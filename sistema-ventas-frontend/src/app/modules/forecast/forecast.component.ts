// sistema-ventas-frontend/src/app/modules/forecast/forecast.component.ts
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ForecastService } from './forecast.service';
import { ForecastRequest, ForecastResult, HistoricalData, ForecastMetrics, ModelInfo, TopSellingDate, TopProduct, DateProductAnalysis } from './types';
import { environment } from '../../../environments/environment';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';

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
  infoMessage: string | null = null;
  activeTab: 'config' | 'results' | 'reports' | 'productAnalysis' = 'config';
  forecastRequest: ForecastRequest = {
    metodo: 'promedio_movil',
    periodo: 'mensual',
    fecha_inicio: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fecha_fin: new Date().toISOString().split('T')[0],
    parametros: {
      periodos: 6,
      ventana: 3,
      alpha: 0.3
    }
  };

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

  totalSales = 0;
  averageSales = 0;
  growthRate = 0;

  // Referencia al gráfico
  @ViewChild(BaseChartDirective) chart!: BaseChartDirective;

  // Configuración de gráficos
  public salesChartType: ChartType = 'line';
  public productsChartType: ChartType = 'bar';
  public accuracyChartType: ChartType = 'doughnut';

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
          text: 'Período'
        }
      }
    }
  };

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

  public accuracyChartData: ChartConfiguration['data'] = {
    labels: ['Precisión', 'Error'],
    datasets: [
      {
        data: [0, 100],
        backgroundColor: ['#10B981', '#EF4444']
      }
    ]
  };

  public accuracyChartOptions: ChartConfiguration['options'] = {
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
    setTimeout(() => {
      this.updateCharts();
    }, 100);
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
      const response = await this.forecastService.generateForecast(this.forecastRequest);

      this.forecastResults = response.results;
      this.forecastMetrics = response.metrics;
      this.modelInfo = response.model_info || null;

      this.activeTab = 'results';
      this.success = 'Pronóstico generado correctamente';

      setTimeout(() => {
        this.updateCharts();
      }, 100);

    } catch (error: any) {
      this.error = error.message || 'Error al generar el pronóstico';
      console.error('Error generating forecast:', error);
    } finally {
      this.loading = false;
    }
  }

  private updateCharts() {
    this.updateSalesChart();
    this.updateProductsChart();
    this.updateAccuracyChart();
  }

  private updateSalesChart() {
    if (this.historicalData.length === 0 && this.forecastResults.length === 0) return;

    const historicalLabels = this.historicalData.map(item => {
      if (this.forecastRequest.periodo === 'mensual') {
        return item.fecha.substring(0, 7);
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

  private calculateStatistics() {
    this.totalSales = this.historicalData.reduce((sum, item) => sum + item.ventas, 0);
    this.averageSales = this.historicalData.length > 0 ? this.totalSales / this.historicalData.length : 0;

    if (this.historicalData.length > 1) {
      const first = this.historicalData[0].ventas;
      const last = this.historicalData[this.historicalData.length - 1].ventas;
      this.growthRate = first > 0 ? ((last - first) / first) * 100 : 0;
    }
  }

  getErrorClass(error: number | undefined): string {
    if (error === undefined) return 'text-gray-500 bg-gray-100';
    if (error <= 10) return 'text-green-600 bg-green-50';
    if (error <= 20) return 'text-yellow-600 bg-yellow-50';
    if (error <= 30) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  }

  getPrecisionClass(precision: number | undefined): string {
    if (precision === undefined) return 'text-gray-500';
    if (precision >= 80) return 'text-green-600';
    if (precision >= 60) return 'text-yellow-600';
    return 'text-red-600';
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

  get totalForecastedSales(): number {
    return this.forecastResults.reduce((sum, r) => sum + r.ventas_previstas, 0);
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
    // Verificar si el componente sigue activo
    if (this.destroy$.closed) {
      console.log('Componente destruido, cancelando carga de productos');
      return;
    }

    try {
      this.productsLoading = true;
      this.selectedDateForAnalysis = date;
      this.error = null;
      this.infoMessage = null;

      console.log('📦 Cargando productos para:', date);
      
      // Usar firstValueFrom con manejo de destrucción
      const products = await this.forecastService.getTopProductsByDate(date, 10);
      
      // Verificar nuevamente si el componente sigue activo
      if (this.destroy$.closed) {
        return;
      }

      this.selectedDateProducts = products;
      console.log('📦 Productos cargados:', this.selectedDateProducts.length);
      
      if (this.selectedDateProducts.length === 0) {
        this.infoMessage = 'No se encontraron productos para esta fecha.';
      }

      // Actualizar el gráfico
      this.updateProductsChart();

    } catch (error: any) {
      if (!this.destroy$.closed) {
        console.error('❌ Error loading products:', error);
        this.error = error.message || 'Error al cargar los productos.';
        this.selectedDateProducts = [];
      }
    } finally {
      if (!this.destroy$.closed) {
        this.productsLoading = false;
      }
    }
  }

  ngOnDestroy() {
    // Limpiar todas las suscripciones
    this.destroy$.next();
    this.destroy$.complete();
    console.log('Componente ForecastComponent destruido');
  }

  get hasTopSellingDates(): boolean {
    return this.topSellingDates.length > 0;
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

  exportStructuredPDF() {
    const pdf = new jsPDF();
    const date = new Date().toLocaleDateString('es-ES');

    // Encabezado
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text('REPORTE DE PRONÓSTICO - PROMEDIO MÓVIL', 105, 20, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.text(`Generado: ${date}`, 105, 28, { align: 'center' });

    // Métricas
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('RESUMEN DE MÉTRICAS', 20, 50);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);

    this.addMetric(pdf, 'Precisión General', `${this.forecastMetrics.accuracy.toFixed(1)}%`, 25, 60);
    this.addMetric(pdf, 'Error MAPE', `${this.forecastMetrics.mape.toFixed(1)}%`, 25, 67);
    this.addMetric(pdf, 'Error MAE', this.formatCurrency(this.forecastMetrics.mae), 25, 74);
    this.addMetric(pdf, 'Períodos Analizados', this.historicalData.length.toString(), 25, 81);

    // Tabla de resultados
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('DETALLE DE PRONÓSTICOS', 20, 95);

    // Preparar datos para la tabla
    const tableData = this.forecastResults.map(result => [
      result.fecha,
      this.formatCurrency(result.ventas_previstas),
      this.formatCurrency(result.intervalo_confianza.inferior) + ' - ' + this.formatCurrency(result.intervalo_confianza.superior),
      result.metrica_precision ? `${result.metrica_precision.toFixed(1)}%` : 'N/A'
    ]);

    // Crear tabla
    autoTable(pdf, {
      head: [['Fecha', 'Ventas Previstas', 'Intervalo de Confianza', 'Precisión']],
      body: tableData,
      startY: 100,
      theme: 'grid',
      headStyles: {
        fillColor: [60, 60, 60],
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
  }

  private addMetric(pdf: any, label: string, value: string, x: number, y: number) {
    pdf.setTextColor(80, 80, 80);
    pdf.text(`${label}:`, x, y);
    pdf.setTextColor(40, 40, 40);
    pdf.text(value, x + 45, y);
  }
}