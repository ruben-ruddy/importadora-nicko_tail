// src/prisma/prisma.module.ts
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Hace que este módulo esté disponible globalmente.
          // Si no quieres que sea global, no uses @Global(), y deberás importar PrismaModule
          // en cada módulo que lo necesite (como AuthModule, CategoriesModule, etc.).
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // <-- ¡MUY IMPORTANTE! Exporta PrismaService
})
export class PrismaModule {}