// src/auth/dto/register.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, MaxLength, IsOptional, IsInt, IsNotEmpty, IsUUID } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ description: 'Nombre de usuario único', minLength: 3, maxLength: 50 })
  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto.' })
  @MinLength(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres.' })
  @MaxLength(50, { message: 'El nombre de usuario no puede exceder los 50 caracteres.' })
  @IsNotEmpty({ message: 'El nombre de usuario no puede estar vacío.' })
  nombre_usuario: string;

  @ApiProperty({ description: 'Email del usuario, debe ser único', format: 'email' })
  @IsEmail({}, { message: 'El email debe tener un formato válido.' })
  @MaxLength(100, { message: 'El email no puede exceder los 100 caracteres.' })
  @IsNotEmpty({ message: 'El email no puede estar vacío.' })
  email: string;

  @ApiProperty({ description: 'Contraseña del usuario', minLength: 6 })
  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  @IsNotEmpty({ message: 'La contraseña no puede estar vacío.' })
  password: string;

  @ApiProperty({ description: 'Nombre completo del usuario', maxLength: 100 })
  @IsString({ message: 'El nombre completo debe ser una cadena de texto.' })
  @MaxLength(100, { message: 'El nombre completo no puede exceder los 100 caracteres.' })
  @IsNotEmpty({ message: 'El nombre completo no puede estar vacío.' })
  nombre_completo: string;

  @ApiProperty({ description: 'Teléfono del usuario (opcional)', required: false, maxLength: 20 })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto.' })
  @MaxLength(20, { message: 'El teléfono no puede exceder los 20 caracteres.' })
  telefono?: string;

  @ApiProperty({ description: 'ID del rol del usuario (UUID). Por defecto el ID del rol "Vendedor".', required: false })
  @IsOptional()
  @IsString({ message: 'El ID del rol debe ser una cadena de texto.' })
  @IsUUID('4', { message: 'El ID del rol debe ser un UUID válido.' }) // Opcional: valida que sea un UUID v4
  id_rol?: string; // ¡Ahora es string!
}