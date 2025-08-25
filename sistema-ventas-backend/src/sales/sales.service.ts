// src/sales/sales.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Asegúrate que esta ruta sea correcta
import { CreateSaleDto, DtoSaleState, CreateSaleDetailDto } from './dto/create-sale.dto'; // Importa ambos
import { UpdateSaleDto } from './dto/update-sale.dto';
import { SaleQueryDto } from './dto/sale-query.dto';
import { Product, SaleState, MovementType } from '@prisma/client'; // Ya lo estás importando, genial.


// Si tus enums de Prisma son así, podrías necesitarlos para tipado estricto
// import { SaleState, MovementType } from '@prisma/client';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async create(createSaleDto: CreateSaleDto) {
    const {
      id_usuario,
      id_cliente,
      //numero_venta,
      detalle_ventas,
      observaciones,
      subtotal, // asumiendo que el cliente puede enviarlos, pero los recalculamos
      descuento,
      impuesto,
      total,
      estado,
    } = createSaleDto;

    // 1. Validar existencia de usuario
    const user = await this.prisma.user.findUnique({ where: { id_usuario } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id_usuario} no encontrado.`);
    }

    // 2. Validar existencia de cliente (si se proporciona)
    if (id_cliente) {
      const client = await this.prisma.client.findUnique({ where: { id_cliente } });
      if (!client) {
        throw new NotFoundException(`Cliente con ID ${id_cliente} no encontrado.`);
      }
    }

    // 3. Generar número de venta automático
  const lastSale = await this.prisma.sale.findFirst({
    orderBy: { fecha_venta: 'desc' },
    select: { numero_venta: true }
  });

  let nextSaleNumber = 'VEN-0001';
  if (lastSale && lastSale.numero_venta) {
    const match = lastSale.numero_venta.match(/VEN-(\d+)/);
    if (match && match[1]) {
      const nextNum = parseInt(match[1]) + 1;
      nextSaleNumber = `VEN-${nextNum.toString().padStart(4, '0')}`;
    }
  }




    // 4. Verificar que el numero_venta generado sea único
  const existingSale = await this.prisma.sale.findUnique({
    where: { numero_venta: nextSaleNumber }
  });

    // 4. Pre-procesar los detalles de la venta y verificar stock
    let calculatedSubtotal = 0;
    const productsToUpdate: { product: Product; quantity: number }[] = []; // Usando 'Product' importado

    for (const detail of detalle_ventas) {
      const product = await this.prisma.product.findUnique({
        where: { id_producto: detail.id_producto },
      });

      if (!product) {
        throw new NotFoundException(`Producto con ID ${detail.id_producto} no encontrado.`);
      }
      if (product.stock_actual < detail.cantidad) {
        throw new BadRequestException(`Stock insuficiente para el producto '${product.nombre_producto}'. Stock actual: ${product.stock_actual}, solicitado: ${detail.cantidad}`);
      }

      // Calcular subtotal del detalle y añadir al total general
      const detailTotal = (detail.cantidad * detail.precio_unitario) - (detail.descuento_item || 0);
      calculatedSubtotal += detailTotal;

      productsToUpdate.push({ product, quantity: detail.cantidad });
    }

    // === MOVER ESTAS DECLARACIONES AQUÍ, FUERA DEL BUCLE PERO ANTES DE LA TRANSACCIÓN ===
    // Recalcular totales (opcional, pero recomendado para evitar manipulación del cliente)
    const finalSubtotal = subtotal !== undefined ? subtotal : calculatedSubtotal;
    const finalDescuento = descuento !== undefined ? descuento : 0; // Podrías tener lógica para calcular un descuento global
    const finalImpuesto = impuesto !== undefined ? impuesto : 0; // Podrías tener lógica para calcular un impuesto
    const finalTotal = total !== undefined ? total : (finalSubtotal - finalDescuento + finalImpuesto);

    // Convertir el estado del DTO (string) al tipo de enum de Prisma (si es diferente)
    //const prismaSaleState = estado ? (estado.toUpperCase() as any) : DtoSaleState.PENDIENTE.toUpperCase() as any;
    const finalEstado = estado;
    // ====================================================================================


    // 5. Iniciar una transacción para asegurar la atomicidad
    const result = await this.prisma.$transaction(async (prisma) => {
      // Crear la venta principal
      const sale = await prisma.sale.create({
        data: {
          id_usuario,
          id_cliente, // Puede ser null
          numero_venta: nextSaleNumber, // Usar el número de venta generado
          fecha_venta: new Date(), // Siempre usa la fecha del servidor, o createSaleDto.fecha_venta si la mandan
          subtotal: finalSubtotal, // Ahora sí están definidos
          descuento: finalDescuento, // Ahora sí están definidos
          impuesto: finalImpuesto, // Ahora sí están definidos
          total: finalTotal, // Ahora sí están definidos
          estado: finalEstado, // Ahora sí están definidos
          observaciones,
          detalle_ventas: {
            create: detalle_ventas.map((detail) => ({
              id_producto: detail.id_producto,
              cantidad: detail.cantidad,
              precio_unitario: detail.precio_unitario,
              subtotal: (detail.cantidad * detail.precio_unitario) - (detail.descuento_item || 0),
              // Aquí no hay 'descuento_item' en tu esquema de SaleDetail.
              // Si lo necesitas, deberías añadirlo a SaleDetail en schema.prisma.
              // descuento_item: detail.descuento_item || 0, // Esto iría si el campo existiera
            })),
          },
        },
      });

      // Actualizar el stock de los productos y crear movimientos de inventario
      for (const { product, quantity } of productsToUpdate) {
        await prisma.product.update({
          where: { id_producto: product.id_producto },
          data: {
            stock_actual: product.stock_actual - quantity,
          },
        });
        // Crear un movimiento de inventario de "salida"
        await prisma.inventoryMovement.create({
            data: {
                id_producto: product.id_producto,
                id_usuario: id_usuario, // Usuario que hizo la venta
                tipo_movimiento: MovementType.salida,
                cantidad: quantity,
                observaciones: `Salida por Venta #${sale.numero_venta} (ID: ${sale.id_venta})`,
            }
        });
      }
      return sale;
    });

    return result;
  }

  // ... (el resto de tus métodos findAll, findOne, update, remove) ...
  async findAll(query: SaleQueryDto) {
    const { id_cliente, id_usuario, numero_venta, estado, startDate, endDate, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (id_cliente) {
      where.id_cliente = id_cliente;
    }
    if (id_usuario) {
      where.id_usuario = id_usuario;
    }
    if (numero_venta) {
      where.numero_venta = { contains: numero_venta, mode: 'insensitive' }; // Búsqueda parcial insensible a mayúsculas/minúsculas
    }
    if (estado) {
      where.estado = estado.toUpperCase(); // Coincide con el enum de Prisma
    }
    if (startDate || endDate) {
      where.fecha_venta = {};
      if (startDate) {
        where.fecha_venta.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1); // Incluir todo el día final
        where.fecha_venta.lt = end;
      }
    }

    const sales = await this.prisma.sale.findMany({
      where,
      skip,
      take: limit,
      include: {
        client: true, // Incluye la información del cliente
        user: {
          select: { id_usuario: true, nombre_usuario: true, email: true } // Selecciona solo lo necesario del usuario
        },
        detalle_ventas: {
          include: {
            producto: true, // Asegúrate que la relación se llama 'producto' en SaleDetail
          },
        },
      },
      orderBy: {
        fecha_venta: 'desc',
      },
    });

    const total = await this.prisma.sale.count({ where });

    return {
      data: sales,
      total,
      page,
      limit,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id_venta: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id_venta }, // Usa id_venta como el campo ID único
      include: {
        client: true,
        user: {
          select: { id_usuario: true, nombre_usuario: true, email: true }
        },
        detalle_ventas: {
          include: {
            producto: true, // Asegúrate que la relación se llama 'producto' en SaleDetail
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Venta con ID ${id_venta} no encontrada.`);
    }
    return sale;
  }

  async update(id_venta: string, updateSaleDto: UpdateSaleDto) {
    const existingSale = await this.prisma.sale.findUnique({
      where: { id_venta },
      include: { detalle_ventas: true }, // Incluir detalles existentes para futuras lógicas
    });

    if (!existingSale) {
      throw new NotFoundException(`Venta con ID ${id_venta} no encontrada.`);
    }

    // Validación de 'numero_venta' si se intenta cambiar
    if (updateSaleDto.numero_venta && updateSaleDto.numero_venta !== existingSale.numero_venta) {
      const conflictSale = await this.prisma.sale.findUnique({
        where: { numero_venta: updateSaleDto.numero_venta },
      });
      if (conflictSale) {
        throw new ConflictException(`El número de venta '${updateSaleDto.numero_venta}' ya está en uso.`);
      }
    }

    if (updateSaleDto.detalle_ventas !== undefined) {
      throw new BadRequestException('La actualización de los detalles de la venta (productos, cantidades, precios) no está permitida directamente por este método. Considere un método de devolución o ajuste de stock.');
    }

    // Prepara los datos para la actualización
    const dataToUpdate: any = { ...updateSaleDto };

    // Manejar el estado del enum
    if (dataToUpdate.estado) {
      dataToUpdate.estado = dataToUpdate.estado.toUpperCase(); // Asegúrate que coincide con tu enum de Prisma
    }

    // Manejar id_cliente si se envía explícitamente como null para desconectar
    if (updateSaleDto.id_cliente === null) {
        dataToUpdate.id_cliente = null;
    }


    try {
      const updatedSale = await this.prisma.sale.update({
        where: { id_venta },
        data: dataToUpdate,
        include: {
          client: true,
          user: { select: { id_usuario: true, nombre_usuario: true, email: true } },
          detalle_ventas: { include: { producto: true } },
        },
      });
      return updatedSale;
    } catch (error) {
      if (error.code === 'P2025') { // Por ejemplo, si intentas conectar a un usuario/cliente inexistente
        throw new NotFoundException('Uno de los IDs relacionados (usuario, cliente) no fue encontrado.');
      }
      if (error.code === 'P2002' && error.meta?.target?.includes('numero_venta')) {
        throw new ConflictException(`El número de venta '${updateSaleDto.numero_venta}' ya está en uso.`);
      }
      throw error;
    }
  }

  async remove(id_venta: string) {
    const existingSale = await this.prisma.sale.findUnique({
      where: { id_venta },
      include: { detalle_ventas: true }, // Necesitamos los detalles para revertir stock
    });

    if (!existingSale) {
      throw new NotFoundException(`Venta con ID ${id_venta} no encontrada.`);
    }

    try {
      await this.prisma.$transaction(async (prisma) => {
        // Revertir stock para cada producto en los detalles de la venta
        for (const detail of existingSale.detalle_ventas) {
          await prisma.product.update({
            where: { id_producto: detail.id_producto },
            data: {
              stock_actual: {
                increment: detail.cantidad, // Sumar la cantidad al stock
              },
            },
          });
          // Crear un movimiento de inventario de "entrada" por la anulación/eliminación
          await prisma.inventoryMovement.create({
              data: {
                  id_producto: detail.id_producto,
                  id_usuario: existingSale.id_usuario, // Usuario que hizo la venta (o un usuario de sistema para la anulación)
                  tipo_movimiento: MovementType.entrada, // Asegúrate que coincida con tu enum de MovementType
                  cantidad: detail.cantidad,
                  observaciones: `Entrada por anulación/eliminación de Venta #${existingSale.numero_venta} (ID: ${existingSale.id_venta})`,
              }
          });
        }

        // Eliminar los detalles de la venta.
        await prisma.saleDetail.deleteMany({
          where: { id_venta: id_venta },
        });

        // Finalmente, eliminar la venta
        await prisma.sale.delete({
          where: { id_venta },
        });
      });
    } catch (error) {
      if (error.code === 'P2003') { // Foreign key constraint failed
        throw new ConflictException('No se puede eliminar la venta debido a dependencias existentes.');
      }
      throw error;
    }
  }
  
}