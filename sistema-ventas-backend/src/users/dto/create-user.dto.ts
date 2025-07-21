// src/users/dto/create-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsEmail, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'ID del rol asignado al usuario (UUID)', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @IsUUID('4', { message: 'El ID de rol debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El ID de rol es obligatorio.' })
  id_rol: string;

  @ApiProperty({ description: 'Nombre de usuario único', example: 'john.doe' })
  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre de usuario no puede estar vacío.' })
  @MaxLength(50, { message: 'El nombre de usuario no puede exceder los 50 caracteres.' })
  nombre_usuario: string;

  @ApiProperty({ description: 'Email único del usuario', example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'El email debe ser una dirección de correo válida.' })
  @IsNotEmpty({ message: 'El email no puede estar vacío.' })
  @MaxLength(100, { message: 'El email no puede exceder los 100 caracteres.' })
  email: string;

  @ApiProperty({ description: 'Contraseña del usuario', example: 'passwordSegura123' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía.' })
  @MaxLength(255, { message: 'La contraseña no puede exceder los 255 caracteres.' })
  password: string; // Se hasheará antes de guardar

  @ApiProperty({ description: 'Nombre completo del usuario', example: 'John Doe' })
  @IsString({ message: 'El nombre completo debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre completo no puede estar vacío.' })
  @MaxLength(100, { message: 'El nombre completo no puede exceder los 100 caracteres.' })
  nombre_completo: string;

  @ApiProperty({ description: 'Número de teléfono (opcional)', example: '123456789', required: false })
  @IsString({ message: 'El teléfono debe ser una cadena de texto.' })
  @IsOptional()
  @MaxLength(20, { message: 'El teléfono no puede exceder los 20 caracteres.' })
  telefono?: string;

  @ApiProperty({
    description: 'Estado del usuario (activo/inactivo)',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean({ message: 'El estado activo debe ser un valor booleano.' })
  @IsOptional()
  activo?: boolean = true;
}