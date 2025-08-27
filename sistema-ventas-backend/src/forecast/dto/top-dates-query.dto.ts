import { IsString, IsOptional, IsIn, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class TopDatesQueryDto {
  @IsString()
  fecha_inicio: string;

  @IsString()
  fecha_fin: string;

  @IsString()
  @IsIn(['diario', 'semanal', 'mensual'])
  periodo: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number) // Importante: convertir query param a número
  limit?: number = 10;
}