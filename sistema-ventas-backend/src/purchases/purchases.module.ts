// src/purchases/purchases.module.ts

import { Module } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Importa tu PrismaModule

@Module({
  imports: [PrismaModule], // Asegúrate de importar PrismaModule para que el servicio tenga acceso a PrismaService
  controllers: [PurchasesController],
  providers: [PurchasesService],
})
export class PurchasesModule {}