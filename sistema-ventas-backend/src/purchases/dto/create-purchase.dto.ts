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
  @IsNumber({}, { message: 'La cantidad debe ser un número válido' })
  @Min(1)
  cantidad: number;

  @ApiProperty({ description: 'Precio unitario', type: Number, example: 5.75 })
  @IsNumber({}, { message: 'El precio unitario debe ser un número válido' })
  @Min(0)
  @Type(() => Number)
  precio_unitario: number;

  @ApiProperty({ description: 'Subtotal', type: Number, example: 57.50 })
  @IsNumber({}, { message: 'El subtotal debe ser un número válido' })
  @Min(0)
  @Type(() => Number)
  subtotal: number;
}

export class CreatePurchaseDto {
  @ApiProperty({ description: 'ID del usuario', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  id_usuario: string;

  @ApiProperty({ description: 'Total final', type: Number, example: 500.00 })
  @IsNumber({}, { message: 'El total debe ser un número válido' })
  @Min(0)
  @Type(() => Number)
  total: number;

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
  detalle_compras: CreatePurchaseDetailDto[];
}