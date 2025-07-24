// src/public-products/public-products.module.ts
import { Module } from '@nestjs/common';
import { PublicProductsController } from './public-products.controller';
import { ProductsService } from '../products/products.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PublicProductsController],
  providers: [ProductsService],
  // Exportar ProductsService si otros módulos fuera de 'public-products' lo van a importar
  // exports: [ProductsService], // <--- DESCOMENTA SI ES NECESARIO EN OTROS LUGARES
})
export class PublicProductsModule {}