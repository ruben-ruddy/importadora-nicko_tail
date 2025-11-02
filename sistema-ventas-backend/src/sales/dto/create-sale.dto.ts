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
  @Type(() => Number) 
  cantidad: number;

  @ApiProperty({ description: 'Precio unitario al que se vendió el producto', type: Number, format: 'float', example: 10.50 })
  @IsNumber()
  @Min(0)
  @Type(() => Number) 
  precio_unitario: number;

  @ApiProperty({ description: 'Descuento aplicado a este ítem', required: false, type: Number, format: 'float', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  descuento_item?: number; 
}

// DTO para crear una nueva venta
export class CreateSaleDto {
  @ApiProperty({ description: 'ID del usuario que realiza la venta', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  id_usuario: string; 

  @ApiProperty({ description: 'ID del cliente asociado a la venta (opcional)', format: 'uuid', required: false })
  @IsOptional()
  @IsUUID()
  id_cliente?: string; 

  @ApiProperty({ description: 'Subtotal de la venta antes de descuentos e impuestos', type: Number, format: 'float', example: 100.00 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  subtotal: number; 

  @ApiProperty({ description: 'Descuento total aplicado a la venta', required: false, type: Number, format: 'float', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  descuento?: number; 

  @ApiProperty({ description: 'Impuesto total aplicado a la venta', required: false, type: Number, format: 'float', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  impuesto?: number; 

  @ApiProperty({ description: 'Total final de la venta', type: Number, format: 'float', example: 100.00 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  total: number; 

  @ApiProperty({ description: 'Estado de la venta', enum: SaleState, example: SaleState.completada })
  @IsEnum(SaleState) 
  @IsNotEmpty()
  estado: SaleState;

  @ApiProperty({ description: 'Observaciones adicionales sobre la venta', required: false })
  @IsOptional()
  @IsString()
  observaciones?: string; 

  @ApiProperty({ type: [CreateSaleDetailDto], description: 'Detalles de los productos vendidos en esta venta' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleDetailDto)
  detalle_ventas: CreateSaleDetailDto[]; 
}