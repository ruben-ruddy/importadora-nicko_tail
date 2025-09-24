// src/sales/dto/sale-query.dto.ts
import { IsOptional, IsString, IsUUID, IsNumberString, IsDateString, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DtoSaleState } from './create-sale.dto';
import { SaleState } from '@prisma/client';

export class SaleQueryDto {
  @ApiProperty({ description: 'ID del usuario que realizó la venta a filtrar', required: false, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  id_usuario?: string;

  @ApiProperty({ description: 'ID del cliente a filtrar', required: false, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  id_cliente?: string;

  @ApiProperty({ description: 'Número de venta a filtrar', required: false })
  @IsOptional()
  @IsString()
  numero_venta?: string;

  @ApiProperty({ description: 'Estado de la venta a filtrar', required: false, enum: DtoSaleState })
  @IsOptional()
  @IsEnum(DtoSaleState)
  estado?: SaleState;

  @ApiProperty({ description: 'Fecha de inicio del rango de búsqueda (YYYY-MM-DD)', required: false, example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'Fecha de fin del rango de búsqueda (YYYY-MM-DD)', required: false, example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Término de búsqueda general (número de venta, cliente, vendedor)', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Número de página', example: 1, default: 1, type: Number })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Límite de resultados por página', example: 10, default: 10, type: Number })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;
}