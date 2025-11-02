import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
//import { CreateRoleDto, UpdateRoleDto } from './dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}
 
  // Endpoint para crear un nuevo rol
  @Post()
  @ApiOperation({ summary: 'Crear nuevo rol' })
  @ApiResponse({ status: 201, description: 'Rol creado exitosamente' })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  // Endpoint para obtener todos los roles activos
  @Get()
  @ApiOperation({ summary: 'Obtener todos los roles activos' })
  findAll() {
    return this.rolesService.findAll();
  }

  // Endpoint para obtener un rol por ID
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un rol por ID' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  // Endpoint para actualizar un rol por ID
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un rol' })
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  // Endpoint para desactivar un rol (eliminación lógica)
  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar un rol (eliminación lógica)' })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}