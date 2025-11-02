// src/inventory-movements/dto/create-inventory-movement.dto.ts
import { IsString, IsNotEmpty, IsNumber, Min, IsEnum, IsOptional, IsUUID, IsDecimal, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer'; // Necesario para IsDecimal si usas Type


export enum DtoMovementType {
  ENTRADA = 'entrada', 
  SALIDA = 'salida',
}

export class CreateInventoryMovementDto {
  @ApiProperty({ description: 'ID del producto afectado', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  id_producto: string; 

  @ApiProperty({ description: 'ID del usuario que realiza el movimiento', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  id_usuario: string; 

  @ApiProperty({ description: 'Tipo de movimiento (entrada o salida)', enum: DtoMovementType })
  @IsEnum(DtoMovementType)
  @IsNotEmpty()
  tipo_movimiento: DtoMovementType; 

  @ApiProperty({ description: 'Cantidad de unidades del movimiento', example: 10 })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  cantidad: number; 

  @ApiProperty({ description: 'Precio unitario del producto en el momento del movimiento', required: false, type: Number, format: 'float', example: 25.50 })
  @IsOptional()
  @IsNumber({}, { message: 'El precio unitario debe ser un número.' })
  @Type(() => Number) 
  @IsDecimal({ decimal_digits: '1,2' }, { message: 'El precio unitario debe tener hasta 2 decimales.' })
  precio_unitario?: number; 

  @ApiProperty({ description: 'Referencia del movimiento (ej. número de factura, nota de envío)', required: false, maxLength: 100 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  referencia?: string; 

  @ApiProperty({ description: 'Observaciones adicionales sobre el movimiento', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  observaciones?: string; 

  @ApiProperty({ description: 'Fecha y hora del movimiento (ISO 8601)', required: false, example: '2025-07-11T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  fecha_movimiento?: Date; 
}