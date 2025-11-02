// src/inventory-movements/dto/inventory-movement-query.dto.ts
import { IsOptional, IsString, IsUUID, IsNumberString, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DtoMovementType } from './create-inventory-movement.dto'; 

export class InventoryMovementQueryDto {
  @ApiProperty({ description: 'ID del producto a filtrar', required: false, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  id_producto?: string; 

  @ApiProperty({ description: 'ID del usuario a filtrar', required: false, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  id_usuario?: string; 

  @ApiProperty({ description: 'Tipo de movimiento a filtrar (entrada/salida)', required: false, enum: DtoMovementType })
  @IsOptional()
  @IsEnum(DtoMovementType)
  tipo_movimiento?: DtoMovementType; 

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
  @Type(() => Number)
  @IsNumberString()
  page?: number;

  @ApiProperty({ description: 'Límite de elementos por página', required: false, default: 10, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumberString()
  limit?: number;
}