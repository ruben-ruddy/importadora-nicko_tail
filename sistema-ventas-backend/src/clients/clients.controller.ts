// src/clients/clients.controller.ts (o la ruta donde tengas tu controlador de clientes)
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ClientsService } from './clients.service'; 
import { CreateClientDto } from './dto/create-client.dto'; 
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientQueryDto } from './dto/client-query.dto'; 

import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator'; // Importa el decorador Roles

import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('Clientes') // Etiqueta para Swagger UI
//@ApiBearerAuth('access-token') // Indica que todos los endpoints requieren token JWT
//@UseGuards(AuthGuard('jwt'), RolesGuard) // Aplica guardias a nivel de controlador
@Controller('clients') // Prefijo de ruta para todos los endpoints de este controlador
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}
  //endpoint para crear un cliente
  @Post()
  // Solo los Administradores y Vendedores pueden crear clientes
  //@Roles('Administrador', 'Vendedor')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crea un nuevo cliente (Roles: Administrador, Vendedor)' })
  @ApiResponse({ status: 201, description: 'Cliente creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  @ApiResponse({ status: 409, description: 'El cliente ya existe (cédula o email).' })
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }
//endpoint para obtener todos los clientes con filtros y paginación
  @Get()
  // Administradores, Vendedores y Cajeros pueden listar clientes
 // @Roles('Administrador', 'Vendedor', 'Cajero')
  @ApiOperation({ summary: 'Obtiene todos los clientes (Roles: Administrador, Vendedor, Cajero)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Término de búsqueda por nombre, cédula o email.' })
  @ApiQuery({ name: 'active', required: false, type: String, enum: ['true', 'false'], description: 'Filtrar por estado activo.' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página.', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número de elementos por página.', example: 10 })
  @ApiResponse({ status: 200, description: 'Lista de clientes.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  findAll(@Query() query: ClientQueryDto) {
    return this.clientsService.findAll(query);
  }
//endpoint para obtener un cliente por id
  @Get(':id')
  // Administradores, Vendedores y Cajeros pueden ver un cliente específico
  //@Roles('Administrador', 'Vendedor', 'Cajero')
  @ApiOperation({ summary: 'Obtiene un cliente por ID (Roles: Administrador, Vendedor, Cajero)' })
  @ApiParam({ name: 'id', description: 'ID del cliente (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Cliente encontrado.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }
//endpoint para actualizar un cliente por id
  @Patch(':id')
  // Solo los Administradores y Vendedores pueden actualizar clientes
  //@Roles('Administrador', 'Vendedor')
  @ApiOperation({ summary: 'Actualiza un cliente por ID (Roles: Administrador, Vendedor)' })
  @ApiParam({ name: 'id', description: 'ID del cliente (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Cliente actualizado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado.' })
  @ApiResponse({ status: 409, description: 'El cliente ya existe con la nueva cédula o email.' })
  update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(id, updateClientDto);
  }
//endpoint para eliminar un cliente por id
  @Delete(':id')
  // Solo los Administradores pueden eliminar clientes
  //@Roles('Administrador')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina un cliente por ID (Roles: Administrador)' })
  @ApiParam({ name: 'id', description: 'ID del cliente (UUID)', type: 'string' })
  @ApiResponse({ status: 204, description: 'Cliente eliminado exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado.' })
  @ApiResponse({ status: 409, description: 'Conflicto de integridad referencial (si tiene ventas asociadas).' })
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }
}