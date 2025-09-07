// sistema-ventas-frontend/src/app/modules/reports/reports.component.ts
// components/report/report.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from './report.service';
import { ReportFilters, SalesReport, PurchasesReport } from '../../interfaces/report.interface';
import { PurchaseService } from '../purchase/purchase.service';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule
  ],
  templateUrl: './report.component.html',
  styleUrl: './report.component.scss'
})
export class ReportComponent implements OnInit {
  filters: ReportFilters = {
    fecha_inicio: '',
    fecha_fin: '',
    tipo_reporte: 'ventas'
  };

  salesReport: SalesReport | null = null;
  purchasesReport: PurchasesReport | null = null;
  loading = false;
  exportLoading = false;
  error = '';
  users: any[] = [];

  constructor(
    private reportService: ReportService,
    private purchaseService: PurchaseService
  ) {}

  async ngOnInit() {
    this.setDefaultDates();
    await this.loadUsers();
  }

  private setDefaultDates() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    this.filters.fecha_inicio = this.formatDate(firstDayOfMonth);
    this.filters.fecha_fin = this.formatDate(today);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async loadUsers() {
    try {
      this.users = await this.purchaseService.getUsers();
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  async generateReport() {
    if (!this.filters.fecha_inicio || !this.filters.fecha_fin) {
      this.error = 'Debe seleccionar ambas fechas';
      return;
    }

    if (new Date(this.filters.fecha_inicio) > new Date(this.filters.fecha_fin)) {
      this.error = 'La fecha de inicio no puede ser mayor a la fecha fin';
      return;
    }

    this.loading = true;
    this.error = '';
    this.salesReport = null;
    this.purchasesReport = null;

    try {
      switch (this.filters.tipo_reporte) {
        case 'ventas':
          this.salesReport = await this.reportService.getSalesReport(this.filters);
          break;
        
        case 'compras':
          this.purchasesReport = await this.reportService.getPurchasesReport(this.filters);
          break;
        
        case 'ambos':
          const combined = await this.reportService.getCombinedReport(this.filters);
          this.salesReport = combined.sales;
          this.purchasesReport = combined.purchases;
          break;
      }
    } catch (error: any) {
      console.error('Error generating report:', error);
      this.error = error.error?.message || 'Error al generar el reporte';
    } finally {
      this.loading = false;
    }
  }

  async exportReport(format: 'pdf' | 'excel') {
    this.exportLoading = true;
    this.error = '';

    try {
      const reportData = this.getReportData();
      
      if (!reportData) {
        this.error = 'No hay datos para exportar';
        return;
      }

      if (format === 'pdf') {
        await this.reportService.exportToPDF(
          reportData, 
          this.filters.tipo_reporte, 
          this.filters.fecha_inicio, 
          this.filters.fecha_fin
        );
      } else {
        await this.reportService.exportToExcel(
          reportData, 
          this.filters.tipo_reporte, 
          this.filters.fecha_inicio, 
          this.filters.fecha_fin
        );
      }
    } catch (error: any) {
      console.error('Error exporting report:', error);
      this.error = error.message || 'Error al exportar el reporte';
    } finally {
      this.exportLoading = false;
    }
  }

  private getReportData(): any {
    switch (this.filters.tipo_reporte) {
      case 'ventas':
        return this.salesReport;
      case 'compras':
        return this.purchasesReport;
      case 'ambos':
        return {
          sales: this.salesReport,
          purchases: this.purchasesReport
        };
      default:
        return null;
    }
  }

  get totalIngresosEgresos() {
    const ingresos = this.salesReport?.total_ingresos || 0;
    const egresos = this.purchasesReport?.total_egresos || 0;
    const balance = ingresos - egresos;

    return { ingresos, egresos, balance };
  }

  // Método para formatear fechas en el template si es necesario
  formatDateForDisplay(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  }
}