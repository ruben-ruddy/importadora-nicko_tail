import { IsString, IsOptional, IsNumber, ValidateNested, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class ForecastParameters {
  @IsNumber()
  @Min(1)
  @Max(12)
  periodos: number; 
  
  @IsNumber()
  @Min(2)
  @Max(6)
  ventana: number; 
  
  @IsNumber()
  @Min(0.1)
  @Max(1.0)
  alpha: number; 
}

export class ForecastRequestDto {
  @IsString()
  @IsIn(['promedio_movil'])
  metodo: string;

  @IsString()
  @IsIn(['mensual']) // ✅ Solo mensual
  periodo: string;

  @IsString()
  fecha_inicio: string;

  @IsString()
  fecha_fin: string;

  @ValidateNested()
  @Type(() => ForecastParameters)
  parametros: ForecastParameters; // ✅ Ahora es obligatorio
}