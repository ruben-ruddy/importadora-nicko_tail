// src/reports/dto/report-query.dto.ts
import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReportQueryDto {
  @ApiProperty({ description: 'Fecha de inicio del reporte (YYYY-MM-DD)', example: '2024-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Fecha de fin del reporte (YYYY-MM-DD)', example: '2024-12-31' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'ID de usuario para filtrar por vendedor', required: false })
  @IsOptional()
  @IsString()
  userId?: string;
}