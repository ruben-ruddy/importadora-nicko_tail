// src/app/modules/home-main/home-main.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselModule, Carousel } from 'primeng/carousel'; 
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ImageService } from '../../services/image.service';
import { HttpClientModule } from '@angular/common/http'; 
import { ProductCarouselItem } from '../../interfaces/product.interface'; // <-- ¡Importa la interfaz!

@Component({
  selector: 'app-home-main',
  standalone: true,
  imports: [CommonModule, CarouselModule, ButtonModule, RippleModule, HttpClientModule],
  templateUrl: './home-main.component.html',
  styleUrl: './home-main.component.scss' 
})
export class HomeMainComponent implements OnInit {
  
  @ViewChild('carousel') carousel!: Carousel;

  // Cambia el tipo de images a ProductCarouselItem[]
  products: ProductCarouselItem[] = []; // Opcional: Renombrarlo a 'products' para mayor claridad

  constructor(private imageService: ImageService) { }

  ngOnInit(): void {
    console.log('HomeMainComponent: ngOnInit iniciado.');
    this.imageService.getLatestProductImages().subscribe({
      next: (data) => {
        console.log('HomeMainComponent: Datos recibidos en el subscribe:', data);
        if (Array.isArray(data) && data.length > 0) {
          this.products = data; // Asigna al nuevo array 'products'
          console.log('HomeMainComponent: Array de productos populado:', this.products);
        } else {
          console.log('HomeMainComponent: Datos no válidos o array vacío:', data);
          this.products = []; 
        }
      },
      error: (e) => console.error('HomeMainComponent: Error en el subscribe:', e),
      complete: () => console.log('HomeMainComponent: Suscripción a imágenes completada.')
    });
  }

  // ... (tus métodos nextSlide y prevSlide no cambian)
  nextSlide(): void {
    if (this.carousel) {
      this.carousel.navForward(undefined as any as MouseEvent); 
      console.log('Navegación siguiente ejecutada.');
    } else {
      console.warn('Carousel no está disponible para navegación siguiente.');
    }
  }

  prevSlide(): void {
    if (this.carousel) {
      this.carousel.navBackward(undefined as any as MouseEvent);
      console.log('Navegación anterior ejecutada.');
    } else {
      console.warn('Carousel no está disponible para navegación anterior.');
    }
  }
}