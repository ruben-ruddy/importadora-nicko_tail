//public-categories.module.ts
import { Module } from '@nestjs/common';
import { PublicCategoriesController } from './public-categories.controller';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [CategoriesModule], // Importa el módulo que contiene el servicio
  controllers: [PublicCategoriesController],
})
export class PublicCategoriesModule {}