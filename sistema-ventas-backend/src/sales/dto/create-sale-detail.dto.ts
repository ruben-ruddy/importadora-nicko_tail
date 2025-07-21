// src/sales/dto/create-sale-detail.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class CreateSaleDetailDto {
  @ApiProperty({ description: 'ID del producto vendido', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @IsUUID('4', { message: 'El ID de producto debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El ID de producto es obligatorio.' })
  id_producto: string;

  @ApiProperty({ description: 'Cantidad del producto vendido', example: 2 })
  @IsNumber({}, { message: 'La cantidad debe ser un número.' })
  @IsNotEmpty({ message: 'La cantidad es obligatoria.' })
  @Min(1, { message: 'La cantidad debe ser al menos 1.' })
  cantidad: number;
}