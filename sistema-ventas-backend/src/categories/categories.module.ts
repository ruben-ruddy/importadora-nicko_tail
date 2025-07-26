// src/categories/categories.module.ts
import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { PrismaModule } from '../prisma/prisma.module'; // <-- ¡Importa PrismaModule aquí!

@Module({
  imports: [PrismaModule], // <-- Aquí es donde se importa PrismaModule
  controllers: [CategoriesController],
  providers: [CategoriesService], // <-- Solo CategoriesService aquí
  exports: [CategoriesService],  // Asegúrate de exportar el servicio
})
export class CategoriesModule {}