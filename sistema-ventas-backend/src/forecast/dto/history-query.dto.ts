// src/forecast/dto/history-query.dto.ts
import { IsString, IsOptional, IsIn } from 'class-validator';

export class HistoryQueryDto {
  @IsString()
  fecha_inicio: string;

  @IsString()
  fecha_fin: string;

  @IsString()
  @IsIn(['diario', 'semanal', 'mensual'])
  periodo: string;

  @IsOptional()
  @IsString()
  producto?: string;

  @IsOptional()
  @IsString()
  categoria?: string;
}