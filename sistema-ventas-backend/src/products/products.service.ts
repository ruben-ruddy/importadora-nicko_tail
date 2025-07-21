// src/products/products.service.ts
import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Product as PrismaProduct } from '@prisma/client'; // Alias para el tipo Product de Prisma

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto): Promise<PrismaProduct> {
    // 1. Verificar si la categoría existe
    const category = await this.prisma.category.findUnique({
      where: { id_categoria: createProductDto.id_categoria },
    });

    if (!category) {
      throw new NotFoundException(`La categoría con ID "${createProductDto.id_categoria}" no existe.`);
    }

    // 2. Verificar si ya existe un producto con el mismo nombre o codigo_producto
    const existingProduct = await this.prisma.product.findFirst({
        where: {
            OR: [
                { nombre_producto: createProductDto.nombre_producto },
                ...(createProductDto.codigo_producto ? [{ codigo_producto: createProductDto.codigo_producto }] : []) // <-- CAMBIADO DE 'sku' A 'codigo_producto'
            ]
        }
    });

    if (existingProduct) {
        if (existingProduct.nombre_producto === createProductDto.nombre_producto) {
            throw new ConflictException(`El producto con nombre "${createProductDto.nombre_producto}" ya existe.`);
        }
        if (createProductDto.codigo_producto && existingProduct.codigo_producto === createProductDto.codigo_producto) { // <-- CAMBIADO DE 'sku' A 'codigo_producto'
            throw new ConflictException(`El producto con código "${createProductDto.codigo_producto}" ya existe.`);
        }
    }

    // 3. Crear el producto
    return this.prisma.product.create({
      data: {
        id_categoria: createProductDto.id_categoria,
        nombre_producto: createProductDto.nombre_producto,
        codigo_producto: createProductDto.codigo_producto || '', // <-- Usa codigo_producto
        descripcion: createProductDto.descripcion,
        precio_venta: createProductDto.precio_venta, // <-- Mapeado de 'precio' a 'precio_venta'
        precio_compra: createProductDto.precio_compra,
        stock_actual: createProductDto.stock_actual,   // <-- Mapeado de 'stock' a 'stock_actual'
        imagen_url: createProductDto.imagen_url,
        activo: createProductDto.activo,
      },
    });
  }

  async findAll(query: ProductQueryDto): Promise<{ products: PrismaProduct[]; total: number; page: number; limit: number }> {
    const { search, categoryId, active, page = '1', limit = '10' } = query;

    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const where: any = {};

    if (search) {
      where.OR = [
        { nombre_producto: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
        { codigo_producto: { contains: search, mode: 'insensitive' } }, // <-- CAMBIADO DE 'sku' A 'codigo_producto'
      ];
    }

    if (categoryId) {
      where.id_categoria = categoryId;
    }

    if (active !== undefined) {
      where.activo = String(active).toLowerCase() === 'true';
    }

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        skip,
        take,
        orderBy: { nombre_producto: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, total, page: parseInt(page, 10), limit: take };
  }

  async findOne(id_producto: string): Promise<PrismaProduct> {
    const product = await this.prisma.product.findUnique({
      where: { id_producto },
      include: { category: true },
    });
    if (!product) {
      throw new NotFoundException(`Producto con ID "${id_producto}" no encontrado.`);
    }
    return product;
  }

  async update(id_producto: string, updateProductDto: UpdateProductDto): Promise<PrismaProduct> {
    // 1. Verificar si la categoría existe si se está actualizando
    if (updateProductDto.id_categoria) {
        const category = await this.prisma.category.findUnique({
            where: { id_categoria: updateProductDto.id_categoria },
        });
        if (!category) {
            throw new NotFoundException(`La categoría con ID "${updateProductDto.id_categoria}" no existe.`);
        }
    }

    // 2. Verificar duplicidad de nombre o codigo_producto si se están actualizando
    if (updateProductDto.nombre_producto || updateProductDto.codigo_producto) { // <-- CAMBIADO DE 'sku' A 'codigo_producto'
        const existingProduct = await this.prisma.product.findFirst({
            where: {
                AND: [
                    { id_producto: { not: id_producto } }, // Excluye el producto actual
                    {
                        OR: [
                            ...(updateProductDto.nombre_producto ? [{ nombre_producto: updateProductDto.nombre_producto }] : []),
                            ...(updateProductDto.codigo_producto ? [{ codigo_producto: updateProductDto.codigo_producto }] : []) // <-- CAMBIADO DE 'sku' A 'codigo_producto'
                        ]
                    } ]
                }
            });

            if (existingProduct) {
                if (updateProductDto.nombre_producto && existingProduct.nombre_producto === updateProductDto.nombre_producto) {
                    throw new ConflictException(`El producto con nombre "${updateProductDto.nombre_producto}" ya existe.`);
                }
                if (updateProductDto.codigo_producto && existingProduct.codigo_producto === updateProductDto.codigo_producto) { // <-- CAMBIADO DE 'sku' A 'codigo_producto'
                    throw new ConflictException(`El producto con código "${updateProductDto.codigo_producto}" ya existe.`);
                }
            }
        }

    // Mapear los campos del DTO a los del modelo de Prisma
    const dataToUpdate: any = {};
    if (updateProductDto.id_categoria !== undefined) dataToUpdate.id_categoria = updateProductDto.id_categoria;
    if (updateProductDto.nombre_producto !== undefined) dataToUpdate.nombre_producto = updateProductDto.nombre_producto;
    if (updateProductDto.codigo_producto !== undefined) {
        dataToUpdate.codigo_producto = updateProductDto.codigo_producto || ''; // Mantiene si codigo_producto es requerido
    }
    if (updateProductDto.descripcion !== undefined) dataToUpdate.descripcion = updateProductDto.descripcion;
    if (updateProductDto.precio_venta !== undefined) dataToUpdate.precio_venta = updateProductDto.precio_venta; // <-- Mapeado
    if (updateProductDto.precio_compra !== undefined) dataToUpdate.precio_compra = updateProductDto.precio_compra; // <-- ¡NUEVO CAMPO!
    if (updateProductDto.stock_actual !== undefined) dataToUpdate.stock_actual = updateProductDto.stock_actual;   // <-- Mapeado
    if (updateProductDto.imagen_url !== undefined) dataToUpdate.imagen_url = updateProductDto.imagen_url;
    if (updateProductDto.activo !== undefined) dataToUpdate.activo = updateProductDto.activo;


    // 3. Actualizar el producto
    const product = await this.prisma.product.update({
      where: { id_producto },
      data: dataToUpdate, // Usar el objeto mapeado
    });

    if (!product) {
        throw new NotFoundException(`Producto con ID "${id_producto}" no encontrado para actualizar.`);
    }
    return product;
  }

  async remove(id_producto: string): Promise<PrismaProduct> {
    const product = await this.prisma.product.delete({
      where: { id_producto },
    });
    if (!product) {
        throw new NotFoundException(`Producto con ID "${id_producto}" no encontrado para eliminar.`);
    }
    return product;
  }
  // Método para obtener las últimas imágenes de productos
  async findLatestProductImages(): Promise<string[]> {
    const latestProducts = await this.prisma.product.findMany({
      orderBy: {
        fecha_creacion: 'desc', // Ordena por la fecha de creación descendente (los más nuevos primero)
      },
      take: 10, // Limita a los últimos 10
      select: {
        imagen_url: true, // Selecciona solo el campo imagen_url
      },
      where: {
        activo: true, // Opcional: solo productos activos
        NOT: { // Opcional: asegura que la imagen_url no sea nula
            imagen_url: null,
        }
      }
    });
    // Mapea los resultados para devolver solo un array de URLs
    return latestProducts.map(product => product.imagen_url).filter(url => url !== null) as string[];
  }

}