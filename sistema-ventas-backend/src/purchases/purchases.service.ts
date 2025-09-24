import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto, DtoPurchaseState } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { PurchaseQueryDto } from './dto/purchase-query.dto';
import { Product } from '@prisma/client';
import { PurchaseState, MovementType } from '@prisma/client';

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

  async create(createPurchaseDto: CreatePurchaseDto) {
    const {
      id_usuario,
      detalle_compras,
      observaciones,
      total,
      estado,
    } = createPurchaseDto;

    // 1. Validar existencia de usuario
    const user = await this.prisma.user.findUnique({ where: { id_usuario } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id_usuario} no encontrado.`);
    }

    // 2. Pre-procesar los detalles de la compra y calcular el subtotal
    let calculatedTotal = 0;
    const productsToUpdateStock: { product: Product; quantity: number }[] = [];

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

      // Asignar el subtotal calculado al detalle del DTO
      detail.subtotal = detailCalculatedSubtotal;

      productsToUpdateStock.push({ product, quantity: detail.cantidad });
    }

    // Recalcular el total final
    const finalTotal = total !== undefined ? total : calculatedTotal;

    const prismaPurchaseState = estado ? 
      (estado.toLowerCase() as PurchaseState) : PurchaseState.pendiente;

    // 3. Generar número de compra automático
    const lastPurchase = await this.prisma.purchase.findFirst({
      orderBy: { fecha_compra: 'desc' },
      select: { numero_compra: true }
    });

    let nextPurchaseNumber = 'COMP-0001';
    if (lastPurchase && lastPurchase.numero_compra) {
      const match = lastPurchase.numero_compra.match(/COMP-(\d+)/);
      if (match && match[1]) {
        const nextNum = parseInt(match[1]) + 1;
        nextPurchaseNumber = `COMP-${nextNum.toString().padStart(4, '0')}`;
      }
    }

    // 4. Iniciar transacción
    const result = await this.prisma.$transaction(async (prisma) => {
      // Crear la compra principal
      const purchase = await prisma.purchase.create({
        data: {
          id_usuario,
          numero_compra: nextPurchaseNumber,
          fecha_compra: new Date(),
          total: finalTotal,
          estado: prismaPurchaseState,
          observaciones,
          detalle_compras: {
            create: detalle_compras.map((detail) => ({
              id_producto: detail.id_producto,
              cantidad: detail.cantidad,
              precio_unitario: detail.precio_unitario,
              subtotal: detail.subtotal,
            })),
          },
        },
      });

      // Actualizar stock y crear movimientos de inventario
      for (const { product, quantity } of productsToUpdateStock) {
        await prisma.product.update({
          where: { id_producto: product.id_producto },
          data: {
            stock_actual: {
              increment: quantity,
            },
          },
        });

        await prisma.inventoryMovement.create({
          data: {
            id_producto: product.id_producto,
            id_usuario: id_usuario,
            tipo_movimiento: MovementType.entrada,
            cantidad: quantity,
            precio_unitario: detalle_compras.find((d: any) => d.id_producto === product.id_producto)?.precio_unitario || null,
            observaciones: `Entrada por Compra #${purchase.numero_compra} (ID: ${purchase.id_compra})`,
          }
        });
      }
      return purchase;
    });

    return result;
  }

