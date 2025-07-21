// src/sales/dto/sale-query.dto.ts
import { IsOptional, IsString, IsUUID, IsNumberString, IsDateString, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DtoSaleState } from './create-sale.dto'; // Importa el enum de tu DTO de creación
import { SaleState } from '@prisma/client';

export class SaleQueryDto {
  @ApiProperty({ description: 'ID del usuario que realizó la venta a filtrar', required: false, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  id_usuario?: string; // Coincide con schema.prisma

  @ApiProperty({ description: 'ID del cliente a filtrar', required: false, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  id_cliente?: string; // Coincide con schema.prisma

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

  @ApiPropertyOptional({ description: 'Número de página', example: 1, default: 1, type: Number })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number) // <--- ¡CRÍTICO! Esto convierte el string del query param a number
  page?: number = 1; // Establece un valor predeterminado si es opcional

  @ApiPropertyOptional({ description: 'Límite de resultados por página', example: 10, default: 10, type: Number })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100) // O el máximo que consideres razonable
  @Type(() => Number) // <--- ¡CRÍTICO! Esto convierte el string del query param a number
  limit?: number = 10; // Establece un valor predeterminado si es opcional
}