// src/public-products/public-products.module.ts
import { Module } from '@nestjs/common';
import { PublicProductsController } from './public-products.controller';
import { ProductsService } from '../products/products.service'; // Importa ProductsService
import { PrismaModule } from '../prisma/prisma.module'; // Importa PrismaModule para ProductsService

@Module({
  imports: [PrismaModule], // ProductsService necesita PrismaModule
  controllers: [PublicProductsController],
  providers: [ProductsService], // Provee ProductsService para PublicProductsController
  // No es necesario exportar nada, ya que este módulo solo es para consumo interno.
})
export class PublicProductsModule {}