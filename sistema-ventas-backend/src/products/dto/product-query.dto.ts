// src/products/dto/product-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumberString, IsBooleanString, IsUUID } from 'class-validator';

// DTO para consultar productos con filtros y paginación
export class ProductQueryDto {
  @ApiPropertyOptional({ description: 'Buscar productos por nombre, descripción o código', example: 'Smartphone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por ID de categoría (UUID)', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @IsOptional()
  @IsUUID('4', { message: 'El ID de categoría debe ser un UUID válido.' })
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por estado activo', example: 'true' })
  @IsOptional()
  @IsBooleanString()
  active?: string;

  @ApiPropertyOptional({ description: 'Número de página', example: 1, default: 1 })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ description: 'Número de elementos por página', example: 10, default: 10 })
  @IsOptional()
  @IsNumberString()
  limit?: string;
}