// src/public-products/public-products.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { LatestProductImageDto } from '../products/dto/latest-product-image.dto'; // <-- ¡AÑADE ESTA LÍNEA!

@Controller('public/products')
export class PublicProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('latest-images')
  // Cambia el tipo de retorno aquí para usar LatestProductImageDto
  async getLatestImages(): Promise<LatestProductImageDto[]> {
    return this.productsService.findLatestProductImages();
  }
}