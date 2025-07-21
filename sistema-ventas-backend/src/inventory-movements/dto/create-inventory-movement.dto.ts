// src/inventory-movements/dto/create-inventory-movement.dto.ts
import { IsString, IsNotEmpty, IsNumber, Min, IsEnum, IsOptional, IsUUID, IsDecimal, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer'; // Necesario para IsDecimal si usas Type

// Si tu enum en Prisma es MovementType y tiene valores 'ENTRADA', 'SALIDA'
// y quieres usar strings 'entrada', 'salida' en tu DTO:
export enum DtoMovementType {
  ENTRADA = 'entrada', // Mapea el valor de Prisma a un string más amigable
  SALIDA = 'salida',
}

export class CreateInventoryMovementDto {
  @ApiProperty({ description: 'ID del producto afectado', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  id_producto: string; // Coincide con schema.prisma

  @ApiProperty({ description: 'ID del usuario que realiza el movimiento', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  id_usuario: string; // Coincide con schema.prisma

  @ApiProperty({ description: 'Tipo de movimiento (entrada o salida)', enum: DtoMovementType })
  @IsEnum(DtoMovementType)
  @IsNotEmpty()
  tipo_movimiento: DtoMovementType; // Coincide con schema.prisma (usando el DtoMovementType)

  @ApiProperty({ description: 'Cantidad de unidades del movimiento', example: 10 })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  cantidad: number; // Coincide con schema.prisma

  @ApiProperty({ description: 'Precio unitario del producto en el momento del movimiento', required: false, type: Number, format: 'float', example: 25.50 })
  @IsOptional()
  @IsNumber({}, { message: 'El precio unitario debe ser un número.' })
  @Type(() => Number) // Importante para transformar de string a number si viene de query/body
  @IsDecimal({ decimal_digits: '1,2' }, { message: 'El precio unitario debe tener hasta 2 decimales.' })
  precio_unitario?: number; // Coincide con schema.prisma

  @ApiProperty({ description: 'Referencia del movimiento (ej. número de factura, nota de envío)', required: false, maxLength: 100 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  referencia?: string; // Coincide con schema.prisma

  @ApiProperty({ description: 'Observaciones adicionales sobre el movimiento', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  observaciones?: string; // Coincide con schema.prisma

  @ApiProperty({ description: 'Fecha y hora del movimiento (ISO 8601)', required: false, example: '2025-07-11T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  fecha_movimiento?: Date; // Coincide con schema.prisma
}