// src/dms/dto/dms-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsInt,
  IsOptional,
  IsDate,
  ValidateIf, 
} from 'class-validator';
import { Type } from 'class-transformer';

export class DmsResponseDto {
  @ApiProperty({ description: 'ID único de la entrada DMS', format: 'uuid' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Nombre original del archivo' })
  @IsString()
  fileName: string;

  @ApiProperty({ description: 'Ruta de almacenamiento interna en el servidor' })
  @IsString()
  path: string;

  @ApiProperty({ description: 'Tipo MIME del archivo', example: 'image/jpeg' })
  @IsString()
  mimeType: string;

  @ApiProperty({ description: 'Tipo general del archivo (ej. image, document)', example: 'image' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'ID del usuario que subió el archivo (opcional)', required: false, nullable: true })
  @IsOptional() 
  @ValidateIf(o => o.user !== null) 
  @IsUUID()
  user?: string | null; 

  @ApiProperty({ description: 'Módulo asociado al archivo (ej. products, users) (opcional)', required: false, nullable: true })
  @IsOptional() 
  @ValidateIf(o => o.module !== null) 
  @IsString()
  module?: string | null; 

  @ApiProperty({ description: 'Tamaño del archivo en bytes (opcional)', required: false, nullable: true })
  @IsOptional() 
  @ValidateIf(o => o.size !== null) 
  @IsInt()
  @Type(() => Number)
  size?: number | null; 

  @ApiProperty({ description: 'Fecha y hora de creación de la entrada DMS', type: String, format: 'date-time' })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({ description: 'URL pública para acceder al archivo', example: '/uploads/1234567890-imagen.jpg' })
  @IsString()
  url: string; 
}
