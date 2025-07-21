// src/categories/categories.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';

@ApiTags('Categorías') // Etiqueta para Swagger UI
@ApiBearerAuth('access-token') // Indica que todos los endpoints requieren token JWT
@UseGuards(AuthGuard('jwt'), RolesGuard) // Aplica guardias a nivel de controlador
@Controller('categories') // Prefijo de ruta para todos los endpoints de este controlador
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles('Administrador') // Solo administradores pueden crear categorías
  @HttpCode(HttpStatus.CREATED) // Código de estado 201 para creación exitosa
  @ApiOperation({ summary: 'Crea una nueva categoría (Solo Administradores)' })
  @ApiResponse({ status: 201, description: 'Categoría creada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido (no tiene el rol requerido).' })
  @ApiResponse({ status: 409, description: 'La categoría ya existe.' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @Roles('Administrador', 'Vendedor', 'Almacenero', 'Cajero') // Roles que pueden listar categorías
  @ApiOperation({ summary: 'Obtiene todas las categorías (Roles: Administrador, Vendedor, Almacenero, Cajero)' })
  @ApiResponse({ status: 200, description: 'Lista de categorías.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @Roles('Administrador', 'Vendedor', 'Almacenero', 'Cajero') // Roles que pueden ver una categoría específica
  @ApiOperation({ summary: 'Obtiene una categoría por ID (Roles: Administrador, Vendedor, Almacenero, Cajero)' })
  @ApiParam({ name: 'id', description: 'ID de la categoría (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Categoría encontrada.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada.' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @Roles('Administrador') // Solo administradores pueden actualizar categorías
  @ApiOperation({ summary: 'Actualiza una categoría por ID (Solo Administradores)' })
  @ApiParam({ name: 'id', description: 'ID de la categoría (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Categoría actualizada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada.' })
  @ApiResponse({ status: 409, description: 'La categoría ya existe con el nuevo nombre.' })
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @Roles('Administrador') // Solo administradores pueden eliminar categorías
  @HttpCode(HttpStatus.NO_CONTENT) // Código de estado 204 para eliminación exitosa (sin contenido de respuesta)
  @ApiOperation({ summary: 'Elimina una categoría por ID (Solo Administradores)' })
  @ApiParam({ name: 'id', description: 'ID de la categoría (UUID)', type: 'string' })
  @ApiResponse({ status: 204, description: 'Categoría eliminada exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada.' })
  @ApiResponse({ status: 409, description: 'Conflicto de integridad referencial (si tiene productos asociados).' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}