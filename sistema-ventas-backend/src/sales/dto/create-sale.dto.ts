// src/sales/dto/create-sale.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsDecimal,
  Min,
  ValidateNested,
  IsArray,
  ArrayMinSize,
  IsEnum,
  IsNumber,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SaleState } from '@prisma/client';

// Si tu enum en Prisma es SaleState y tiene valores 'pendiente', 'completada', etc.
// y quieres usar strings más amigables en tu DTO (o los mismos):
export enum DtoSaleState {
  PENDIENTE = 'pendiente',
  COMPLETADA = 'completada',
  CANCELADA = 'cancelada',
  DEVUELTA = 'devuelta',
}

// DTO para los detalles de cada ítem de la venta
export class CreateSaleDetailDto {
  @ApiProperty({ description: 'ID del producto vendido', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  id_producto: string;

  @ApiProperty({ description: 'Cantidad del producto vendido', example: 2 })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  @Type(() => Number) // <--- ¡AÑADIDO!
  cantidad: number;

  @ApiProperty({ description: 'Precio unitario al que se vendió el producto', type: Number, format: 'float', example: 10.50 })
  @IsNumber()
  @Min(0)
  @Type(() => Number) // Convertir a número si viene como string
  //@IsDecimal({ decimal_digits: '1,2' })
  precio_unitario: number;

  @ApiProperty({ description: 'Descuento aplicado a este ítem', required: false, type: Number, format: 'float', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  //@IsDecimal({ decimal_digits: '1,2' })
  descuento_item?: number; // Para descuento a nivel de item, si lo manejas
}

export class CreateSaleDto {
  @ApiProperty({ description: 'ID del usuario que realiza la venta', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  id_usuario: string; // Coincide con schema.prisma

  @ApiProperty({ description: 'ID del cliente asociado a la venta (opcional)', format: 'uuid', required: false })
  @IsOptional()
  @IsUUID()
  id_cliente?: string; // Coincide con schema.prisma (es opcional)

  // @ApiProperty({ description: 'Número único de la venta', example: 'VENTA-2024-0001' })
  // @IsString()
  // @IsNotEmpty()
  // @MaxLength(50) // Limite de varchar
  // numero_venta: string; // Coincide con schema.prisma

  

  @ApiProperty({ description: 'Subtotal de la venta antes de descuentos e impuestos', type: Number, format: 'float', example: 100.00 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  //@IsDecimal({ decimal_digits: '1,2' })
  subtotal: number; // Coincide con schema.prisma

  @ApiProperty({ description: 'Descuento total aplicado a la venta', required: false, type: Number, format: 'float', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  //@IsDecimal({ decimal_digits: '1,2' })
  descuento?: number; // Coincide con schema.prisma

  @ApiProperty({ description: 'Impuesto total aplicado a la venta', required: false, type: Number, format: 'float', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  //@IsDecimal({ decimal_digits: '1,2' })
  impuesto?: number; // Coincide con schema.prisma

  @ApiProperty({ description: 'Total final de la venta', type: Number, format: 'float', example: 100.00 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  //@IsDecimal({ decimal_digits: '1,2' })
  total: number; // Coincide con schema.prisma

  @ApiProperty({ description: 'Estado de la venta', enum: SaleState, example: SaleState.completada })
  @IsEnum(SaleState) // <--- Usa IsEnum con el enum de Prisma
  @IsNotEmpty()
  estado: SaleState; // <--- Cambia el tipo a SaleState

  @ApiProperty({ description: 'Observaciones adicionales sobre la venta', required: false })
  @IsOptional()
  @IsString()
  observaciones?: string; // Coincide con schema.prisma

  @ApiProperty({ type: [CreateSaleDetailDto], description: 'Detalles de los productos vendidos en esta venta' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleDetailDto)
  detalle_ventas: CreateSaleDetailDto[]; // Coincide con schema.prisma (relación)
}