// src/products/dto/update-product.dto.ts
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
import { IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProductDto extends PartialType(CreateProductDto) {
    @ApiProperty({ description: 'Nuevo ID de la categoría (UUID)', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', required: false })
    @IsUUID('4', { message: 'El ID de categoría debe ser un UUID válido.' })
    @IsOptional()
    id_categoria?: string;

    // === El campo imagen_url permanece aquí, ahora se llenará con la URL del DMS ===
  @ApiPropertyOptional({ description: 'URL de la imagen del producto (obtenida del DMS)', example: '/uploads/1678912345-mi-imagen.jpg' })
  @IsOptional()
  @IsString()
  imagen_url?: string; // Ahora contendrá la URL devuelta por el servicio DMS
}