// sistema-ventas-frontend/src/app/modules/forecast/types.ts
// Definiciones de tipos para el módulo de pronóstico
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
// Definición de la interfaz ForecastResult para los resultados del pronóstico
export interface ForecastResult {
  fecha: string;
  ventas_previstas: number;
  intervalo_confianza: {
    inferior: number;
    superior: number;
  };
  metrica_precision?: number;
}
// Definición de la interfaz HistoricalData para los datos históricos de ventas
export interface HistoricalData {
  fecha: string;
  ventas: number;
}
// Definición de la interfaz ForecastMetrics para las métricas del pronóstico
export interface ForecastMetrics {
  mape: number;
  mae: number;
  rmse: number;
  accuracy: number;
}
// Definición de la interfaz ModelInfo para la información del modelo utilizado
export interface ModelInfo {
  type: string;
  window_size?: number;
  alpha?: number;
}
// Definición de la interfaz TopSellingDate para las fechas con mayores ventas
export interface TopSellingDate {
  fecha: string;
  total_ventas: number;
  cantidad_transacciones: number;
  cantidad_productos: number;
}
// Definición de la interfaz TopProduct para los productos más vendidos
export interface TopProduct {
  producto_id: string;
  producto_nombre: string;
  categoria: string;
  cantidad_vendida: number;
  ingresos_totales: number;
  porcentaje_del_total: number;
}
// Definición de la interfaz ForecastResponse para la respuesta del pronóstico
export interface ForecastResponse {
  results: ForecastResult[];
  metrics: ForecastMetrics;
  model_info?: ModelInfo;
}
// Definición de la interfaz HistoryQuery para las consultas de historial
export interface HistoryQuery {
  fecha_inicio: string;
  fecha_fin: string;
  periodo: string;
}
// Definición de la interfaz TopDatesQuery para las consultas de fechas con mayores ventas
export interface TopDatesQuery {
  fecha_inicio: string;
  fecha_fin: string;
  periodo: string;
  limit?: number;
}