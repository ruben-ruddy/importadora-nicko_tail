// src/forecast/forecast.controller.ts
import { Controller, Post, Body, Get, Query, UsePipes, ValidationPipe, Param, BadRequestException } from '@nestjs/common';
import { ForecastService } from './forecast.service';
import { ForecastRequestDto } from './dto/forecast-request.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { TopDatesQueryDto } from './dto/top-dates-query.dto';
import { TopProductsQueryDto } from './dto/top-products-query.dto';

@ApiTags('Pronósticos')
@Controller('forecast')
export class ForecastController {
  constructor(private readonly forecastService: ForecastService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Generar pronóstico de ventas' })
  @ApiBody({ type: ForecastRequestDto })
  @ApiResponse({ status: 201, description: 'Pronóstico generado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'No se encontraron datos históricos' })
  async createForecast(@Body() forecastRequest: ForecastRequestDto) {
    return this.forecastService.generateForecast(forecastRequest);
  }

  @Get('history')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Obtener historial de ventas' })
  @ApiResponse({ status: 200, description: 'Historial obtenido exitosamente' })
  @ApiResponse({ status: 400, description: 'Parámetros de consulta inválidos' })
  async getSalesHistory(@Query() query: HistoryQueryDto) {
    return this.forecastService.getSalesHistory(query);
  }

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
  @ApiOperation({ summary: 'Obtener fechas con mayores ventas' })
  @ApiResponse({ status: 200, description: 'Fechas con mayores ventas obtenidas exitosamente' })
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


@Get('top-products/:date')
@UsePipes(new ValidationPipe({ 
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: false
}))
@ApiOperation({ summary: 'Obtener productos más vendidos en una fecha específica' })
@ApiParam({ 
  name: 'date', 
  description: 'Fecha en formato YYYY-MM-DD (día), YYYY-MM (mes), o YYYY-WXX (semana)' 
})
@ApiResponse({ status: 200, description: 'Productos más vendidos obtenidos exitosamente' })
@ApiResponse({ status: 400, description: 'Parámetros de consulta inválidos' })
@ApiResponse({ status: 404, description: 'No se encontraron ventas para la fecha especificada' })
async getTopProductsByDate(
  @Param('date') date: string, // ← Este viene de la URL
  @Query() query: TopProductsQueryDto // ← Este solo tiene 'limit'
) {
  try {
    console.log('📍 Received date from URL:', date);
    console.log('📍 Query params:', query);
    
    // Validación básica de la fecha
    if (!date || date.trim() === '') {
      throw new BadRequestException('La fecha no puede estar vacía');
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


private validateDateFormat(date: string) {
  // Permitir diferentes formatos: YYYY-MM-DD, YYYY-MM, YYYY-WXX
  const dateRegex = /^\d{4}-(?:[0-1][0-9]|W[0-5][0-9])$/;
  const dateDayRegex = /^\d{4}-[0-1][0-9]-[0-3][0-9]$/;
  
  if (!dateDayRegex.test(date) && !dateRegex.test(date)) {
    throw new Error('Formato de fecha inválido. Use YYYY-MM-DD, YYYY-MM, o YYYY-WXX');
  }
}

}