async findAll(query: PurchaseQueryDto) {
  const { id_usuario, numero_compra, estado, startDate, endDate } = query;
  
  // Convierte los strings de la consulta a números de forma segura
  const page = query.page ? parseInt(query.page, 10) : 1;
  const limit = query.limit ? parseInt(query.limit, 10) : 10;
  const skip = (page - 1) * limit;

  const where: any = {};
  
  if (id_usuario) {
    where.id_usuario = id_usuario;
  }
  if (numero_compra) {
    where.numero_compra = { contains: numero_compra, mode: 'insensitive' };
  }
  if (estado) {
    where.estado = estado.toLowerCase();
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

  const [purchases, total] = await Promise.all([
    this.prisma.purchase.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: { 
            id_usuario: true, 
            nombre_usuario: true, 
            email: true,
            nombre_completo: true 
          }
        },
        detalle_compras: {
          include: {
            producto: {
              select: {
                id_producto: true,
                nombre_producto: true,
                precio_compra: true,
                precio_venta: true,
                descripcion: true
              }
            },
          },
        },
      },
      orderBy: {
        fecha_compra: 'desc',
      },
    }),
    this.prisma.purchase.count({ where })
  ]);

  return {
    data: purchases,
    total,
    page: page,
    limit: limit,
    lastPage: Math.ceil(total / limit),
  };
}

  async findOne(id_compra: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id_compra },
      include: {
        user: {
          select: { 
            id_usuario: true, 
            nombre_usuario: true, 
            email: true,
            nombre_completo: true 
          }
        },
        detalle_compras: {
          include: {
            producto: {
              select: {
                id_producto: true,
                nombre_producto: true,
                precio_compra: true,
                precio_venta: true,
                descripcion: true
              }
            },
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
      include: { detalle_compras: true },
    });

    if (!existingPurchase) {
      throw new NotFoundException(`Compra con ID ${id_compra} no encontrada.`);
    }

    // Validar que la compra no esté completada o cancelada para editar
    if (existingPurchase.estado === PurchaseState.completada || existingPurchase.estado === PurchaseState.cancelada) {
      throw new BadRequestException('No se puede editar una compra que ya está completada o cancelada.');
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

    // Campos permitidos para edición
    const allowedFields = ['observaciones', 'estado', 'numero_compra'];
    const dataToUpdate: any = {};

    // Filtrar solo los campos permitidos
    allowedFields.forEach(field => {
      if (updatePurchaseDto[field] !== undefined) {
        dataToUpdate[field] = updatePurchaseDto[field];
      }
    });

    // Convertir estado a formato Prisma si está presente
    if (dataToUpdate.estado) {
      dataToUpdate.estado = dataToUpdate.estado.toLowerCase();
    }

    try {
      const updatedPurchase = await this.prisma.purchase.update({
        where: { id_compra },
        data: dataToUpdate,
        include: {
          user: { 
            select: { 
              id_usuario: true, 
              nombre_usuario: true, 
              email: true,
              nombre_completo: true 
            } 
          },
          detalle_compras: { 
            include: { 
              producto: {
                select: {
                  id_producto: true,
                  nombre_producto: true,
                  precio_compra: true,
                  precio_venta: true,
                  descripcion: true
                }
              } 
            } 
          },
        },
      });
      return updatedPurchase;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Recurso no encontrado.');
      }
      if (error.code === 'P2002' && error.meta?.target?.includes('numero_compra')) {
        throw new ConflictException(`El número de compra ya está en uso.`);
      }
      throw error;
    }
  }

  async remove(id_compra: string) {
    const existingPurchase = await this.prisma.purchase.findUnique({
      where: { id_compra },
      include: { detalle_compras: true },
    });

    if (!existingPurchase) {
      throw new NotFoundException(`Compra con ID ${id_compra} no encontrada.`);
    }

    try {
      await this.prisma.$transaction(async (prisma) => {
        // Revertir stock para cada producto
        for (const detail of existingPurchase.detalle_compras) {
          await prisma.product.update({
            where: { id_producto: detail.id_producto },
            data: {
              stock_actual: {
                decrement: detail.cantidad,
              },
            },
          });

          await prisma.inventoryMovement.create({
            data: {
              id_producto: detail.id_producto,
              id_usuario: existingPurchase.id_usuario,
              tipo_movimiento: MovementType.salida,
              cantidad: detail.cantidad,
              observaciones: `Salida por anulación/eliminación de Compra #${existingPurchase.numero_compra} (ID: ${existingPurchase.id_compra})`,
            }
          });
        }

        // Eliminar los detalles de la compra
        await prisma.purchaseDetail.deleteMany({
          where: { id_compra: id_compra },
        });

        // Eliminar la compra
        await prisma.purchase.delete({
          where: { id_compra },
        });
      });
    } catch (error) {
      if (error.code === 'P2003') {
        throw new ConflictException('No se puede eliminar la compra debido a dependencias existentes.');
      }
      throw error;
    }
  }
}