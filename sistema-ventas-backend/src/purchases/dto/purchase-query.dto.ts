// src/purchases/dto/purchase-query.dto.ts
import { IsOptional, IsString, IsUUID, IsNumberString, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DtoPurchaseState } from './create-purchase.dto'; // Importa el enum de tu DTO de creación

export class PurchaseQueryDto {
  @ApiProperty({ description: 'ID del usuario que realizó la compra a filtrar', required: false, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  id_usuario?: string;

  @ApiProperty({ description: 'Número de compra a filtrar', required: false })
  @IsOptional()
  @IsString()
  numero_compra?: string;

  @ApiProperty({ description: 'Estado de la compra a filtrar', required: false, enum: DtoPurchaseState })
  @IsOptional()
  @IsEnum(DtoPurchaseState)
  estado?: DtoPurchaseState;

  @ApiProperty({ description: 'Fecha de inicio del rango de búsqueda (YYYY-MM-DD)', required: false, example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'Fecha de fin del rango de búsqueda (YYYY-MM-DD)', required: false, example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Número de página', required: false, default: 1, type: Number })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiProperty({ description: 'Límite de elementos por página', required: false, default: 10, type: Number })
  @IsOptional()
  @IsNumberString()
  limit?: string;
}