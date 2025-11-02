// src/inventory-movements/inventory-movements.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryMovementDto, DtoMovementType } from './dto/create-inventory-movement.dto'; 
import { UpdateInventoryMovementDto } from './dto/update-inventory-movement.dto';
import { InventoryMovementQueryDto } from './dto/inventory-movement-query.dto'; 

@Injectable()
export class InventoryMovementsService {
  constructor(private prisma: PrismaService) {}

  async create(createInventoryMovementDto: CreateInventoryMovementDto) {
    const { id_producto, id_usuario, tipo_movimiento, cantidad, precio_unitario, referencia, observaciones, fecha_movimiento } = createInventoryMovementDto;

    // 1. Verificar si el producto existe
    const product = await this.prisma.product.findUnique({
      where: { id_producto: id_producto }, 
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id_producto} no encontrado.`);
    }

    // 2. Verificar si el usuario existe
    const user = await this.prisma.user.findUnique({
      where: { id_usuario: id_usuario }, 
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id_usuario} no encontrado.`);
    }

    // 3. Actualizar el stock del producto
    let newStock = product.stock_actual;
    // Convierte el DtoMovementType a MovementType de Prisma si son diferentes
    // Si tu enum en Prisma es ENTRADA/SALIDA (mayúsculas)
    const prismaMovementType = tipo_movimiento.toUpperCase(); // Para convertir 'entrada' a 'ENTRADA'

    if (prismaMovementType === DtoMovementType.ENTRADA.toUpperCase()) {
      newStock += cantidad;
    } else if (prismaMovementType === DtoMovementType.SALIDA.toUpperCase()) {
      if (newStock < cantidad) {
        throw new BadRequestException('No hay suficiente stock para esta salida.');
      }
      newStock -= cantidad;
    } else {
      // Esto no debería pasar si @IsEnum está validando, pero es un fallback
      throw new BadRequestException('Tipo de movimiento inválido. Debe ser "entrada" o "salida".');
    }

    await this.prisma.product.update({
      where: { id_producto: id_producto }, // Usa id_producto
      data: { stock_actual: newStock },
    });

    // 4. Crear el registro del movimiento
    const movement = await this.prisma.inventoryMovement.create({
      data: {
        id_producto: id_producto,
        id_usuario: id_usuario,
        tipo_movimiento: prismaMovementType as any, // Asegúrate de que el tipo coincida con el enum de Prisma
        cantidad: cantidad,
        precio_unitario: precio_unitario,
        referencia: referencia,
        observaciones: observaciones,
        fecha_movimiento: fecha_movimiento || new Date(), // Usa la fecha si se proporciona, sino now()
        // No necesitas 'connect' si ya tienes los IDs en data
      },
    });

    return movement;
  }

  async findAll(query: InventoryMovementQueryDto) {
    const { id_producto, id_usuario, tipo_movimiento, startDate, endDate, page = 1, limit = 10 } = query; // Usa id_producto, id_usuario
    const skip = (page - 1) * limit;

    const where: any = {};
    if (tipo_movimiento) {
      where.tipo_movimiento = tipo_movimiento.toUpperCase(); // Asegúrate de que coincida con el enum de Prisma
    }
    if (id_producto) {
      where.id_producto = id_producto; // Usa id_producto
    }
    if (id_usuario) {
      where.id_usuario = id_usuario; // Usa id_usuario
    }
    if (startDate || endDate) {
      where.fecha_movimiento = {}; // Usa fecha_movimiento
      if (startDate) {
        where.fecha_movimiento.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        where.fecha_movimiento.lt = end;
      }
    }

    const movements = await this.prisma.inventoryMovement.findMany({
      where,
      skip,
      take: limit,
      include: {
        product: true, // Incluye la información del producto
        user: {
          select: { id_usuario: true, nombre_usuario: true, email: true } // Selecciona solo lo necesario del usuario
        }
      },
      orderBy: {
        fecha_movimiento: 'desc', // Usa fecha_movimiento
      },
    });

    const total = await this.prisma.inventoryMovement.count({ where });

    return {
      data: movements,
      total,
      page,
      limit,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id_movimiento: string) { // Usa id_movimiento
    const movement = await this.prisma.inventoryMovement.findUnique({
      where: { id_movimiento: id_movimiento }, // Usa id_movimiento
      include: {
        product: true,
        user: {
          select: { id_usuario: true, nombre_usuario: true, email: true }
        }
      },
    });

    if (!movement) {
      throw new NotFoundException(`Movimiento de inventario con ID ${id_movimiento} no encontrado.`);
    }
    return movement;
  }

  async update(id_movimiento: string, updateInventoryMovementDto: UpdateInventoryMovementDto) { // Usa id_movimiento
    const existingMovement = await this.prisma.inventoryMovement.findUnique({
      where: { id_movimiento: id_movimiento }, // Usa id_movimiento
    });

    if (!existingMovement) {
      throw new NotFoundException(`Movimiento de inventario con ID ${id_movimiento} no encontrado.`);
    }
    if (updateInventoryMovementDto.cantidad !== undefined || updateInventoryMovementDto.tipo_movimiento !== undefined) {
      throw new BadRequestException('No se permite actualizar directamente la cantidad o el tipo de un movimiento de inventario. Considere crear un nuevo movimiento de ajuste.');
    }

    const dataToUpdate: any = { ...updateInventoryMovementDto };
    if (dataToUpdate.tipo_movimiento) {
      dataToUpdate.tipo_movimiento = dataToUpdate.tipo_movimiento.toUpperCase();
    }
    try {
      const updatedMovement = await this.prisma.inventoryMovement.update({
        where: { id_movimiento: id_movimiento }, // Usa id_movimiento
        data: dataToUpdate,
      });
      return updatedMovement;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Uno de los IDs relacionados (producto, usuario) no fue encontrado.');
      }
      throw error;
    }
  }

  async remove(id_movimiento: string) { // Usa id_movimiento
    const existingMovement = await this.prisma.inventoryMovement.findUnique({
      where: { id_movimiento: id_movimiento }, // Usa id_movimiento
    });

    if (!existingMovement) {
      throw new NotFoundException(`Movimiento de inventario con ID ${id_movimiento} no encontrado.`);
    }
    const product = await this.prisma.product.findUnique({
      where: { id_producto: existingMovement.id_producto }, // Usa id_producto
    });

    if (product) {
      let newStock = product.stock_actual;
      // Convertir el tipo de movimiento existente si es necesario
      const existingMovementType = existingMovement.tipo_movimiento.toString().toUpperCase(); // Para manejar si es un enum de Prisma

      if (existingMovementType === DtoMovementType.ENTRADA.toUpperCase()) {
        newStock -= existingMovement.cantidad; // Usa cantidad
      } else if (existingMovementType === DtoMovementType.SALIDA.toUpperCase()) {
        newStock += existingMovement.cantidad; // Usa cantidad
      }

      await this.prisma.product.update({
        where: { id_producto: product.id_producto }, // Usa id_producto
        data: { stock_actual: newStock },
      });
    }

    try {
      await this.prisma.inventoryMovement.delete({
        where: { id_movimiento: id_movimiento }, // Usa id_movimiento
      });
    } catch (error) {
      if (error.code === 'P2003') {
        throw new ConflictException('No se puede eliminar el movimiento de inventario debido a dependencias existentes.');
      }
      throw error;
    }
  }
}