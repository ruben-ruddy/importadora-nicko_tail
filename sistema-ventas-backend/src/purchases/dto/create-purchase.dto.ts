// src/purchases/dto/create-purchase.dto.ts
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
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Si tu enum en Prisma es PurchaseState y tiene valores 'pendiente', 'completada', etc.
// Definimos el DTO enum para usarlo en la validación y documentación de Swagger
export enum DtoPurchaseState {
  PENDIENTE = 'pendiente',
  COMPLETADA = 'completada',
  CANCELADA = 'cancelada',
}

// DTO para los detalles de cada ítem de la compra
export class CreatePurchaseDetailDto {
  @ApiProperty({ description: 'ID del producto comprado', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  id_producto: string;

  @ApiProperty({ description: 'Cantidad del producto comprado', example: 10 })
  @IsNumber()
  @Min(1)
  cantidad: number;

  @ApiProperty({ description: 'Precio unitario al que se compró el producto', type: Number, format: 'float', example: 5.75 })
  @IsNumber()
  @Min(0)
  @Type(() => Number) // Convertir a número si viene como string
  //@IsDecimal({ decimal_digits: '1,2' })
  precio_unitario: number;

  @ApiProperty({ description: 'Subtotal del detalle de la compra (cantidad * precio_unitario)', type: Number, format: 'float', example: 57.50 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  //@IsDecimal({ decimal_digits: '1,2' })
  subtotal: number; // Este subtotal del detalle puede ser calculado en el backend
}

export class CreatePurchaseDto {
  @ApiProperty({ description: 'ID del usuario que registra la compra', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  id_usuario: string;

  // @ApiProperty({ description: 'Número único de la compra', example: 'COMPRA-2024-0001' })
  // @IsString()
  // @IsNotEmpty()
  // @Max(50) // Limite de varchar
  // numero_compra: string;

  @ApiProperty({ description: 'Total final de la compra', type: Number, format: 'float', example: 500.00 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  //@IsDecimal({ decimal_digits: '1,2' })
  total: number; // Este total será recalculado en el backend

  @ApiProperty({ description: 'Estado actual de la compra', enum: DtoPurchaseState, default: DtoPurchaseState.PENDIENTE })
  @IsOptional()
  @IsEnum(DtoPurchaseState)
  estado?: DtoPurchaseState;

  @ApiProperty({ description: 'Observaciones adicionales sobre la compra', required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiProperty({ type: [CreatePurchaseDetailDto], description: 'Detalles de los productos comprados' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseDetailDto)
  detalle_compras: CreatePurchaseDetailDto[]; // Coincide con schema.prisma (relación)
}