// src/reports/interfaces/report-response.interface.ts
export interface SalesReportResponse {
  fecha_inicio: string;
  fecha_fin: string;
  total_ventas: number;
  total_ingresos: number;
  cantidad_ventas: number;
  ventas_por_vendedor: VendedorVentas[];
  ventas_por_dia: VentasPorDia[];
  productos_mas_vendidos: ProductoVendido[];
}

export interface PurchasesReportResponse {
  fecha_inicio: string;
  fecha_fin: string;
  total_compras: number;
  total_egresos: number;
  cantidad_compras: number;
  compras_por_proveedor: any[];
  productos_mas_comprados: ProductoComprado[];
}

export interface VendedorVentas {
  id_usuario: string;
  nombre_completo: string;
  cantidad_ventas: number;
  total_ventas: number;
  porcentaje: number;
}

export interface VentasPorDia {
  fecha: string;
  cantidad_ventas: number;
  total_ventas: number;
}

export interface ProductoVendido {
  id_producto: string;
  nombre_producto: string;
  cantidad_vendida: number;
  total_ventas: number;
}

export interface ProductoComprado {
  id_producto: string;
  nombre_producto: string;
  cantidad_comprada: number;
  total_compras: number;
}