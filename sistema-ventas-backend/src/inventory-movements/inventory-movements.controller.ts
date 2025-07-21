// src/inventory-movements/inventory-movements.controller.ts (o la ruta correcta)
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { InventoryMovementsService } from './inventory-movements.service'; // Asegúrate de que esta ruta sea correcta
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto'; // Asumiendo que tienes estos DTOs
import { UpdateInventoryMovementDto } from './dto/update-inventory-movement.dto';
import { InventoryMovementQueryDto } from './dto/inventory-movement-query.dto'; // Si tienes un DTO para consultas

import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator'; // Importa el decorador Roles

import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';


@ApiTags('Movimientos de Inventario') // Etiqueta para Swagger UI
@ApiBearerAuth('access-token') // Indica que todos los endpoints requieren token JWT
@UseGuards(AuthGuard('jwt'), RolesGuard) // Aplica guardias a nivel de controlador
@Controller('inventory-movements') // Prefijo de ruta para todos los endpoints de este controlador
export class InventoryMovementsController {
  constructor(private readonly inventoryMovementsService: InventoryMovementsService) {}

  @Post()
  // Solo los Administradores y Almaceneros pueden crear movimientos de inventario
  @Roles('Administrador', 'Almacenero')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crea un nuevo movimiento de inventario (Roles: Administrador, Almacenero)' })
  @ApiResponse({ status: 201, description: 'Movimiento de inventario creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  @ApiResponse({ status: 404, description: 'Producto o usuario no encontrado.' })
  create(@Body() createInventoryMovementDto: CreateInventoryMovementDto) {
    return this.inventoryMovementsService.create(createInventoryMovementDto);
  }

  @Get()
  // Administradores y Almaceneros pueden listar movimientos de inventario
  @Roles('Administrador', 'Almacenero')
  @ApiOperation({ summary: 'Obtiene todos los movimientos de inventario (Roles: Administrador, Almacenero)' })
  @ApiQuery({ name: 'type', required: false, type: String, description: 'Filtrar por tipo de movimiento (entrada/salida).' })
  @ApiQuery({ name: 'productId', required: false, type: String, description: 'Filtrar por ID de producto.' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filtrar por ID de usuario que realizó el movimiento.' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Fecha de inicio para el filtro por rango de fechas (YYYY-MM-DD).' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Fecha de fin para el filtro por rango de fechas (YYYY-MM-DD).' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página.', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número de elementos por página.', example: 10 })
  @ApiResponse({ status: 200, description: 'Lista de movimientos de inventario.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  findAll(@Query() query: InventoryMovementQueryDto) {
    return this.inventoryMovementsService.findAll(query);
  }

  @Get(':id')
  // Administradores y Almaceneros pueden ver un movimiento específico
  @Roles('Administrador', 'Almacenero')
  @ApiOperation({ summary: 'Obtiene un movimiento de inventario por ID (Roles: Administrador, Almacenero)' })
  @ApiParam({ name: 'id', description: 'ID del movimiento de inventario (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Movimiento de inventario encontrado.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  @ApiResponse({ status: 404, description: 'Movimiento de inventario no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.inventoryMovementsService.findOne(id);
  }

  // Nota: Los movimientos de inventario a menudo no se "actualizan" o "eliminan" directamente
  // para mantener un historial auditable, sino que se crean nuevos movimientos para revertir o ajustar.
  // Sin embargo, si tu lógica de negocio lo requiere, aquí están los ejemplos:

  @Patch(':id')
  // Solo los Administradores y Almaceneros pueden actualizar movimientos de inventario
  @Roles('Administrador', 'Almacenero')
  @ApiOperation({ summary: 'Actualiza un movimiento de inventario por ID (Roles: Administrador, Almacenero)' })
  @ApiParam({ name: 'id', description: 'ID del movimiento de inventario (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Movimiento de inventario actualizado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  @ApiResponse({ status: 404, description: 'Movimiento de inventario no encontrado.' })
  update(@Param('id') id: string, @Body() updateInventoryMovementDto: UpdateInventoryMovementDto) {
    return this.inventoryMovementsService.update(id, updateInventoryMovementDto);
  }

  @Delete(':id')
  // Solo los Administradores pueden eliminar movimientos de inventario (con precaución)
  @Roles('Administrador')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina un movimiento de inventario por ID (Roles: Administrador)' })
  @ApiParam({ name: 'id', description: 'ID del movimiento de inventario (UUID)', type: 'string' })
  @ApiResponse({ status: 204, description: 'Movimiento de inventario eliminado exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  @ApiResponse({ status: 404, description: 'Movimiento de inventario no encontrado.' })
  @ApiResponse({ status: 409, description: 'Conflicto de integridad referencial (si hay dependencias).' })
  remove(@Param('id') id: string) {
    return this.inventoryMovementsService.remove(id);
  }
}