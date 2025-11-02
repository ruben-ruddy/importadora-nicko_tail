// create-role.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

// DTO para crear un nuevo rol
export class CreateRoleDto {
  @ApiProperty({ example: 'Administrador', description: 'Nombre del rol' })
  @IsString()
  nombre_rol: string;

  @ApiProperty({ example: 'Acceso total al sistema', required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ default: true, required: false })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}