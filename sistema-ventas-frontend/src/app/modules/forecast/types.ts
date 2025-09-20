// sistema-ventas-frontend/src/app/modules/forecast/types.ts
export interface ForecastRequest {
  metodo: 'promedio_movil'; // Cambiado a solo promedio_movil
  periodo: 'diario' | 'semanal' | 'mensual';
  fecha_inicio: string;
  fecha_fin: string;
  parametros: {
    periodos: number;
    ventana: number; // Nuevo parámetro
    alpha: number;   // Nuevo parámetro
  };
}

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

export interface HistoricalData {
  fecha: string;
  ventas: number;
  producto?: string;
  categoria?: string;
}

export interface ForecastMetrics {
  mape: number;
  mae: number;
  rmse: number;
  accuracy: number;
  r2_score?: number; // <-- Agrega esta línea
}

export interface ModelInfo {
  type: string;
  coefficient?: number;
  intercept?: number;
}

export interface TopSellingDate {
  fecha: string;
  total_ventas: number;
  ventas_totales: number;
  cantidad_productos: number;
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

export interface ForecastResponse {
  results: ForecastResult[];
  metrics: ForecastMetrics;
  model_info?: ModelInfo;
}

export interface HistoryQuery {
  fecha_inicio: string;
  fecha_fin: string;
  periodo: string;
}

export interface TopDatesQuery {
  fecha_inicio: string;
  fecha_fin: string;
  periodo: string;
  limit?: number;
}