// src/users/dto/user-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumberString, IsBooleanString } from 'class-validator';

// DTO para las consultas de usuarios con filtros y paginación
export class UserQueryDto {
  @ApiPropertyOptional({ description: 'Buscar usuarios por nombre de usuario, email o nombre completo', example: 'admin' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por ID de rol', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @IsOptional()
  @IsString()
  id_rol?: string;

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