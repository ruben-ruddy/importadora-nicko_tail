// src/public-products/public-products.module.ts
import { Module } from '@nestjs/common';
import { PublicProductsController } from './public-products.controller';
import { ProductsService } from '../products/products.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PublicProductsController],
  providers: [ProductsService],
})
export class PublicProductsModule {}