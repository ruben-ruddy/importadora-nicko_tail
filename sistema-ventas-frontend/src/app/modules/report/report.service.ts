// sistema-ventas-frontend/src/app/modules/reports/reports.service.ts
// services/report.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { SalesReport, PurchasesReport, ReportFilters } from '../../interfaces/report.interface';
import { ExportService } from './export.service';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor(
    private http: HttpClient,
    private exportService: ExportService
  ) { }

  // Obtener el reporte de ventas según los filtros proporcionados
  async getSalesReport(filters: ReportFilters): Promise<SalesReport> {
    const params: any = {
      startDate: filters.fecha_inicio,
      endDate: filters.fecha_fin
    };

    if (filters.id_usuario) {
      params.userId = filters.id_usuario;
    }

    return firstValueFrom(
      this.http.get<SalesReport>(`${environment.backend}/reports/sales`, { params })
    );
  }

  // Obtener el reporte de compras según los filtros proporcionados
  async getPurchasesReport(filters: ReportFilters): Promise<PurchasesReport> {
    const params: any = {
      startDate: filters.fecha_inicio,
      endDate: filters.fecha_fin
    };

    return firstValueFrom(
      this.http.get<PurchasesReport>(`${environment.backend}/reports/purchases`, { params })
    );
  }

  // Obtener el reporte combinado de ventas y compras según los filtros proporcionados
  async getCombinedReport(filters: ReportFilters): Promise<{
    sales: SalesReport;
    purchases: PurchasesReport;
  }> {
    const params: any = {
      startDate: filters.fecha_inicio,
      endDate: filters.fecha_fin
    };

    if (filters.id_usuario) {
      params.userId = filters.id_usuario;
    }

    return firstValueFrom(
      this.http.get<{ sales: SalesReport; purchases: PurchasesReport }>(
        `${environment.backend}/reports/combined`, 
        { params }
      )
    );
  }

  // Exportar el reporte a PDF
  async exportToPDF(reportData: any, reportType: string, fecha_inicio: string, fecha_fin: string): Promise<void> {
    const elementId = 'report-content';
    const filename = `Reporte_${reportType}_${fecha_inicio}_a_${fecha_fin}`;
    
    // Pequeña pausa para asegurar que el DOM esté actualizado
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await this.exportService.exportToPDF(elementId, filename);
  }

  // Exportar el reporte a Excel
  async exportToExcel(reportData: any, reportType: string, fecha_inicio: string, fecha_fin: string): Promise<void> {
    try {
      const filename = `Reporte_${reportType}_${fecha_inicio}_a_${fecha_fin}`;
      
      if (reportType === 'ventas' && reportData) {
        this.exportSalesToExcel(reportData, filename);
      } else if (reportType === 'compras' && reportData) {
        this.exportPurchasesToExcel(reportData, filename);
      } else if (reportType === 'ambos' && reportData) {
        this.exportCombinedToExcel(reportData, filename);
      }
    } catch (error) {
      console.error('Error en exportToExcel:', error);
      throw error;
    }
  }

  // Exportar el reporte a Excel
  private exportSalesToExcel(salesReport: SalesReport, filename: string): void {
    const sheets = [
      {
        name: 'Resumen',
        data: [{
          'Fecha Inicio': salesReport.fecha_inicio,
          'Fecha Fin': salesReport.fecha_fin,
          'Total Ventas': salesReport.total_ventas,
          'Total Ingresos': salesReport.total_ingresos,
          'Cantidad Ventas': salesReport.cantidad_ventas
        }]
      },
      {
        name: 'Ventas por Vendedor',
        data: salesReport.ventas_por_vendedor.map((v: { nombre_completo: any; cantidad_ventas: any; total_ventas: any; porcentaje: any; }) => ({
          'Vendedor': v.nombre_completo,
          'Cantidad Ventas': v.cantidad_ventas,
          'Total Ventas': v.total_ventas,
          'Porcentaje': `${v.porcentaje}%`
        }))
      },
      {
        name: 'Productos Más Vendidos',
        data: salesReport.productos_mas_vendidos.map((p: { nombre_producto: any; cantidad_vendida: any; total_ventas: any; }) => ({
          'Producto': p.nombre_producto,
          'Cantidad Vendida': p.cantidad_vendida,
          'Total Ventas': p.total_ventas
        }))
      },
      {
        name: 'Ventas por Día',
        data: salesReport.ventas_por_dia.map((d: { fecha: any; cantidad_ventas: any; total_ventas: any; }) => ({
          'Fecha': d.fecha,
          'Cantidad Ventas': d.cantidad_ventas,
          'Total del Día': d.total_ventas
        }))
      }
    ];

    this.exportService.exportMultipleSheetsToExcel(sheets, filename);
  }

  // Exportar el reporte de compras a Excel
  private exportPurchasesToExcel(purchasesReport: PurchasesReport, filename: string): void {
    const sheets = [
      {
        name: 'Resumen',
        data: [{
          'Fecha Inicio': purchasesReport.fecha_inicio,
          'Fecha Fin': purchasesReport.fecha_fin,
          'Total Compras': purchasesReport.total_compras,
          'Total Egresos': purchasesReport.total_egresos,
          'Cantidad Compras': purchasesReport.cantidad_compras
        }]
      },
      {
        name: 'Productos Más Comprados',
        data: purchasesReport.productos_mas_comprados.map((p: { nombre_producto: any; cantidad_comprada: any; total_compras: any; }) => ({
          'Producto': p.nombre_producto,
          'Cantidad Comprada': p.cantidad_comprada,
          'Total Compras': p.total_compras
        }))
      }
    ];

    this.exportService.exportMultipleSheetsToExcel(sheets, filename);
  }

  // Exportar el reporte combinado de ventas y compras a Excel
  private exportCombinedToExcel(combinedReport: any, filename: string): void {
    const sheets = [
      {
        name: 'Resumen General',
        data: [{
          'Fecha Inicio': combinedReport.sales.fecha_inicio,
          'Fecha Fin': combinedReport.sales.fecha_fin,
          'Total Ingresos': combinedReport.sales.total_ingresos,
          'Total Egresos': combinedReport.purchases.total_egresos,
          'Balance Neto': combinedReport.sales.total_ingresos - combinedReport.purchases.total_egresos
        }]
      },
      {
        name: 'Ventas por Vendedor',
        data: combinedReport.sales.ventas_por_vendedor.map((v: { nombre_completo: any; cantidad_ventas: any; total_ventas: any; porcentaje: any; }) => ({
          'Vendedor': v.nombre_completo,
          'Cantidad Ventas': v.cantidad_ventas,
          'Total Ventas': v.total_ventas,
          'Porcentaje': `${v.porcentaje}%`
        }))
      },
      {
        name: 'Productos Más Vendidos',
        data: combinedReport.sales.productos_mas_vendidos.map((p: { nombre_producto: any; cantidad_vendida: any; total_ventas: any; }) => ({
          'Producto': p.nombre_producto,
          'Cantidad Vendida': p.cantidad_vendida,
          'Total Ventas': p.total_ventas
        }))
      },
      {
        name: 'Productos Más Comprados',
        data: combinedReport.purchases.productos_mas_comprados.map((p: { nombre_producto: any; cantidad_comprada: any; total_compras: any; }) => ({
          'Producto': p.nombre_producto,
          'Cantidad Comprada': p.cantidad_comprada,
          'Total Compras': p.total_compras
        }))
      }
    ];

    this.exportService.exportMultipleSheetsToExcel(sheets, filename);
  }
}