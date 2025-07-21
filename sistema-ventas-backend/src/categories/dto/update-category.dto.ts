// src/categories/dto/update-category.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

// PartialType hace que todas las propiedades de CreateCategoryDto sean opcionales
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}