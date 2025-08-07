// src/users/users.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto'; // Si tienes este DTO
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('Usuarios')
//@ApiBearerAuth('access-token')
//@UseGuards(AuthGuard('jwt'), RolesGuard) // Aplica guardias
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  // Definimos los roles directamente como strings
  //@Roles('Administrador')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crea un nuevo usuario (Roles: Administrador)' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  @ApiResponse({ status: 409, description: 'El usuario ya existe (nombre de usuario o email).' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  // Definimos los roles directamente como strings
  //@Roles('Administrador')
  @ApiOperation({ summary: 'Obtiene todos los usuarios (Roles: Administrador)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Término de búsqueda por nombre de usuario o email.' })
  @ApiQuery({ name: 'active', required: false, type: String, enum: ['true', 'false'], description: 'Filtrar por estado activo.' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página.', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número de elementos por página.', example: 10 })
  @ApiResponse({ status: 200, description: 'Lista de usuarios.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  // Definimos los roles directamente como strings
  //@Roles('Administrador', 'Cajero')
  @ApiOperation({ summary: 'Obtiene un usuario por ID (Roles: Administrador, Cajero)' })
  @ApiParam({ name: 'id', description: 'ID del usuario (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  // Definimos los roles directamente como strings
  //@Roles('Administrador')
  @ApiOperation({ summary: 'Actualiza un usuario por ID (Roles: Administrador)' })
  @ApiParam({ name: 'id', description: 'ID del usuario (UUID)', type: 'string' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  @ApiResponse({ status: 404, description: 'Usuario o categoría no encontrados.' })
  @ApiResponse({ status: 409, description: 'El usuario ya existe con el nuevo nombre de usuario o email.' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  // Definimos los roles directamente como strings
  //@Roles('Administrador')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina un usuario por ID (Roles: Administrador)' })
  @ApiParam({ name: 'id', description: 'ID del usuario (UUID)', type: 'string' })
  @ApiResponse({ status: 204, description: 'Usuario eliminado exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @ApiResponse({ status: 409, description: 'Conflicto de integridad referencial.' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}