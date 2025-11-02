// src/categories/dto/create-category.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Nombre único de la categoría', example: 'Electrónica' })
  @IsString({ message: 'El nombre de la categoría debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre de la categoría no puede estar vacío.' })
  @MaxLength(100, { message: 'El nombre de la categoría no puede exceder los 100 caracteres.' })
  nombre_categoria: string;

  @ApiProperty({
    description: 'Descripción de la categoría (opcional)',
    example: 'Dispositivos electrónicos, gadgets, etc.',
    required: false,
  })
  @IsString({ message: 'La descripción debe ser una cadena de texto.' })
  @IsOptional()
  descripcion?: string;

  @ApiProperty({
    description: 'Indica si la categoría está activa',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean({ message: 'El estado activo debe ser un valor booleano.' })
  @IsOptional()
  activo?: boolean = true; 

  @ApiPropertyOptional({ description: 'URL de la imagen del producto (obtenida del DMS)', example: '/uploads/1678912345-mi-imagen.jpg' })
  @IsOptional()
  @IsString()
  icono_url?: string; 

}