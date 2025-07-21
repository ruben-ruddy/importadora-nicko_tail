// src/products/products.module.ts
import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Importa el PrismaModule

@Module({
  imports: [PrismaModule], // ¡Importante! Aquí se importa PrismaModule para que ProductsService pueda usar PrismaService
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}