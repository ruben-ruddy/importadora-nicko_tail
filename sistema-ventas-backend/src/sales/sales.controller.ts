// src/sales/sales.controller.ts 
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SalesService } from './sales.service'; 
import { CreateSaleDto } from './dto/create-sale.dto'; 
import { UpdateSaleDto } from './dto/update-sale.dto';
import { SaleQueryDto } from './dto/sale-query.dto'; 
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator'; 

import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('Ventas') // Etiqueta para Swagger UI
//@ApiBearerAuth('access-token') // Indica que todos los endpoints requieren token JWT
//@UseGuards(AuthGuard('jwt'), RolesGuard) // Aplica guardias a nivel de controlador
@Controller('sales') // Prefijo de ruta para todos los endpoints de este controlador
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // Endpoint para crear una nueva venta
  @Post()
  // Solo los Vendedores y Administradores pueden crear ventas
  //@Roles('Administrador', 'Vendedor')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crea una nueva venta (Roles: Administrador, Vendedor)' })
  @ApiResponse({ status: 201, description: 'Venta creada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  @ApiResponse({ status: 404, description: 'Cliente, producto o usuario no encontrado. Stock insuficiente.' })
  create(@Body() createSaleDto: CreateSaleDto) {
    return this.salesService.create(createSaleDto);
  }

  // Endpoint para obtener todas las ventas con filtros y paginación
  @Get()
  // Administradores, Vendedores y Cajeros pueden listar ventas
  //@Roles('Administrador', 'Vendedor', 'Cajero')
  @ApiOperation({ summary: 'Obtiene todas las ventas (Roles: Administrador, Vendedor, Cajero)' })
  @ApiQuery({ name: 'clientId', required: false, type: String, description: 'Filtrar por ID de cliente.' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filtrar por ID de usuario que realizó la venta.' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Fecha de inicio para el filtro por rango de fechas (YYYY-MM-DD).' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Fecha de fin para el filtro por rango de fechas (YYYY-MM-DD).' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página.', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número de elementos por página.', example: 10 })
  @ApiResponse({ status: 200, description: 'Lista de ventas.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  findAll(@Query() query: SaleQueryDto) {
    return this.salesService.findAll(query);
  }

  // Endpoint para obtener una venta por id
  @Get(':id')
  // Administradores, Vendedores y Cajeros pueden ver una venta específica
  //@Roles('Administrador', 'Vendedor', 'Cajero')
  @ApiOperation({ summary: 'Obtiene una venta por ID (Roles: Administrador, Vendedor, Cajero)' })
  @ApiParam({ name: 'id', description: 'ID de la venta (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Venta encontrada.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  @ApiResponse({ status: 404, description: 'Venta no encontrada.' })
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  // Endpoint para actualizar una venta por id
  @Patch(':id')
  // Solo los Administradores y Vendedores pueden actualizar ventas (con mucha precaución)
  //@Roles('Administrador', 'Vendedor')
  @ApiOperation({ summary: 'Actualiza una venta por ID (Roles: Administrador, Vendedor)' })
  @ApiParam({ name: 'id', description: 'ID de la venta (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Venta actualizada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  @ApiResponse({ status: 404, description: 'Venta no encontrada.' })
  @ApiResponse({ status: 409, description: 'Conflicto de stock o datos.' })
  update(@Param('id') id: string, @Body() updateSaleDto: UpdateSaleDto) {
    // Nota: La actualización de ventas a menudo implica lógica compleja de reversión/recalculo de inventario
    // o se limita a cambios de estado (ej. pagado, enviado).
    return this.salesService.update(id, updateSaleDto);
  }

  // Endpoint para eliminar una venta por id
  @Delete(':id')
  // Solo los Administradores pueden eliminar ventas (con extrema precaución)
  //@Roles('Administrador')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina una venta por ID (Roles: Administrador)' })
  @ApiParam({ name: 'id', description: 'ID de la venta (UUID)', type: 'string' })
  @ApiResponse({ status: 204, description: 'Venta eliminada exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  @ApiResponse({ status: 404, description: 'Venta no encontrada.' })
  @ApiResponse({ status: 409, description: 'Conflicto de integridad referencial o de stock.' })
  remove(@Param('id') id: string) {
    return this.salesService.remove(id);
  }
}