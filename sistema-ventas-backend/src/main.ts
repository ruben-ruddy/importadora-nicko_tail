// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';

// Función principal para arrancar la aplicación
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.enableCors({
    //origin: '*',
    origin: configService.get('FRONTEND_URL') || 'http://localhost:4200',
    methods: '*',
    allowedHeaders: '*',
    credentials: true,
  });

  app.setGlobalPrefix('api'); 

  // Habilita la validación global de DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Sistema de Ventas y Compras con Catálogo en Línea')
    .setDescription('API para la gestión de ventas, compras e inventario, incluyendo un catálogo de productos.')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Introduce tu token JWT',
        in: 'header',
      },
      'access-token'
    )
    .build();

    // Crear el documento de Swagger
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); 

  await app.listen(3000);
  console.log(`Aplicación ejecutándose en: ${await app.getUrl()}`);
  console.log(`Documentación de Swagger disponible en: ${await app.getUrl()}/api/docs`);
}
bootstrap();