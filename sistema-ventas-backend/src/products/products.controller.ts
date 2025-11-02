// src/products/products.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('Productos') 
// @ApiBearerAuth('access-token') // Indica que todos los endpoints requieren token JWT
// @UseGuards(AuthGuard('jwt'), RolesGuard) // Aplica guardias a nivel de controlador
@Controller('products') // Prefijo de ruta para todos los endpoints de este controlador
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  //endpoint para crear un producto
  @Post()
  //@Roles('Administrador', 'Almacenero') // Solo administradores y almaceneros pueden crear productos
  @HttpCode(HttpStatus.CREATED) // Código de estado 201 para creación exitosa
  @ApiOperation({ summary: 'Crea un nuevo producto (Roles: Administrador, Almacenero)' })
  @ApiResponse({ status: 201, description: 'Producto creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada.' })
  @ApiResponse({ status: 409, description: 'El producto ya existe (nombre o SKU).' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  //endpoint para obtener todos los productos con filtros y paginación
  @Get()
  //@Roles('Administrador', 'Vendedor', 'Almacenero', 'Cajero') // Roles que pueden listar productos
  @ApiOperation({ summary: 'Obtiene todos los productos (Roles: Administrador, Vendedor, Almacenero, Cajero)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Término de búsqueda por nombre, descripción o SKU.' })
  @ApiQuery({ name: 'categoryId', required: false, type: String, description: 'Filtrar por ID de categoría (UUID).' })
  @ApiQuery({ name: 'active', required: false, type: String, enum: ['true', 'false'], description: 'Filtrar por estado activo.' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página.', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número de elementos por página.', example: 10 })
  @ApiResponse({ status: 200, description: 'Lista de productos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  //endpoint para obtener un producto por id
  @Get(':id')
 // @Roles('Administrador', 'Vendedor', 'Almacenero', 'Cajero') // Roles que pueden ver un producto específico
  @ApiOperation({ summary: 'Obtiene un producto por ID (Roles: Administrador, Vendedor, Almacenero, Cajero)' })
  @ApiParam({ name: 'id', description: 'ID del producto (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Producto encontrado.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  //endpoint para actualizar un producto por id
  @Patch(':id')
  //@Roles('Administrador', 'Almacenero') // Solo administradores y almaceneros pueden actualizar productos
  @ApiOperation({ summary: 'Actualiza un producto por ID (Roles: Administrador, Almacenero)' })
  @ApiParam({ name: 'id', description: 'ID del producto (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Producto actualizado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  @ApiResponse({ status: 404, description: 'Producto o categoría no encontrados.' })
  @ApiResponse({ status: 409, description: 'El producto ya existe con el nuevo nombre o codigo producto' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  //endpoint para eliminar un producto por id
  @Delete(':id')
  //º@Roles('Administrador', 'Almacenero') // Solo administradores y almaceneros pueden eliminar productos
  @HttpCode(HttpStatus.NO_CONTENT) // Código de estado 204 para eliminación exitosa (sin contenido de respuesta)
  @ApiOperation({ summary: 'Elimina un producto por ID (Roles: Administrador, Almacenero)' })
  @ApiParam({ name: 'id', description: 'ID del producto (UUID)', type: 'string' })
  @ApiResponse({ status: 204, description: 'Producto eliminado exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado.' })
  @ApiResponse({ status: 409, description: 'Conflicto de integridad referencial (si tiene movimientos de inventario o pedidos asociados).' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
  
}
