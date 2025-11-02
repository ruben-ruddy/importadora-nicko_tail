// src/products/dto/create-product.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsNumber,
  Min,
  Max,
  IsUrl
} from 'class-validator';
// DTO para crear un nuevo producto
export class CreateProductDto {
  @ApiProperty({ description: 'ID de la categoría a la que pertenece el producto (UUID)', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @IsUUID('4', { message: 'El ID de categoría debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El ID de categoría es obligatorio.' })
  id_categoria: string;

  @ApiProperty({ description: 'Nombre único del producto', example: 'Smartphone X' })
  @IsString({ message: 'El nombre del producto debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre del producto no puede estar vacío.' })
  @MaxLength(200, { message: 'El nombre del producto no puede exceder los 200 caracteres.' })
  nombre_producto: string;

  @ApiProperty({
    description: 'Código del producto (identificador único de stock)',
    example: 'SMART-X-001',
    required: false,
  })
  @IsString({ message: 'El código de producto debe ser una cadena de texto.' })
  @IsOptional()
  @MaxLength(50, { message: 'El código de producto no puede exceder los 50 caracteres.' })
  codigo_producto?: string;

  @ApiProperty({
    description: 'Descripción detallada del producto (opcional)',
    example: 'Smartphone de última generación con cámara de 108MP.',
    required: false,
  })
  @IsString({ message: 'La descripción debe ser una cadena de texto.' })
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ description: 'Precio de venta unitario del producto', example: 799.99 })
  @IsNumber({}, { message: 'El precio de venta debe ser un número.' })
  @IsNotEmpty({ message: 'El precio de venta es obligatorio.' })
  precio_venta: number; // Renombrado a 'precio_venta' para claridad con el schema

  @ApiProperty({ description: 'Precio de compra unitario del producto', example: 600.00 })
  @IsNumber({}, { message: 'El precio de compra debe ser un número.' })
  @IsNotEmpty({ message: 'El precio de compra es obligatorio.' })
  precio_compra: number; 

  @ApiProperty({ description: 'Stock inicial disponible del producto', example: 150 })
  @IsNumber({}, { message: 'El stock debe ser un número.' })
  @IsNotEmpty({ message: 'El stock es obligatorio.' })
  stock_actual: number; 

  @ApiProperty({ description: 'Stock inicial disponible del producto', example: 150 })
  @IsNumber({}, { message: 'El stock debe ser un número.' })
  @IsNotEmpty({ message: 'El stock es obligatorio.' })
  stock_minimo: number; 
  @ApiPropertyOptional({ description: 'URL de la imagen del producto (obtenida del DMS)', example: '/uploads/1678912345-mi-imagen.jpg' })
  @IsOptional()
  @IsString()
  imagen_url?: string; 

  @ApiProperty({
    description: 'Estado del producto (activo/inactivo)',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean({ message: 'El estado activo debe ser un valor booleano.' })
  @IsOptional()
  activo?: boolean = true;
}