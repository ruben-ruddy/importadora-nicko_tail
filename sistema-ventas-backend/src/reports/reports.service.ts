// src/reports/reports.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { 
  SalesReportResponse, 
  PurchasesReportResponse,
  VendedorVentas,
  VentasPorDia,
  ProductoVendido,
  ProductoComprado
} from './interfaces/report-response.interface';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async generateSalesReport(query: ReportQueryDto): Promise<SalesReportResponse> {
    const { startDate, endDate, userId } = query;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Obtener ventas filtradas
    const ventas = await this.prisma.sale.findMany({
      where: {
        fecha_venta: {
          gte: start,
          lte: end
        },
        ...(userId && { id_usuario: userId })
      },
      include: {
        user: {
          select: {
            id_usuario: true,
            nombre_completo: true
          }
        },
        detalle_ventas: {
          include: {
            producto: {
              select: {
                id_producto: true,
                nombre_producto: true
              }
            }
          }
        }
      }
    });

    // Calcular métricas
    const total_ingresos = ventas.reduce((sum, venta) => sum + Number(venta.total), 0);
    const cantidad_ventas = ventas.length;

    // Ventas por vendedor
    const ventasPorVendedor = await this.calculateSalesByVendor(ventas, total_ingresos);

    // Ventas por día
    const ventasPorDia = this.calculateSalesByDay(ventas);

    // Productos más vendidos
    const productosMasVendidos = this.calculateTopProducts(ventas);

    return {
      fecha_inicio: startDate,
      fecha_fin: endDate,
      total_ventas: total_ingresos,
      total_ingresos,
      cantidad_ventas,
      ventas_por_vendedor: ventasPorVendedor,
      ventas_por_dia: ventasPorDia,
      productos_mas_vendidos: productosMasVendidos
    };
  }

  async generatePurchasesReport(query: ReportQueryDto): Promise<PurchasesReportResponse> {
    const { startDate, endDate } = query;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Obtener compras filtradas
    const compras = await this.prisma.purchase.findMany({
      where: {
        fecha_compra: {
          gte: start,
          lte: end
        }
      },
      include: {
        detalle_compras: {
          include: {
            producto: {
              select: {
                id_producto: true,
                nombre_producto: true
              }
            }
          }
        }
      }
    });

    // Calcular métricas
    const total_egresos = compras.reduce((sum, compra) => sum + Number(compra.total), 0);
    const cantidad_compras = compras.length;

    // Productos más comprados
    const productosMasComprados = this.calculateTopPurchasedProducts(compras);

    return {
      fecha_inicio: startDate,
      fecha_fin: endDate,
      total_compras: total_egresos,
      total_egresos,
      cantidad_compras,
      compras_por_proveedor: [], // Puedes implementar esto si tienes proveedores
      productos_mas_comprados: productosMasComprados
    };
  }

  private async calculateSalesByVendor(ventas: any[], totalVentas: number): Promise<VendedorVentas[]> {
    const vendorMap = new Map<string, VendedorVentas>();

    ventas.forEach(venta => {
      if (!vendorMap.has(venta.id_usuario)) {
        vendorMap.set(venta.id_usuario, {
          id_usuario: venta.id_usuario,
          nombre_completo: venta.user?.nombre_completo || 'Vendedor no disponible',
          cantidad_ventas: 0,
          total_ventas: 0,
          porcentaje: 0
        });
      }

      const vendor = vendorMap.get(venta.id_usuario)!;
      vendor.cantidad_ventas += 1;
      vendor.total_ventas += Number(venta.total);
    });

    // Calcular porcentajes
    const result = Array.from(vendorMap.values()).map(vendor => ({
      ...vendor,
      porcentaje: totalVentas > 0 ? Number(((vendor.total_ventas / totalVentas) * 100).toFixed(2)) : 0
    }));

    return result.sort((a, b) => b.total_ventas - a.total_ventas);
  }

  private calculateSalesByDay(ventas: any[]): VentasPorDia[] {
    const dayMap = new Map<string, VentasPorDia>();

    ventas.forEach(venta => {
      const saleDate = new Date(venta.fecha_venta);
      const dateKey = saleDate.toISOString().split('T')[0];

      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, {
          fecha: dateKey,
          cantidad_ventas: 0,
          total_ventas: 0
        });
      }

      const day = dayMap.get(dateKey)!;
      day.cantidad_ventas += 1;
      day.total_ventas += Number(venta.total);
    });

    return Array.from(dayMap.values()).sort((a, b) => 
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );
  }

  private calculateTopProducts(ventas: any[]): ProductoVendido[] {
    const productMap = new Map<string, ProductoVendido>();

    ventas.forEach(venta => {
      venta.detalle_ventas.forEach((detalle: any) => {
        const productId = detalle.id_producto;
        
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            id_producto: productId,
            nombre_producto: detalle.producto?.nombre_producto || 'Producto no disponible',
            cantidad_vendida: 0,
            total_ventas: 0
          });
        }

        const product = productMap.get(productId)!;
        product.cantidad_vendida += detalle.cantidad;
        product.total_ventas += Number(detalle.subtotal);
      });
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.cantidad_vendida - a.cantidad_vendida)
      .slice(0, 10);
  }

  private calculateTopPurchasedProducts(compras: any[]): ProductoComprado[] {
    const productMap = new Map<string, ProductoComprado>();

    compras.forEach(compra => {
      compra.detalle_compras.forEach((detalle: any) => {
        const productId = detalle.id_producto;
        
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            id_producto: productId,
            nombre_producto: detalle.producto?.nombre_producto || 'Producto no disponible',
            cantidad_comprada: 0,
            total_compras: 0
          });
        }

        const product = productMap.get(productId)!;
        product.cantidad_comprada += detalle.cantidad;
        product.total_compras += Number(detalle.subtotal);
      });
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.cantidad_comprada - a.cantidad_comprada)
      .slice(0, 10);
  }
}