// src/forecast/interfaces/forecast.interface.ts
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
  producto?: string;
  categoria?: string;
}

// Nuevas interfaces para los endpoints
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