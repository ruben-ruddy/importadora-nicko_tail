// sistema-ventas-frontend/src/app/modules/forecast/types.ts
export interface ForecastRequest {
  metodo: 'promedio_movil';
  periodo: 'mensual';
  fecha_inicio: string;
  fecha_fin: string;
  parametros: {
    periodos: number;
    ventana: number;
    alpha: number;
  };
}

export interface ForecastResult {
  fecha: string;
  ventas_previstas: number;
  intervalo_confianza: {
    inferior: number;
    superior: number;
  };
  metrica_precision?: number;
}

export interface HistoricalData {
  fecha: string;
  ventas: number;
}

export interface ForecastMetrics {
  mape: number;
  mae: number;
  rmse: number;
  accuracy: number;
}

export interface ModelInfo {
  type: string;
  window_size?: number;
  alpha?: number;
}

export interface TopSellingDate {
  fecha: string;
  total_ventas: number;
  cantidad_transacciones: number;
  cantidad_productos: number;
}

export interface TopProduct {
  producto_id: string;
  producto_nombre: string;
  categoria: string;
  cantidad_vendida: number;
  ingresos_totales: number;
  porcentaje_del_total: number;
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