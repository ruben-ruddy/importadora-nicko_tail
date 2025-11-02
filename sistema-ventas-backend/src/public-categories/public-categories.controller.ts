// public-categories.controller.ts
import { Controller, Get } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PublicCategoryDto } from './dto/public-category.dto';

@ApiTags('Public - Categorías')
@Controller('/public/categories')
export class PublicCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}
 // Endpoint público para obtener categorías activas
  @ApiOperation({ summary: 'Obtiene categorías activas (público)' })
  @ApiResponse({ status: 200, description: 'Listado de categorías' })
  @Get()
  async getActiveCategories(): Promise<PublicCategoryDto[]>{
    return this.categoriesService.findActiveCategories();
  }
  
}
