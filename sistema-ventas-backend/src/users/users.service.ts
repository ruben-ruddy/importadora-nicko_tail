// src/users/users.service.ts
import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { User as PrismaUser } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<PrismaUser, 'password_hash'>> {
    // 1. Verificar si el rol existe
    const role = await this.prisma.role.findUnique({
      where: { id_rol: createUserDto.id_rol },
    });
    if (!role) {
      throw new NotFoundException(`El rol con ID "${createUserDto.id_rol}" no existe.`);
    }

    // 2. Verificar si el nombre de usuario o email ya existen
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { nombre_usuario: createUserDto.nombre_usuario },
          { email: createUserDto.email },
        ],
      },
    });
    if (existingUser) {
      throw new ConflictException('El nombre de usuario o email ya están registrados.');
    }

    // 3. Hashear la contraseña
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // 4. Crear el usuario
    try {
      const newUser = await this.prisma.user.create({
        data: {
          id_rol: createUserDto.id_rol,
          nombre_usuario: createUserDto.nombre_usuario,
          email: createUserDto.email,
          password_hash: hashedPassword,
          nombre_completo: createUserDto.nombre_completo,
          telefono: createUserDto.telefono,
          activo: createUserDto.activo,
        },
      });
      const { password_hash, ...result } = newUser;
      return result;
    } catch (error) {
      throw new BadRequestException('No se pudo crear el usuario. Verifique los datos.');
    }
  }

  async findAll(query: UserQueryDto): Promise<{ users: Omit<PrismaUser, 'password_hash'>[]; total: number; page: number; limit: number }> {
    const { search, id_rol, active, page = '1', limit = '50' } = query;

    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const where: any = {};

    if (search) {
      where.OR = [
        { nombre_usuario: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { nombre_completo: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (id_rol) {
      where.id_rol = id_rol;
    }
    if (active !== undefined) {
      where.activo = String(active).toLowerCase() === 'true';
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { nombre_usuario: 'asc' },
        select: { // Excluir el password_hash
            id_usuario: true,
            id_rol: true,
            nombre_usuario: true,
            email: true,
            nombre_completo: true,
            telefono: true,
            activo: true,
            fecha_creacion: true,
            ultimo_acceso: true,
            role: true, // Incluir la relación si es necesario
        }
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page: parseInt(page, 10), limit: take };
  }

  async findOne(id_usuario: string): Promise<Omit<PrismaUser, 'password_hash'>> {
    const user = await this.prisma.user.findUnique({
      where: { id_usuario },
      select: { // Excluir el password_hash
        id_usuario: true,
        id_rol: true,
        nombre_usuario: true,
        email: true,
        nombre_completo: true,
        telefono: true,
        activo: true,
        fecha_creacion: true,
        ultimo_acceso: true,
        role: true,
      }
    });
    if (!user) {
      throw new NotFoundException(`Usuario con ID "${id_usuario}" no encontrado.`);
    }
    return user;
  }

  async update(id_usuario: string, updateUserDto: UpdateUserDto): Promise<Omit<PrismaUser, 'password_hash'>> {
    // 1. Verificar si el usuario existe
    const existingUserById = await this.prisma.user.findUnique({
      where: { id_usuario },
    });
    if (!existingUserById) {
      throw new NotFoundException(`Usuario con ID "${id_usuario}" no encontrado para actualizar.`);
    }

    // 2. Verificar si el nuevo rol existe si se proporciona
    if (updateUserDto.id_rol) {
        const role = await this.prisma.role.findUnique({
            where: { id_rol: updateUserDto.id_rol },
        });
        if (!role) {
            throw new NotFoundException(`El rol con ID "${updateUserDto.id_rol}" no existe.`);
        }
    }

    // 3. Verificar duplicidad de nombre de usuario o email si se proporcionan
    if (updateUserDto.nombre_usuario || updateUserDto.email) {
        const existingUserByData = await this.prisma.user.findFirst({
            where: {
                AND: [
                    { id_usuario: { not: id_usuario } }, // Excluir el usuario actual
                    {
                        OR: [
                            ...(updateUserDto.nombre_usuario ? [{ nombre_usuario: updateUserDto.nombre_usuario }] : []),
                            ...(updateUserDto.email ? [{ email: updateUserDto.email }] : [])
                        ]
                    }
                ]
            }
        });

        if (existingUserByData) {
            if (updateUserDto.nombre_usuario && existingUserByData.nombre_usuario === updateUserDto.nombre_usuario) {
                throw new ConflictException(`El nombre de usuario "${updateUserDto.nombre_usuario}" ya está en uso.`);
            }
            if (updateUserDto.email && existingUserByData.email === updateUserDto.email) {
                throw new ConflictException(`El email "${updateUserDto.email}" ya está registrado.`);
            }
        }
    }

    // 4. Hashear la nueva contraseña si se proporciona
    if (updateUserDto.password) {
        updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // 5. Actualizar el usuario
    try {
        const updatedUser = await this.prisma.user.update({
            where: { id_usuario },
            data: {
                id_rol: updateUserDto.id_rol,
                nombre_usuario: updateUserDto.nombre_usuario,
                email: updateUserDto.email,
                password_hash: updateUserDto.password, // Ya hasheada si se proporcionó
                nombre_completo: updateUserDto.nombre_completo,
                telefono: updateUserDto.telefono,
                activo: updateUserDto.activo,
                // ultimo_acceso no se actualiza aquí, es manejado por el login
            },
            select: { // Excluir el password_hash de la respuesta
                id_usuario: true,
                id_rol: true,
                nombre_usuario: true,
                email: true,
                nombre_completo: true,
                telefono: true,
                activo: true,
                fecha_creacion: true,
                ultimo_acceso: true,
                role: true,
            }
        });
        return updatedUser;
    } catch (error) {
        throw new BadRequestException('No se pudo actualizar el usuario. Verifique los datos.');
    }
  }

async remove(id_usuario: string): Promise<void> {
  try {
    const existingUser = await this.prisma.user.findUnique({
      where: { id_usuario },
    });
    
    if (!existingUser) {
      throw new NotFoundException(`Usuario con ID "${id_usuario}" no encontrado para eliminar.`);
    }

    // Verificar si el usuario tiene registros asociados
    const [userSalesCount, userPurchasesCount, userMovementsCount] = await Promise.all([
      this.prisma.sale.count({ where: { id_usuario } }),
      this.prisma.purchase.count({ where: { id_usuario } }),
      this.prisma.inventoryMovement.count({ where: { id_usuario } })
    ]);

    if (userSalesCount > 0 || userPurchasesCount > 0 || userMovementsCount > 0) {
      throw new ConflictException(
        `No se puede eliminar el usuario porque tiene ${userSalesCount} ventas, ${userPurchasesCount} compras y ${userMovementsCount} movimientos de inventario asociados.`
      );
    }

    await this.prisma.user.delete({
      where: { id_usuario },
    });
    
  } catch (error) {
    if (error instanceof NotFoundException || error instanceof ConflictException) {
      throw error;
    }
    
    // Error de base de datos u otro error inesperado
    throw new BadRequestException('Error al eliminar el usuario. Por favor, intente nuevamente.');
  }
}
}