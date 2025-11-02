import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
//import { CreateRoleDto, UpdateRoleDto } from './dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  // Crear un nuevo rol
  async create(createRoleDto: CreateRoleDto) {
    return this.prisma.role.create({
      data: {
        nombre_rol: createRoleDto.nombre_rol,
        descripcion: createRoleDto.descripcion,
        activo: createRoleDto.activo ?? true
      },
    });
  }

  // Obtener todos los roles activos
  async findAll() {
    return this.prisma.role.findMany({
      where: { activo: true },
      select: {
        id_rol: true,
        nombre_rol: true,
        descripcion: true,
        fecha_creacion: true
      }
    });
  }

  // Obtener un rol por ID
  async findOne(id: string) {
    return this.prisma.role.findUnique({
      where: { id_rol: id },
      include: { usuarios: true }
    });
  }

  // Actualizar un rol por ID
  async update(id: string, updateRoleDto: UpdateRoleDto) {
    return this.prisma.role.update({
      where: { id_rol: id },
      data: updateRoleDto
    });
  }

  // Desactivar un rol (eliminación lógica)
  async remove(id: string) {
    return this.prisma.role.update({
      where: { id_rol: id },
      data: { activo: false }
    });
  }
}