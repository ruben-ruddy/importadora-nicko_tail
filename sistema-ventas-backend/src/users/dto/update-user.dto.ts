// src/users/dto/update-user.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ description: 'ID del nuevo rol (UUID) (opcional)', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', required: false })
  @IsUUID('4', { message: 'El ID de rol debe ser un UUID válido.' })
  @IsOptional()
  id_rol?: string;

  @ApiPropertyOptional({ description: 'Nueva contraseña (opcional)', example: 'otraPasswordSegura', required: false })
  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @IsOptional()
  password?: string; // Si se proporciona, se hasheará antes de actualizar
}