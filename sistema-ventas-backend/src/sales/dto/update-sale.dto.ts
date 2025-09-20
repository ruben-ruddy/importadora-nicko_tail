// src/sales/dto/update-sale.dto.ts
import { PartialType, OmitType } from '@nestjs/swagger'; // Asegúrate de importar OmitType
import { CreateSaleDto, CreateSaleDetailDto } from './create-sale.dto';
import {
  IsArray,
  IsOptional,
  ValidateNested,
  IsUUID,
  IsNumber,
  Min,
  IsDecimal,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Este DTO de detalle de actualización es correcto como lo habíamos definido
export class UpdateSaleDetailDto extends PartialType(CreateSaleDetailDto) {
  @ApiProperty({
    description: 'ID del detalle de venta existente. Requerido para modificar un detalle existente, opcional para un nuevo detalle.',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID(undefined, { message: 'El id_detalle_venta debe ser un UUID válido si está presente.' })
  id_detalle_venta?: string;
}

/**
 * DTO para actualizar una venta.
 * Se crea a partir de CreateSaleDto, omitiendo 'detalle_ventas'
 * para luego definirla explícitamente con UpdateSaleDetailDto.
 */
export class UpdateSaleDto extends PartialType(
  OmitType(CreateSaleDto, ['detalle_ventas']), // <--- ¡CAMBIO CLAVE AQUÍ!
) {
  // Ahora definimos explícitamente 'detalle_ventas' con el tipo correcto
  @ApiProperty({
    type: [UpdateSaleDetailDto],
    description: 'Lista de detalles de productos vendidos. Para actualizar un detalle existente, incluya su id_detalle_venta. Para añadir uno nuevo, omita el id_detalle_venta. Para eliminar uno, no lo incluya en la lista.',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSaleDetailDto)
  detalle_ventas?: UpdateSaleDetailDto[]; // Esto es lo que rompe la compatibilidad si no se omite

  // Mantén el resto de propiedades que desees sobrescribir o añadir
  @ApiProperty({ description: 'Nuevo número único de la venta (opcional)', example: 'VENTA-2024-0002', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  numero_venta?: string;

  @ApiProperty({ description: 'Subtotal de la venta antes de descuentos e impuestos', type: Number, format: 'float', example: 100.00, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  //@IsDecimal({ decimal_digits: '1,2' })
  subtotal?: number;

  @ApiProperty({ description: 'Descuento total aplicado a la venta', required: false, type: Number, format: 'float', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  //@IsDecimal({ decimal_digits: '1,2' })
  descuento?: number;

  @ApiProperty({ description: 'Impuesto total aplicado a la venta', required: false, type: Number, format: 'float', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  //@IsDecimal({ decimal_digits: '1,2' })
  impuesto?: number;

  @ApiProperty({ description: 'Total final de la venta', type: Number, format: 'float', example: 100.00, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  //@IsDecimal({ decimal_digits: '1,2' })
  total?: number;
}