// src/auth/dto/login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Nombre de usuario para iniciar sesión', minLength: 3, maxLength: 50 })
  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto.' })
  @MinLength(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres.' })
  @IsNotEmpty({ message: 'El nombre de usuario no puede estar vacío.' })
  nombre_usuario: string;

  @ApiProperty({ description: 'Contraseña para iniciar sesión', minLength: 6 })
  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía.' })
  password: string;
}