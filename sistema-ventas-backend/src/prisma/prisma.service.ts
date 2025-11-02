// src/prisma/prisma.service.ts
import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
// Servicio Prisma personalizado para NestJS
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super();
  }
// Conexión automática al iniciar el módulo
  async onModuleInit() {
    await this.$connect();
    console.log('Prisma conectado a la base de datos.');
  }
// Desconexión al destruir el módulo
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('Prisma desconectado de la base de datos.');
  }
// Habilitar hooks para cerrar la aplicación correctamente
  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}