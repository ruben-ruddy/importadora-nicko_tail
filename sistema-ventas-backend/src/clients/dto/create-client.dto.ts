// src/clients/dto/create-client.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsEmail, IsOptional, IsBoolean } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ description: 'Nombre completo del cliente', example: 'Juan Pérez' })
  @IsString({ message: 'El nombre completo debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre completo no puede estar vacío.' })
  @MaxLength(150, { message: 'El nombre completo no puede exceder los 150 caracteres.' })
  nombre_completo: string;

  @ApiProperty({ description: 'Email del cliente (opcional)', example: 'juan.perez@example.com', required: false })
  @IsEmail({}, { message: 'El email debe ser una dirección de correo válida.' })
  @IsOptional()
  @MaxLength(100, { message: 'El email no puede exceder los 100 caracteres.' })
  email?: string;

  @ApiProperty({ description: 'Número de teléfono (opcional)', example: '987654321', required: false })
  @IsString({ message: 'El teléfono debe ser una cadena de texto.' })
  @IsOptional()
  @MaxLength(20, { message: 'El teléfono no puede exceder los 20 caracteres.' })
  telefono?: string;

  @ApiProperty({ description: 'Dirección del cliente (opcional)', example: 'Calle Falsa 123', required: false })
  @IsString({ message: 'La dirección debe ser una cadena de texto.' })
  @IsOptional()
  direccion?: string;

  @ApiProperty({ description: 'Documento de identidad (opcional)', example: '12345678-9', required: false })
  @IsString({ message: 'El documento de identidad debe ser una cadena de texto.' })
  @IsOptional()
  @MaxLength(50, { message: 'El documento de identidad no puede exceder los 50 caracteres.' })
  documento_identidad?: string;

  @ApiProperty({
    description: 'Estado del cliente (activo/inactivo)',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean({ message: 'El estado activo debe ser un valor booleano.' })
  @IsOptional()
  activo?: boolean = true;
}