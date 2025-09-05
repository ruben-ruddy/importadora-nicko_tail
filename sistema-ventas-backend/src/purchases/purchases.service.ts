// src/purchases/purchases.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Asegúrate que esta ruta sea correcta
import { CreatePurchaseDto, DtoPurchaseState } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { PurchaseQueryDto } from './dto/purchase-query.dto';
import { Product } from '@prisma/client'; // Importa el tipo Product de Prisma
import { PurchaseState, MovementType  } from '@prisma/client';

// Si tus enums de Prisma son así, podrías necesitarlos para tipado estricto
// import { PurchaseState, MovementType } from '@prisma/client';

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

  async create(createPurchaseDto: CreatePurchaseDto) {
    const {
      id_usuario,
      //numero_compra,
      detalle_compras,
      observaciones,
      // Los campos total y estado serán recalculados o validados
      total,
      estado,
    } = createPurchaseDto;

    // 1. Validar existencia de usuario
    const user = await this.prisma.user.findUnique({ where: { id_usuario } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id_usuario} no encontrado.`);
    }

    // 2. Verificar que el numero_compra sea único
    // const existingPurchaseByNumber = await this.prisma.purchase.findUnique({ where: { numero_compra } });
    // if (existingPurchaseByNumber) {
    //   throw new ConflictException(`El número de compra '${numero_compra}' ya existe.`);
    // }

    // 3. Pre-procesar los detalles de la compra y calcular el subtotal
    let calculatedTotal = 0;
    const productsToUpdateStock: { product: Product; quantity: number }[] = []; // Para manejar la actualización de stock

    for (const detail of detalle_compras) {
      const product = await this.prisma.product.findUnique({
        where: { id_producto: detail.id_producto },
      });

      if (!product) {
        throw new NotFoundException(`Producto con ID ${detail.id_producto} no encontrado.`);
      }

      // Calcular subtotal del detalle y añadir al total general
      const detailCalculatedSubtotal = detail.cantidad * detail.precio_unitario;
      calculatedTotal += detailCalculatedSubtotal;

      // Asignar el subtotal calculado al detalle del DTO para usarlo en la creación
      detail.subtotal = detailCalculatedSubtotal;

      productsToUpdateStock.push({ product, quantity: detail.cantidad });
    }

    // Recalcular el total final si el cliente no lo envía o si quieres sobrescribir
    const finalTotal = total !== undefined ? total : calculatedTotal;

    // Convertir el estado del DTO (string) al tipo de enum de Prisma
    //const prismaPurchaseState = estado ? (estado.toUpperCase() as any) : DtoPurchaseState.COMPLETADA.toUpperCase() as any;

    const prismaPurchaseState = estado ? 
  (estado.toLowerCase() as PurchaseState) : PurchaseState.pendiente;

        // 3. Generar número de venta automático
  const lastPurchase = await this.prisma.purchase.findFirst({
    orderBy: { fecha_compra: 'desc' },
    select: { numero_compra: true }
  });

  let nextPurchaseNumber = 'COMP-0001';
  if (lastPurchase && lastPurchase.numero_compra) {
    const match = lastPurchase.numero_compra.match(/COMP-(\d+)/);
    if (match && match[1]) {
      const nextNum = parseInt(match[1]) + 1;
      nextPurchaseNumber = `VEN-${nextNum.toString().padStart(4, '0')}`;
    }
  }
  const existingSale = await this.prisma.purchase.findUnique({
    where: { numero_compra: nextPurchaseNumber }
  });

    // 4. Iniciar una transacción para asegurar la atomicidad (crear compra y actualizar stock)
    const result = await this.prisma.$transaction(async (prisma) => {
      // Crear la compra principal
      const purchase = await prisma.purchase.create({
        data: {
          id_usuario,
          numero_compra: nextPurchaseNumber,
          fecha_compra: new Date(), // Usa la fecha del servidor
          total: finalTotal,
          estado: prismaPurchaseState,
          observaciones,
          detalle_compras: {
            create: detalle_compras.map((detail) => ({
              id_producto: detail.id_producto,
              cantidad: detail.cantidad,
              precio_unitario: detail.precio_unitario,
              subtotal: detail.subtotal, // Usamos el subtotal que calculamos y asignamos
            })),
          },
        },
      });

      // Actualizar el stock de los productos y crear movimientos de inventario
      for (const { product, quantity } of productsToUpdateStock) {
        await prisma.product.update({
          where: { id_producto: product.id_producto },
          data: {
            stock_actual: {
              increment: quantity, // Incrementar el stock para compras
            },
          },
        });
        // Crear un movimiento de inventario de "entrada"
        await prisma.inventoryMovement.create({
            data: {
                id_producto: product.id_producto,
                id_usuario: id_usuario, // Usuario que registró la compra
                tipo_movimiento: MovementType.entrada as any, // Asegúrate que coincida con tu enum de MovementType
                cantidad: quantity,
                precio_unitario:detalle_compras.find((d: any) => d.id_producto === product.id_producto)?.precio_unitario || null,
                observaciones: `Entrada por Compra #${purchase.numero_compra} (ID: ${purchase.id_compra})`,
            }
        });
      }
      return purchase;
    });

    return result;
  }

  async findAll(query: PurchaseQueryDto) {
    const { id_usuario, numero_compra, estado, startDate, endDate, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (id_usuario) {
      where.id_usuario = id_usuario;
    }
    if (numero_compra) {
      where.numero_compra = { contains: numero_compra, mode: 'insensitive' };
    }
    if (estado) {
      where.estado = estado.toUpperCase();
    }
    if (startDate || endDate) {
      where.fecha_compra = {};
      if (startDate) {
        where.fecha_compra.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        where.fecha_compra.lt = end;
      }
    }

    const purchases = await this.prisma.purchase.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: { id_usuario: true, nombre_usuario: true, email: true }
        },
        detalle_compras: {
          include: {
            producto: true, // Asegúrate que la relación se llama 'producto' en PurchaseDetail
          },
        },
      },
      orderBy: {
        fecha_compra: 'desc',
      },
    });

    const total = await this.prisma.purchase.count({ where });

    return {
      data: purchases,
      total,
      page,
      limit,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id_compra: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id_compra },
      include: {
        user: {
          select: { id_usuario: true, nombre_usuario: true, email: true }
        },
        detalle_compras: {
          include: {
            producto: true,
          },
        },
      },
    });

    if (!purchase) {
      throw new NotFoundException(`Compra con ID ${id_compra} no encontrada.`);
    }
    return purchase;
  }

  async update(id_compra: string, updatePurchaseDto: UpdatePurchaseDto) {
    const existingPurchase = await this.prisma.purchase.findUnique({
      where: { id_compra },
      include: { detalle_compras: true }, // Incluir detalles existentes para lógica de stock
    });

    if (!existingPurchase) {
      throw new NotFoundException(`Compra con ID ${id_compra} no encontrada.`);
    }

    // Validación de 'numero_compra' si se intenta cambiar
    if (updatePurchaseDto.numero_compra && updatePurchaseDto.numero_compra !== existingPurchase.numero_compra) {
      const conflictPurchase = await this.prisma.purchase.findUnique({
        where: { numero_compra: updatePurchaseDto.numero_compra },
      });
      if (conflictPurchase) {
        throw new ConflictException(`El número de compra '${updatePurchaseDto.numero_compra}' ya está en uso.`);
      }
    }

    // === ADVERTENCIA IMPORTANTE SOBRE 'detalle_compras' ===
    // La actualización de `detalle_compras` es compleja. Implica:
    // 1. Comparar detalles existentes con los nuevos.
    // 2. Identificar eliminados, agregados, o modificados.
    // 3. Revertir/aplicar el impacto de stock para cada cambio.
    // 4. Recalcular 'total' de la compra principal.
    // 5. Esto DEBE hacerse en una transacción.

    // Por simplicidad y seguridad, se RECOMIENDA NO PERMITIR la actualización directa de `detalle_compras`
    // por este endpoint general de 'update' de compra.
    // En su lugar, implementa un endpoint de ajuste de inventario o ajuste de compra.
    if (updatePurchaseDto.detalle_compras !== undefined) {
      throw new BadRequestException('La actualización de los detalles de la compra (productos, cantidades, precios) no está permitida directamente por este método. Considere un método de ajuste de compra/inventario.');
    }

    // Prepara los datos para la actualización
    const dataToUpdate: any = { ...updatePurchaseDto };

    // Manejar el estado del enum
    if (dataToUpdate.estado) {
      dataToUpdate.estado = dataToUpdate.estado.toUpperCase(); // Asegúrate que coincide con tu enum de Prisma
    }

    // Recalcular el total si los detalles (hipotéticamente) se hubieran actualizado
    // o si permites al cliente enviarlo, pero siempre validarlo.
    // Aquí no lo estamos recalculando porque no permitimos actualizar detalles.
    // const newTotal = ...;

    try {
      const updatedPurchase = await this.prisma.purchase.update({
        where: { id_compra },
        data: dataToUpdate,
        include: {
          user: { select: { id_usuario: true, nombre_usuario: true, email: true } },
          detalle_compras: { include: { producto: true } },
        },
      });
      return updatedPurchase;
    } catch (error) {
      if (error.code === 'P2025') { // Por ejemplo, si intentas conectar a un usuario inexistente
        throw new NotFoundException('Usuario no encontrado.');
      }
      if (error.code === 'P2002' && error.meta?.target?.includes('numero_compra')) {
        throw new ConflictException(`El número de compra '${updatePurchaseDto.numero_compra}' ya está en uso.`);
      }
      throw error;
    }
  }

  async remove(id_compra: string) {
    const existingPurchase = await this.prisma.purchase.findUnique({
      where: { id_compra },
      include: { detalle_compras: true }, // Necesitamos los detalles para revertir stock
    });

    if (!existingPurchase) {
      throw new NotFoundException(`Compra con ID ${id_compra} no encontrada.`);
    }

    // === ADVERTENCIA IMPORTANTE SOBRE LA ELIMINACIÓN DE COMPRAS ===
    // La eliminación física de una compra es muy delicada en sistemas reales.
    // Se recomienda encarecidamente cambiar el 'estado' de la compra a 'cancelada'
    // en lugar de eliminarla. Esto mantiene la auditoría y evita problemas de integridad.
    // Si la eliminas, DEBES revertir el stock que esta compra añadió.

    // Iniciar transacción para revertir stock y eliminar la compra
    try {
      await this.prisma.$transaction(async (prisma) => {
        // Revertir stock para cada producto en los detalles de la compra
        for (const detail of existingPurchase.detalle_compras) {
          await prisma.product.update({
            where: { id_producto: detail.id_producto },
            data: {
              stock_actual: {
                decrement: detail.cantidad, // Decrementar el stock al eliminar una compra
              },
            },
          });
          // Crear un movimiento de inventario de "salida" por la anulación/eliminación
          await prisma.inventoryMovement.create({
              data: {
                  id_producto: detail.id_producto,
                  id_usuario: existingPurchase.id_usuario, // Usuario que hizo la compra (o un usuario de sistema para anulación)
                  tipo_movimiento: MovementType.salida as any, // Asegúrate que coincida con tu enum de MovementType
                  cantidad: detail.cantidad,
                  observaciones: `Salida por anulación/eliminación de Compra #${existingPurchase.numero_compra} (ID: ${existingPurchase.id_compra})`,
              }
          });
        }

        // Eliminar los detalles de la compra.
        // Si tu relación `onDelete: Cascade` en Prisma ya maneja esto, esta línea es redundante.
        await prisma.purchaseDetail.deleteMany({
          where: { id_compra: id_compra },
        });

        // Finalmente, eliminar la compra
        await prisma.purchase.delete({
          where: { id_compra },
        });
      });
    } catch (error) {
      if (error.code === 'P2003') { // Foreign key constraint failed (ej. si hay movimientos de inventario en cascada)
        throw new ConflictException('No se puede eliminar la compra debido a dependencias existentes.');
      }
      throw error;
    }
  }
}