// src/reports/reports.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { 
  SalesReportResponse, 
  PurchasesReportResponse 
} from './interfaces/report-response.interface';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @ApiOperation({ summary: 'Generar reporte de ventas' })
  @ApiResponse({ status: 200, description: 'Reporte de ventas generado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  async getSalesReport(@Query() query: ReportQueryDto): Promise<SalesReportResponse> {
    return this.reportsService.generateSalesReport(query);
  }

  @Get('purchases')
  @ApiOperation({ summary: 'Generar reporte de compras' })
  @ApiResponse({ status: 200, description: 'Reporte de compras generado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  async getPurchasesReport(@Query() query: ReportQueryDto): Promise<PurchasesReportResponse> {
    return this.reportsService.generatePurchasesReport(query);
  }

  @Get('combined')
  @ApiOperation({ summary: 'Generar reporte combinado de ventas y compras' })
  @ApiResponse({ status: 200, description: 'Reporte combinado generado exitosamente' })
  async getCombinedReport(@Query() query: ReportQueryDto): Promise<{
    sales: SalesReportResponse;
    purchases: PurchasesReportResponse;
  }> {
    const [sales, purchases] = await Promise.all([
      this.reportsService.generateSalesReport(query),
      this.reportsService.generatePurchasesReport(query)
    ]);

    return { sales, purchases };
  }
}