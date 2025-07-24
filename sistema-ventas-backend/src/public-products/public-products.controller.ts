// src/public-products/public-products.controller.ts
import { Controller, Get, Param, Res, HttpStatus } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { LatestProductImageDto } from '../products/dto/latest-product-image.dto';
// No necesitas importar Response de 'express' si usas @Res({ passthrough: true })

@Controller('public/products')
export class PublicProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('latest-images')
  async getLatestImages(): Promise<LatestProductImageDto[]> {
    // NestJS automáticamente establece el status 200 OK y serializa el retorno a JSON
    return this.productsService.findLatestProductImages();
  }

  // NUEVO Endpoint para la ventana de productos principal
  @Get('all')
  async getAllProducts(
      @Res({ passthrough: true }) res // <--- ¡CAMBIO AQUÍ!
  ) {
    try {
      const products = await this.productsService.findAllPublicProducts();
      res.status(HttpStatus.OK); // <--- Solo establece el status
      return products; // <--- NestJS serializa 'products' a JSON
    } catch (error) {
      // Puedes usar excepciones de NestJS que NestJS maneja automáticamente
      // o establecer el status y devolver un objeto de error
      res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR);
      return { message: error.message || 'Error al obtener todos los productos.' };
    }
  }

  // NUEVO Endpoint para el pop-up modal (si hace una llamada separada por ID)
  @Get(':id')
  async getProductById(
      @Param('id') id: string,
      @Res({ passthrough: true }) res // <--- ¡CAMBIO AQUÍ!
  ) {
    try {
      const product = await this.productsService.findPublicProductById(id);
      res.status(HttpStatus.OK); // <--- Solo establece el status
      return product; // <--- NestJS serializa 'product' a JSON
    } catch (error) {
      res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR);
      return { message: error.message || 'Error al obtener el producto por ID.' };
    }
  }
}