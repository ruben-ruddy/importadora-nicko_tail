// src/purchases/purchases.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards, // <-- Importar UseGuards
  Request,   // <-- Importar Request para acceder al usuario (opcional, si necesitas el usuario)
} from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { PurchaseQueryDto } from './dto/purchase-query.dto';

// Importaciones para autenticación y autorización
import { AuthGuard } from '@nestjs/passport'; // Si usas AuthGuard('jwt')
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
//import { UserRole } from '@prisma/client'; // Importa el enum de Prisma

// Importaciones de Swagger
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('Compras') // Etiqueta para Swagger UI
@ApiBearerAuth('access-token') // Indica que todos los endpoints requieren token JWT
@UseGuards(AuthGuard('jwt'), RolesGuard) // Aplica guardias a nivel de controlador: primero autenticación, luego roles
@Controller('purchases') // Prefijo de ruta para todos los endpoints de este controlador
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  // Roles que pueden crear compras: Administrador, Almacenero
  @Roles('Administrador', 'Almacenero') // Usando el enum de Prisma
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crea una nueva compra (Roles: Administrador, Almacenero)' })
  @ApiResponse({ status: 201, description: 'Compra creada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado (token JWT inválido o ausente).' })
  @ApiResponse({ status: 403, description: 'Prohibido (el usuario no tiene el rol necesario).' })
  @ApiResponse({ status: 404, description: 'Producto o usuario no encontrado.' })
  @ApiResponse({ status: 409, description: 'Número de compra ya existente.' })
  async create(@Body() createPurchaseDto: CreatePurchaseDto) {
    return this.purchasesService.create(createPurchaseDto);
  }

  @Get()
  // Roles que pueden listar compras: Administrador, Almacenero, Vendedor
  // (Quizás un Vendedor solo vea las compras relacionadas con sus ventas, esto sería lógica en el servicio)
  @Roles('Administrador', 'Almacenero', 'Vendedor') // Usando el enum de Prisma
  @ApiOperation({ summary: 'Obtiene todas las compras (Roles: Administrador, Almacenero, Vendedor)' })
  @ApiQuery({ name: 'id_usuario', required: false, type: String, description: 'Filtrar por ID de usuario que realizó la compra.' })
  @ApiQuery({ name: 'numero_compra', required: false, type: String, description: 'Filtrar por número de compra (búsqueda parcial).' })
  @ApiQuery({ name: 'estado', required: false, enum: ['PENDIENTE', 'COMPLETADA', 'CANCELADA'], description: 'Filtrar por estado de la compra.' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Fecha de inicio para el filtro por rango de fechas (YYYY-MM-DD).' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Fecha de fin para el filtro por rango de fechas (YYYY-MM-DD).' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página.', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número de elementos por página.', example: 10 })
  @ApiResponse({ status: 200, description: 'Lista de compras.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  async findAll(@Query() query: PurchaseQueryDto) {
    return this.purchasesService.findAll(query);
  }

  @Get(':id')
  // Roles que pueden ver una compra específica: Administrador, Almacenero, Vendedor
  @Roles('Administrador', 'Almacenero', 'Vendedor') // Usando el enum de Prisma
  @ApiOperation({ summary: 'Obtiene una compra por ID (Roles: Administrador, Almacenero, Vendedor)' })
  @ApiParam({ name: 'id', description: 'ID de la compra (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Compra encontrada.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  @ApiResponse({ status: 404, description: 'Compra no encontrada.' })
  async findOne(@Param('id') id_compra: string) {
    return this.purchasesService.findOne(id_compra);
  }

  @Patch(':id')
  // Roles que pueden actualizar compras: Administrador, Almacenero
  @Roles('Administrador', 'Almacenero') // Usando el enum de Prisma
  @ApiOperation({ summary: 'Actualiza una compra por ID (Roles: Administrador, Almacenero)' })
  @ApiParam({ name: 'id', description: 'ID de la compra (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Compra actualizada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  @ApiResponse({ status: 404, description: 'Compra no encontrada.' })
  @ApiResponse({ status: 409, description: 'Conflicto de datos.' })
  async update(@Param('id') id_compra: string, @Body() updatePurchaseDto: UpdatePurchaseDto) {
    return this.purchasesService.update(id_compra, updatePurchaseDto);
  }

  @Delete(':id')
  // Roles que pueden eliminar compras: Administrador
  @Roles('Administrador') // Usando el enum de Prisma
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina una compra por ID (Roles: Administrador)' })
  @ApiParam({ name: 'id', description: 'ID de la compra (UUID)', type: 'string' })
  @ApiResponse({ status: 204, description: 'Compra eliminada exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  @ApiResponse({ status: 404, description: 'Compra no encontrada.' })
  @ApiResponse({ status: 409, description: 'Conflicto de integridad referencial o de stock.' })
  async remove(@Param('id') id_compra: string) {
    return this.purchasesService.remove(id_compra);
  }
}