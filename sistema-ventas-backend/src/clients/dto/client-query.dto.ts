// src/clients/dto/client-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumberString, IsBooleanString } from 'class-validator';

export class ClientQueryDto {
  @ApiPropertyOptional({ description: 'Buscar clientes por nombre, email, teléfono o documento de identidad', example: 'Juan' })
  @IsOptional()
  @IsString()
  search?: string;

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