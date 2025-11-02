  // src/forecast/forecast.controller.ts
import { Controller, Post, Body, Get, Query, UsePipes, ValidationPipe, Param, BadRequestException } from '@nestjs/common';
import { ForecastService } from './forecast.service';
import { ForecastRequestDto } from './dto/forecast-request.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { TopDatesQueryDto } from './dto/top-dates-query.dto';
import { TopProductsQueryDto } from './dto/top-products-query.dto';
import { ForecastResponse } from './interfaces/forecast.interface';

@ApiTags('Pronósticos')
@Controller('forecast')
export class ForecastController {
  constructor(private readonly forecastService: ForecastService) {}
// Endpoint para generar un pronóstico de ventas
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Generar pronóstico de ventas con promedio móvil' })
  @ApiBody({ type: ForecastRequestDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Pronóstico generado exitosamente',
    schema: {
      example: {
        results: [
          {
            fecha: '2024-01-01',
            ventas_previstas: 10000,
            intervalo_confianza: { inferior: 8000, superior: 12000 },
            metrica_precision: 85
          }
        ],
        metrics: {
          mape: 12.5,
          mae: 1250,
          rmse: 1500,
          accuracy: 87.5
        },
        model_info: {
          type: 'moving_average',
          window_size: 3,
          alpha: 0.3,
          periods: 6
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'No se encontraron datos históricos' })
  async createForecast(@Body() forecastRequest: ForecastRequestDto): Promise<ForecastResponse> {
    return this.forecastService.generateForecast(forecastRequest);
  }
// Endpoint para obtener el historial de ventas mensual
  @Get('history')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Obtener historial de ventas mensual' })
  @ApiResponse({ status: 200, description: 'Historial obtenido exitosamente' })
  @ApiResponse({ status: 400, description: 'Parámetros de consulta inválidos' })
  async getSalesHistory(@Query() query: HistoryQueryDto) {
    return this.forecastService.getSalesHistory(query);
  }
// Endpoint para obtener los meses con mayores ventas
  @Get('top-dates')
  @UsePipes(new ValidationPipe({ 
    transform: true,
    exceptionFactory: (errors) => {
      return new BadRequestException({
        message: 'Parámetros de consulta inválidos',
        errors: errors.map(error => ({
          property: error.property,
          constraints: error.constraints
        }))
      });
    }
  }))
  @ApiOperation({ summary: 'Obtener meses con mayores ventas' })
  @ApiResponse({ status: 200, description: 'Meses con mayores ventas obtenidos exitosamente' })
  @ApiResponse({ status: 400, description: 'Parámetros de consulta inválidos' })
  async getTopSellingDates(@Query() query: TopDatesQueryDto) {
    try {
      // Validación adicional de fechas
      this.validateDates(query.fecha_inicio, query.fecha_fin);
      return await this.forecastService.getTopSellingDates(query);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
// Endpoint para obtener los productos más vendidos en un mes específico
  @Get('top-products/:date')
  @UsePipes(new ValidationPipe({ 
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false
  }))
  @ApiOperation({ summary: 'Obtener productos más vendidos en un mes específico' })
  @ApiParam({ 
    name: 'date', 
    description: 'Mes en formato YYYY-MM (ej: 2024-01)' 
  })
  @ApiResponse({ status: 200, description: 'Productos más vendidos obtenidos exitosamente' })
  @ApiResponse({ status: 400, description: 'Parámetros de consulta inválidos' })
  @ApiResponse({ status: 404, description: 'No se encontraron ventas para el mes especificado' })

  // Endpoint para obtener los productos más vendidos en un mes específico
  async getTopProductsByDate(
    @Param('date') date: string,
    @Query() query: TopProductsQueryDto
  ) {
    try {
      console.log('📊 Received month from URL:', date);
      console.log('📊 Query params:', query);
      
      // Validación básica del mes
      if (!date || date.trim() === '') {
        throw new BadRequestException('El mes no puede estar vacío');
      }

      // Validar formato YYYY-MM
      if (!/^\d{4}-\d{2}$/.test(date)) {
        throw new BadRequestException('Formato de mes inválido. Use YYYY-MM (ej: 2024-01)');
      }

      return await this.forecastService.getTopProductsByDate(date, query.limit || 10);
    } catch (error) {
      console.error('❌ Controller error:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException({
        message: 'Error al procesar la solicitud',
        details: error.message,
        receivedDate: date
      });
    }
  }
// Validación adicional de fechas
  private validateDates(fechaInicio: string, fechaFin: string) {
    const startDate = new Date(fechaInicio);
    const endDate = new Date(fechaFin);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Las fechas proporcionadas no son válidas');
    }
    
    if (startDate > endDate) {
      throw new Error('La fecha de inicio no puede ser mayor que la fecha de fin');
    }
  }
}