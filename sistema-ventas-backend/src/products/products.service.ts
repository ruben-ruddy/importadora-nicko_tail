// src/products/products.service.ts
import { ConflictException, Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Product as PrismaProduct } from '@prisma/client';
import { LatestProductImageDto } from './dto/latest-product-image.dto';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProductsService {

  private readonly baseUrl: string;

  constructor(private prisma: PrismaService,
    private configService: ConfigService
  ) {
    this.baseUrl = this.configService.get('BASE_URL') || 'http://localhost:3000';
  }

// crear producto
  async create(createProductDto: CreateProductDto): Promise<PrismaProduct> {
    const category = await this.prisma.category.findUnique({
      where: { id_categoria: createProductDto.id_categoria },
    });

    if (!category) {
      throw new NotFoundException(`La categoría con ID "${createProductDto.id_categoria}" no existe.`);
    }

    const existingProduct = await this.prisma.product.findFirst({
      where: {
        OR: [
          { nombre_producto: createProductDto.nombre_producto },
          ...(createProductDto.codigo_producto ? [{ codigo_producto: createProductDto.codigo_producto }] : [])
        ]
      }
    });

    if (existingProduct) {
      if (existingProduct.nombre_producto === createProductDto.nombre_producto) {
        throw new ConflictException(`El producto con nombre "${createProductDto.nombre_producto}" ya existe.`);
      }
      if (createProductDto.codigo_producto && existingProduct.codigo_producto === createProductDto.codigo_producto) {
        throw new ConflictException(`El producto con código "${createProductDto.codigo_producto}" ya existe.`);
      }
    }

    return this.prisma.product.create({
      data: {
        id_categoria: createProductDto.id_categoria,
        nombre_producto: createProductDto.nombre_producto,
        codigo_producto: createProductDto.codigo_producto || '',
        descripcion: createProductDto.descripcion,
        precio_venta: createProductDto.precio_venta,
        precio_compra: createProductDto.precio_compra,
        stock_actual: createProductDto.stock_actual,
        imagen_url: createProductDto.imagen_url,
        activo: createProductDto.activo,
      },
    });
  }
// obtener todos los productos con paginación y filtros
  async findAll(query: ProductQueryDto): Promise<{ products: PrismaProduct[]; total: number; page: number; limit: number }> {
    const { search, categoryId, active, page = '1', limit = '10' } = query;

    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const where: any = {};

    if (search) {
      where.OR = [
        { nombre_producto: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
        { codigo_producto: { contains: search, mode: 'insensitive' } },
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
  if (updateProductDto.id_categoria) {
    const category = await this.prisma.category.findUnique({
      where: { id_categoria: updateProductDto.id_categoria },
    });
    if (!category) {
      throw new NotFoundException(`La categoría con ID "${updateProductDto.id_categoria}" no existe.`);
    }
  }

  if (updateProductDto.nombre_producto || updateProductDto.codigo_producto) {
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        AND: [
          { id_producto: { not: id_producto } },
          {
            OR: [
              ...(updateProductDto.nombre_producto ? [{ nombre_producto: updateProductDto.nombre_producto }] : []),
              ...(updateProductDto.codigo_producto ? [{ codigo_producto: updateProductDto.codigo_producto }] : [])
            ]
          }
        ]
      }
    });

    if (existingProduct) {
      if (updateProductDto.nombre_producto && existingProduct.nombre_producto === updateProductDto.nombre_producto) {
        throw new ConflictException(`El producto con nombre "${updateProductDto.nombre_producto}" ya existe.`);
      }
      if (updateProductDto.codigo_producto && existingProduct.codigo_producto === updateProductDto.codigo_producto) {
        throw new ConflictException(`El producto con código "${updateProductDto.codigo_producto}" ya existe.`);
      }
    }
  }

  const dataToUpdate: any = {};
  if (updateProductDto.id_categoria !== undefined) dataToUpdate.id_categoria = updateProductDto.id_categoria;
  if (updateProductDto.nombre_producto !== undefined) dataToUpdate.nombre_producto = updateProductDto.nombre_producto;
  if (updateProductDto.codigo_producto !== undefined) {
    dataToUpdate.codigo_producto = updateProductDto.codigo_producto || '';
  }
  if (updateProductDto.descripcion !== undefined) dataToUpdate.descripcion = updateProductDto.descripcion;
  if (updateProductDto.precio_venta !== undefined) dataToUpdate.precio_venta = updateProductDto.precio_venta;
  if (updateProductDto.precio_compra !== undefined) dataToUpdate.precio_compra = updateProductDto.precio_compra;
  if (updateProductDto.stock_actual !== undefined) dataToUpdate.stock_actual = updateProductDto.stock_actual;
  if (updateProductDto.stock_minimo !== undefined) dataToUpdate.stock_minimo = updateProductDto.stock_minimo; // Añadido stock_minimo
  if (updateProductDto.imagen_url !== undefined) dataToUpdate.imagen_url = updateProductDto.imagen_url;
  if (updateProductDto.activo !== undefined) dataToUpdate.activo = updateProductDto.activo; // Añadido activo

  const product = await this.prisma.product.update({
    where: { id_producto },
    data: dataToUpdate,
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

  // Obtener las últimas imágenes de productos para el carrusel
  async findLatestProductImages(): Promise<LatestProductImageDto[]> {
    try {
      const latestProducts = await this.prisma.product.findMany({
        orderBy: {
          fecha_creacion: 'desc',
        },
        take: 10, 
        select: {
          imagen_url: true,
          nombre_producto: true,
          descripcion: true,
        },
        where: {
          activo: true,
          NOT: {
            imagen_url: null, 
          },
        },
      });


      return latestProducts.map(product => ({
        imagen_url: product.imagen_url as string,
        nombre_producto: product.nombre_producto,
        descripcion: product.descripcion || 'Sin descripción.',
      }));
    } catch (error) {
      console.error('Error in ProductsService.findLatestProductImages:', error);
      throw new InternalServerErrorException('Error al obtener las últimas imágenes de productos para el carrusel.');
    }
  }

  // Método unificado para obtener productos públicos (todos o filtrados por categoría)
  async findAllPublicProducts(categoryId?: string): Promise<any[]> { 
    try {
      const where: any = {
        activo: true, 
      };

      if (categoryId) {
        where.id_categoria = categoryId; 
      }

      const products = await this.prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              nombre_categoria: true,
            },
          },
        },
        orderBy: {
          fecha_creacion: 'desc', 
        }
      });

      
      return products.map(product => {
        let imageUrl: string | null = null;
        if (product.imagen_url) {
          imageUrl = `${this.baseUrl}${product.imagen_url}`;
        }

    
        return {
          
          category: product.category?.nombre_categoria || 'Sin categoría', 
          imagen_url: imageUrl,
          nombre_producto: product.nombre_producto, 
          descripcion: product.descripcion, 
          price: parseFloat(product.precio_venta.toString()),
        };
      });
    } catch (error) {
      console.error('Error in ProductsService.findAllPublicProducts:', error);
      throw new InternalServerErrorException('Error al obtener productos públicos.');
    }
  }
// Obtener un producto público por su ID
  async findPublicProductById(id_producto: string): Promise<any> {
    try {
      const product = await this.prisma.product.findUnique({
        where: {
          id_producto: id_producto,
          activo: true, 
        },
        include: {
          category: {
            select: {
              nombre_categoria: true,
            },
          },
        },
      });

      if (!product) {
        throw new NotFoundException(`Producto con ID "${id_producto}" no encontrado o no está activo.`);
      }

      let imageUrl: string | null = null;
      if (product.imagen_url) {
        
        imageUrl = `${this.baseUrl}${product.imagen_url}`;
      }

      return {
        id: product.id_producto,
        name: product.nombre_producto,
        category: product.category?.nombre_categoria || 'Sin categoría',
        price: parseFloat(product.precio_venta.toString()),
        stock: product.stock_actual,
        description: product.descripcion,
        imageUrl: imageUrl,
        
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error; 
      }
      console.error(`Error in ProductsService.findPublicProductById for ID ${id_producto}:`, error);
      throw new InternalServerErrorException('Error al obtener el producto público por ID.');
    }
  }
}