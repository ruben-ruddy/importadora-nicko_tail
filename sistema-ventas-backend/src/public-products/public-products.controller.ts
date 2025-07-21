// src/public-products/public-products.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ProductsService } from '../products/products.service'; // Importa el ProductsService original

@Controller('public/products') // <--- NUEVA RUTA BASE: /api/public/products
export class PublicProductsController {
  constructor(private readonly productsService: ProductsService) {} // Inyecta el ProductsService

  @Get('latest-images') // Esto creará la ruta /api/public/products/latest-images
  async getLatestImages(): Promise<string[]> {
    return this.productsService.findLatestProductImages();
  }
}