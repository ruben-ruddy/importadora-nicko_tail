// src/products/products.service.ts
import { ConflictException, Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Product as PrismaProduct } from '@prisma/client';
import { LatestProductImageDto } from './dto/latest-product-image.dto';

@Injectable()
export class ProductsService {
  // Define la URL base de tu backend aquí
  // Es CRUCIAL que esta URL coincida con la URL donde tu backend está sirviendo los archivos estáticos.
  private readonly baseUrl: string = 'http://localhost:3000'; // <--- ¡AÑADE ESTA LÍNEA!

  constructor(private prisma: PrismaService) {}

  // --- Métodos CRUD Existentes ---
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
    if (updateProductDto.imagen_url !== undefined) dataToUpdate.imagen_url = updateProductDto.imagen_url;
    if (updateProductDto.activo !== undefined) dataToUpdate.activo = updateProductDto.activo;

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

  // --- Métodos para el Frontend Público (Home y Carrusel) ---

  // Método existente para el carrusel (lo modificamos ligeramente)
  async findLatestProductImages(): Promise<LatestProductImageDto[]> {
    try {
      const latestProducts = await this.prisma.product.findMany({
        orderBy: {
          fecha_creacion: 'desc',
        },
        take: 10, // Puedes ajustar la cantidad que quieras para el carrusel
        select: {
          imagen_url: true,
          nombre_producto: true,
          descripcion: true,
        },
        where: {
          activo: true,
          NOT: {
            imagen_url: null, // Solo productos con imagen
          },
        },
      });

      // Mapea los resultados para asegurar el formato del DTO.
      // Aquí devolvemos la URL relativa como viene de la DB ('/uploads/...')
      return latestProducts.map(product => ({
        imagen_url: product.imagen_url as string, // Ya filtramos por NOT null
        nombre_producto: product.nombre_producto,
        descripcion: product.descripcion || 'Sin descripción.',
      }));
    } catch (error) {
      console.error('Error in ProductsService.findLatestProductImages:', error);
      throw new InternalServerErrorException('Error al obtener las últimas imágenes de productos para el carrusel.');
    }
  }

  // NUEVO Método para obtener TODOS los productos públicos (para la página principal de productos)
  async findAllPublicProducts(): Promise<any[]> {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          activo: true, // Solo productos que estén marcados como activos
        },
        include: {
          category: {
            select: {
              nombre_categoria: true,
            },
          },
        },
      });

      // Mapear los productos para añadir la URL completa de la imagen
      return products.map(product => {
        let imageUrl: string | null = null;
        if (product.imagen_url) {
          // Construye la URL ABSOLUTA utilizando la baseUrl del servicio
          imageUrl = `${this.baseUrl}${product.imagen_url}`;
          console.log(`Backend Product ${product.nombre_producto}: imageUrl = ${imageUrl}`); 
        }

        return {
          id: product.id_producto, // Mapea el ID de Prisma a un nombre más genérico
          name: product.nombre_producto,
          category: product.category?.nombre_categoria || 'Sin categoría', // Acceso seguro a la categoría
          price: parseFloat(product.precio_venta.toString()), // Convertir Decimal a número flotante
          stock: product.stock_actual,
          description: product.descripcion,
          imageUrl: imageUrl, // Esta es la URL completa que el frontend necesita
          // Puedes añadir más campos del producto si son necesarios en la UI principal
        };
      });
    } catch (error) {
      console.error('Error in ProductsService.findAllPublicProducts:', error);
      throw new InternalServerErrorException('Error al obtener todos los productos públicos.');
    }
  }

  // NUEVO Método para obtener un producto público por ID (para el pop-up modal si hace su propia llamada)
  async findPublicProductById(id_producto: string): Promise<any> {
    try {
      const product = await this.prisma.product.findUnique({
        where: {
          id_producto: id_producto,
          activo: true, // Asegúrate de que el producto esté activo
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
        // Construye la URL ABSOLUTA para la imagen del producto detallado
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
        // Puedes añadir aquí otros campos del producto que sean relevantes para el pop-up/detalle
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error; // Propaga la excepción NotFoundException
      }
      console.error(`Error in ProductsService.findPublicProductById for ID ${id_producto}:`, error);
      throw new InternalServerErrorException('Error al obtener el producto público por ID.');
    }
  }
}