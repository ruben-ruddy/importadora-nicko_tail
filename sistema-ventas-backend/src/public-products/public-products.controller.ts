// src/public-products/public-products.controller.ts
import { Controller, Get, Param, Res, HttpStatus, Query } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { LatestProductImageDto } from '../products/dto/latest-product-image.dto';
import { ProductQueryDto } from '../products/dto/product-query.dto';

@Controller('public/products')
export class PublicProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('latest-images')
  async getLatestImages(): Promise<LatestProductImageDto[]> {
    return this.productsService.findLatestProductImages();
  }

  // Este endpoint ahora manejará:
  // - GET /api/public/products (todos los productos públicos)
  // - GET /api/public/products?categoryId=xxx (productos públicos filtrados por categoría)
  @Get()
  async getPublicProducts(
    @Res({ passthrough: true }) res,
    @Query('categoryId') categoryId?: string // <--- ¡AQUÍ ESTÁ EL CAMBIO CRUCIAL!
  ) {
    try {
      const products = await this.productsService.findAllPublicProducts(categoryId); // <--- Llama con el ID
      res.status(HttpStatus.OK);
      return products;
    } catch (error) {
      res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR);
      return { message: error.message || 'Error al obtener productos públicos.' };
    }
  }

  // El endpoint 'all' ahora es opcional. Si lo mantienes, puede seguir usando el mismo método.
  @Get('all')
  async getAllProducts(
      @Res({ passthrough: true }) res
  ) {
    try {
      const products = await this.productsService.findAllPublicProducts(); // Llama sin categoryId para obtener todos
      res.status(HttpStatus.OK);
      return products;
    } catch (error) {
      res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR);
      return { message: error.message || 'Error al obtener todos los productos.' };
    }
  }

  // Endpoint para el pop-up modal (getProductById) - sin cambios.
  @Get(':id')
  async getProductById(
      @Param('id') id: string,
      @Res({ passthrough: true }) res
  ) {
    try {
      const product = await this.productsService.findPublicProductById(id);
      res.status(HttpStatus.OK);
      return product;
    } catch (error) {
      res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR);
      return { message: error.message || 'Error al obtener el producto por ID.' };
    }
  }
}