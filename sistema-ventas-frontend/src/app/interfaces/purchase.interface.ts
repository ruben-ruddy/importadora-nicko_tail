// interfaces/purchase.interface.ts
export interface Purchase {
  id_compra?: string;
  id_usuario: string;
  numero_compra: string;
  fecha_compra?: string | Date; // ← Hacer opcional
  //fecha_compra_display?: string;
  total: number;
  estado: 'pendiente' | 'completada' | 'cancelada';
  observaciones?: string;
  detalle_compras: PurchaseDetail[];
  user?: {
    id_usuario: string;
    nombre_completo: string;
    email: string;
    nombre_usuario: string;
  };
}

export interface PurchaseDetail {
  id_detalle_compra?: string; // Hacer opcional para nuevos detalles
  id_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  producto?: {
    id_producto: string;
    nombre_producto: string;
    precio_compra: number;
    precio_venta: number;
    descripcion?: string;
  };
}