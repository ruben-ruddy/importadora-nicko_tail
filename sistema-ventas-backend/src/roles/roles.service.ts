import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
//import { CreateRoleDto, UpdateRoleDto } from './dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    return this.prisma.role.create({
      data: {
        nombre_rol: createRoleDto.nombre_rol,
        descripcion: createRoleDto.descripcion,
        activo: createRoleDto.activo ?? true
      },
    });
  }

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

  async findOne(id: string) {
    return this.prisma.role.findUnique({
      where: { id_rol: id },
      include: { usuarios: true }
    });
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    return this.prisma.role.update({
      where: { id_rol: id },
      data: updateRoleDto
    });
  }

  async remove(id: string) {
    return this.prisma.role.update({
      where: { id_rol: id },
      data: { activo: false }
    });
  }
}