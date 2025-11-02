// interfaces/report.interface.ts
// Definición de las interfaces para los reportes de ventas y compras
export interface ReportFilters {
  fecha_inicio: string;
  fecha_fin: string;
  tipo_reporte: 'ventas' | 'compras' | 'ambos';
  id_usuario?: string;
}

// Definición de la interfaz SalesReport para los reportes de ventas
export interface SalesReport {
  fecha_inicio: string;
  fecha_fin: string;
  total_ventas: number;
  total_ingresos: number;
  cantidad_ventas: number;
  ventas_por_vendedor: VendedorVentas[];
  ventas_por_dia: VentasPorDia[];
  productos_mas_vendidos: ProductoVendido[];
}

// Definición de la interfaz PurchasesReport para los reportes de compras
export interface PurchasesReport {
  fecha_inicio: string;
  fecha_fin: string;
  total_compras: number;
  total_egresos: number;
  cantidad_compras: number;
  compras_por_proveedor: any[];
  productos_mas_comprados: ProductoComprado[];
}

// Definición de interfaces auxiliares
export interface VendedorVentas {
  id_usuario: string;
  nombre_completo: string;
  cantidad_ventas: number;
  total_ventas: number;
  porcentaje: number;
}

// Definición de la interfaz VentasPor
export interface VentasPorDia {
  fecha: string;
  cantidad_ventas: number;
  total_ventas: number;
}

// Definición de la interfaz ProductoVendido
export interface ProductoVendido {
  id_producto: string;
  nombre_producto: string;
  cantidad_vendida: number;
  total_ventas: number;
}

// Definición de la interfaz ProductoComprado
export interface ProductoComprado {
  id_producto: string;
  nombre_producto: string;
  cantidad_comprada: number;
  total_compras: number;
}