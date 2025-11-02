// src/sales/sales.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; 
import { CreateSaleDto, DtoSaleState, CreateSaleDetailDto } from './dto/create-sale.dto'; 
import { UpdateSaleDto } from './dto/update-sale.dto';
import { SaleQueryDto } from './dto/sale-query.dto';
import { Product, SaleState, MovementType } from '@prisma/client'; 

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  // Crear una nueva venta
  async create(createSaleDto: CreateSaleDto) {
    const {
      id_usuario,
      id_cliente,
      detalle_ventas,
      observaciones,
      subtotal, 
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
    const productsToUpdate: { product: Product; quantity: number }[] = []; 

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

    const finalSubtotal = subtotal !== undefined ? subtotal : calculatedSubtotal;
    const finalDescuento = descuento !== undefined ? descuento : 0; 
    const finalImpuesto = impuesto !== undefined ? impuesto : 0; 
    const finalTotal = total !== undefined ? total : (finalSubtotal - finalDescuento + finalImpuesto);
    const finalEstado = estado;
    // 5. Iniciar una transacción para asegurar la atomicidad
    const result = await this.prisma.$transaction(async (prisma) => {
      // Crear la venta principal
      const sale = await prisma.sale.create({
        data: {
          id_usuario,
          id_cliente, // Puede ser null
          numero_venta: nextSaleNumber, // Usar el número de venta generado
          fecha_venta: new Date(),
          subtotal: finalSubtotal, 
          descuento: finalDescuento, 
          impuesto: finalImpuesto, 
          total: finalTotal, 
          estado: finalEstado,
          observaciones,
          detalle_ventas: {
            create: detalle_ventas.map((detail) => ({
              id_producto: detail.id_producto,
              cantidad: detail.cantidad,
              precio_unitario: detail.precio_unitario,
              subtotal: (detail.cantidad * detail.precio_unitario) - (detail.descuento_item || 0),
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
                id_usuario: id_usuario,
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
// Obtener todas las ventas con filtros y paginación
async findAll(query: SaleQueryDto) {
  const { 
    id_cliente, 
    id_usuario, 
    numero_venta, 
    estado, 
    startDate, 
    endDate, 
    search,
    page = 1, 
    limit = 10 
  } = query;
  const skip = (page - 1) * limit;

  const where: any = {};
  
  // Búsqueda general
  if (search) {
    where.OR = [
      { numero_venta: { contains: search, mode: 'insensitive' } },
      {
        client: {
          nombre_completo: { contains: search, mode: 'insensitive' }
        }
      },
      {
        user: {
          OR: [
            { nombre_usuario: { contains: search, mode: 'insensitive' } },
            { nombre_completo: { contains: search, mode: 'insensitive' } }
          ]
        }
      }
    ];
  } else {
    // Filtros específicos si no hay búsqueda general
    if (id_cliente) {
      where.id_cliente = id_cliente;
    }
    if (id_usuario) {
      where.id_usuario = id_usuario;
    }
    if (numero_venta) {
      where.numero_venta = { contains: numero_venta, mode: 'insensitive' };
    }
    if (estado) {
      where.estado = estado;
    }
  }
  
  if (startDate || endDate) {
    where.fecha_venta = {};
    if (startDate) {
      where.fecha_venta.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      where.fecha_venta.lt = end;
    }
  }

  const [sales, total] = await Promise.all([
    this.prisma.sale.findMany({
      where,
      skip,
      take: limit,
      include: {
        client: true,
        user: {
          select: { id_usuario: true, nombre_usuario: true, email: true, nombre_completo: true }
        },
        detalle_ventas: {
          include: {
            producto: true,
          },
        },
      },
      orderBy: {
        fecha_venta: 'desc',
      },
    }),
    this.prisma.sale.count({ where })
  ]);

  return {
    data: sales,
    total,
    page,
    limit,
    lastPage: Math.ceil(total / limit),
  };
}

// Obtener una venta por id
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
            producto: true, 
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
    include: { detalle_ventas: true }, 
  });

  if (!existingSale) {
    throw new NotFoundException(`Venta con ID ${id_venta} no encontrada.`);
  }

    // Si se quiere cancelar una venta, manejar la reversión de stock
  if (updateSaleDto.estado === 'cancelada' && existingSale.estado !== 'cancelada') {
    return await this.cancelSale(existingSale);
  }

  // Si se quiere reactivar una venta cancelada
  if (updateSaleDto.estado !== 'cancelada' && existingSale.estado === 'cancelada') {
    return await this.activateSale(existingSale, updateSaleDto);
  }

  // Para otras actualizaciones, permitir solo ciertos campos
  const allowedFields = ['id_cliente', 'estado', 'observaciones', 'descuento', 'impuesto'];
  const hasDisallowedFields = Object.keys(updateSaleDto).some(key => 
    !allowedFields.includes(key) && updateSaleDto[key] !== undefined
  );

  if (hasDisallowedFields) {
    throw new BadRequestException('Solo se permiten actualizar los campos: id_cliente, estado, observaciones, descuento e impuesto.');
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

  if (hasDisallowedFields) {
    throw new BadRequestException('Solo se permiten actualizar los campos: id_cliente, estado, observaciones, descuento e impuesto.');
  }

  // Prepara los datos para la actualización
  const dataToUpdate: any = {};

  // Solo incluir campos permitidos
  allowedFields.forEach(field => {
    if (updateSaleDto[field] !== undefined) {
      dataToUpdate[field] = updateSaleDto[field];
    }
  });

  // Manejar el estado del enum
  if (dataToUpdate.estado) {
    dataToUpdate.estado = dataToUpdate.estado.toUpperCase();
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
    if (error.code === 'P2025') { 
      throw new NotFoundException('Uno de los IDs relacionados (usuario, cliente) no fue encontrado.');
    }
    if (error.code === 'P2002' && error.meta?.target?.includes('numero_venta')) {
      throw new ConflictException(`El número de venta '${updateSaleDto.numero_venta}' ya está en uso.`);
    }
    throw error;
  }
}

// Eliminar una venta
  async remove(id_venta: string) {
    const existingSale = await this.prisma.sale.findUnique({
      where: { id_venta },
      include: { detalle_ventas: true },
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
                increment: detail.cantidad, 
              },
            },
          });

          await prisma.inventoryMovement.create({
              data: {
                  id_producto: detail.id_producto,
                  id_usuario: existingSale.id_usuario,
                  tipo_movimiento: MovementType.entrada, 
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
      if (error.code === 'P2003') { 
        throw new ConflictException('No se puede eliminar la venta debido a dependencias existentes.');
      }
      throw error;
    }
  }


// Funciones privadas para manejar cancelación y reactivación de ventas
  private async cancelSale(sale: any) {

  return await this.prisma.$transaction(async (prisma) => {

    for (const detail of sale.detalle_ventas) {
      await prisma.product.update({
        where: { id_producto: detail.id_producto },
        data: {
          stock_actual: {
            increment: detail.cantidad,
          },
        },
      });
      
      // Crear movimiento de inventario de entrada por cancelación
      await prisma.inventoryMovement.create({
        data: {
          id_producto: detail.id_producto,
          id_usuario: sale.id_usuario,
          tipo_movimiento: MovementType.entrada,
          cantidad: detail.cantidad,
          observaciones: `Entrada por cancelación de Venta #${sale.numero_venta}`,
        }
      });
    }

    // Actualizar estado de la venta
    return await prisma.sale.update({
      where: { id_venta: sale.id_venta },
      data: {
        estado: 'cancelada',
      },
      include: {
        client: true,
        user: { select: { id_usuario: true, nombre_usuario: true, email: true } },
        detalle_ventas: { include: { producto: true } },
      },
    });
  });
}

// Re-activar una venta cancelada
private async activateSale(sale: any, updateSaleDto: any) {
  // Verificar stock antes de reactivar
  for (const detail of sale.detalle_ventas) {
    const product = await this.prisma.product.findUnique({
      where: { id_producto: detail.id_producto },
    });
    
    if (product && product.stock_actual < detail.cantidad) {
      throw new BadRequestException(`No hay suficiente stock para reactivar la venta. Producto: ${product.nombre_producto}, Stock actual: ${product.stock_actual}, Necesario: ${detail.cantidad}`);
    }
  }

  // Reactivar venta y descontar stock
  return await this.prisma.$transaction(async (prisma) => {
    // Descontar stock para cada producto
    for (const detail of sale.detalle_ventas) {
      await prisma.product.update({
        where: { id_producto: detail.id_producto },
        data: {
          stock_actual: {
            decrement: detail.cantidad,
          },
        },
      });
      
      // Crear movimiento de inventario de salida por reactivación
      await prisma.inventoryMovement.create({
        data: {
          id_producto: detail.id_producto,
          id_usuario: sale.id_usuario,
          tipo_movimiento: MovementType.salida,
          cantidad: detail.cantidad,
          observaciones: `Salida por reactivación de Venta #${sale.numero_venta}`,
        }
      });
    }

    // Preparar datos para actualización
    const dataToUpdate: any = {
      estado: updateSaleDto.estado,
    };

    // Incluir otros campos permitidos si están presentes
    const allowedFields = ['id_cliente', 'observaciones', 'descuento', 'impuesto'];
    allowedFields.forEach(field => {
      if (updateSaleDto[field] !== undefined) {
        dataToUpdate[field] = updateSaleDto[field];
      }
    });

    // Actualizar la venta
    return await prisma.sale.update({
      where: { id_venta: sale.id_venta },
      data: dataToUpdate,
      include: {
        client: true,
        user: { select: { id_usuario: true, nombre_usuario: true, email: true } },
        detalle_ventas: { include: { producto: true } },
      },
    });
  });
}
  
}