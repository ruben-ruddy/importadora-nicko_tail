// sistema-ventas-frontend/src/app/modules/forecast/types.ts
// Define types and interfaces for the Forecast module
export interface ForecastRequest {
  metodo: 'lineal' | 'promedio_movil' | 'estacional';
  periodo: 'diario' | 'semanal' | 'mensual';
  fecha_inicio: string;
  fecha_fin: string;
  productos?: string[];
  categorias?: string[];
  parametros?: {
    periodos?: number;
    alpha?: number;
    estacionalidad?: number;
  };
}

export interface ForecastResult {
  fecha: string;
  ventas_previstas: number;
  ventas_reales?: number;
  intervalo_confianza: {
    inferior: number;
    superior: number;
  };
  metrica_precision?: number;
}

export interface HistoricalData {
  fecha: string;
  ventas: number;
  producto?: string;
  categoria?: string;
}

export interface ForecastMetrics {
  totalSales: number;
  averageSales: number;
  growthRate: number;
  accuracy: number;
  periods: number;
}

// Nueva interfaz para el reporte de productos más vendidos
export interface TopProduct {
  producto: string;
  ventas_totales: number;
}

// types.ts - Interfaces adicionales

export type TabType = 'config' | 'results' | 'reports' | 'productAnalysis';

export interface TopSellingDate {
  fecha: string;
  total_ventas: number;
  cantidad_transacciones: number;
}

export interface TopProduct {
  producto_id: string;
  producto_nombre: string;
  categoria: string;
  cantidad_vendida: number;
  ingresos_totales: number;
  porcentaje_del_total: number;
}

export interface DateProductAnalysis {
  fecha: string;
  productos: TopProduct[];
}