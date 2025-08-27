// src/forecast/dto/forecast-request.dto.ts
import { IsString, IsOptional, IsNumber, IsArray, IsIn, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class ForecastParameters {
  @IsOptional()
  @IsNumber()
  periodos?: number;

  @IsOptional()
  @IsNumber()
  alpha?: number;

  @IsOptional()
  @IsNumber()
  estacionalidad?: number;
}

export class ForecastRequestDto {
  @IsString()
  @IsIn(['lineal', 'promedio_movil', 'estacional'])
  metodo: string;

  @IsString()
  @IsIn(['diario', 'semanal', 'mensual'])
  periodo: string;

  @IsString()
  fecha_inicio: string;

  @IsString()
  fecha_fin: string;

  @IsOptional()
  @IsArray()
  productos?: string[];

  @IsOptional()
  @IsArray()
  categorias?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ForecastParameters)
  parametros?: ForecastParameters;
}