import { IsString, IsOptional, IsNumber, ValidateNested, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class ForecastParameters {
  @IsOptional()
  @IsNumber()
  @Min(1)
  periodos?: number = 6;
  
  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(12)
  ventana?: number = 3;
  
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(1.0)
  alpha?: number = 0.3;
}

export class ForecastRequestDto {
  @IsString()
  @IsIn(['promedio_movil']) // Solo permitimos promedio móvil
  metodo: string;

  @IsString()
  @IsIn(['diario', 'semanal', 'mensual'])
  periodo: string;

  @IsString()
  fecha_inicio: string;

  @IsString()
  fecha_fin: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ForecastParameters)
  parametros?: ForecastParameters;
}