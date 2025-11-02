// src/purchases/dto/update-purchase.dto.ts
import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePurchaseDto, CreatePurchaseDetailDto, DtoPurchaseState } from './create-purchase.dto';
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
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// DTO específico para la actualización de un PurchaseDetail.
export class UpdatePurchaseDetailDto extends PartialType(CreatePurchaseDetailDto) {
  @ApiProperty({
    description: 'ID del detalle de compra existente. Requerido para modificar un detalle existente, opcional para un nuevo detalle.',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID(undefined, { message: 'El id_detalle_compra debe ser un UUID válido si está presente.' })
  id_detalle_compra?: string; 
}

// DTO para la actualización de una compra completa.
export class UpdatePurchaseDto extends PartialType(
  OmitType(CreatePurchaseDto, ['detalle_compras']), 
) {
 
  @ApiProperty({
    type: [UpdatePurchaseDetailDto],
    description: 'Lista de detalles de productos comprados. Para actualizar un detalle existente, incluya su id_detalle_compra. Para añadir uno nuevo, omita el id_detalle_compra. Para eliminar uno, no lo incluya en la lista.',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePurchaseDetailDto)
  detalle_compras?: UpdatePurchaseDetailDto[];

  @ApiProperty({ description: 'Nuevo número único de la compra (opcional)', example: 'COMPRA-2024-0002', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  numero_compra?: string;

  @ApiProperty({ description: 'Total final de la compra', type: Number, format: 'float', example: 600.00, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  total?: number;

  @ApiProperty({ description: 'Estado actual de la compra', enum: DtoPurchaseState, required: false })
  @IsOptional()
  @IsEnum(DtoPurchaseState)
  estado?: DtoPurchaseState;

  @ApiProperty({ description: 'Observaciones adicionales sobre la compra', required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;
}