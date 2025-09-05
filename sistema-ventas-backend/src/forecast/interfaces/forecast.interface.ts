// src/forecast/interfaces/forecast.interface.ts
export interface ForecastResult {
  fecha: string;
  ventas_previstas: number;
  ventas_reales?: number;
  error_porcentual?: number;
  intervalo_confianza: {
    inferior: number;
    superior: number;
  };
  metrica_precision?: number;
}

export interface ForecastResponse {
  results: ForecastResult[];
  metrics: {
    mape: number;
    mae: number;
    rmse: number;
    accuracy: number;
  };
}

export interface ForecastMetrics {
  mape: number;
  mae: number;
  rmse: number;
  accuracy: number;
  totalSales?: number;
  averageSales?: number;
  growthRate?: number;
  periods?: number;
}

export interface HistoricalData {
  fecha: string;
  ventas: number;
  producto?: string;
  categoria?: string;
}

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