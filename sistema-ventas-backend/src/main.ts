// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common'; // Importa ValidationPipe
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  // const app = await NestFactory.create(AppModule);
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

/////

app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
    });

  app.enableCors({
    origin: '*',
    methods: '*',
    allowedHeaders: '*',
    credentials: true,
  });
/////

  // Habilita la validación global de DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Remueve propiedades que no están definidas en el DTO
    forbidNonWhitelisted: true, // Lanza un error si hay propiedades no permitidas
    transform: true, // Transforma los payloads a instancias del DTO
  }));

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

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
  console.log(`Aplicación ejecutándose en: ${await app.getUrl()}`);
  console.log(`Documentación de Swagger disponible en: ${await app.getUrl()}/api/docs`);
}
bootstrap();