// src/purchases/dto/create-purchase-detail.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class CreatePurchaseDetailDto {
  @ApiProperty({ description: 'ID del producto comprado', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @IsUUID('4', { message: 'El ID de producto debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El ID de producto es obligatorio.' })
  id_producto: string;

  @ApiProperty({ description: 'Cantidad del producto comprado', example: 5 })
  @IsNumber({}, { message: 'La cantidad debe ser un número.' })
  @IsNotEmpty({ message: 'La cantidad es obligatoria.' })
  @Min(1, { message: 'La cantidad debe ser al menos 1.' })
  cantidad: number;

  @ApiProperty({ description: 'Precio unitario de compra del producto', example: 500.00 })
  @IsNumber({}, { message: 'El precio unitario debe ser un número.' })
  @IsNotEmpty({ message: 'El precio unitario es obligatorio.' })
  @Min(0, { message: 'El precio unitario no puede ser negativo.' })
  precio_unitario: number;
}