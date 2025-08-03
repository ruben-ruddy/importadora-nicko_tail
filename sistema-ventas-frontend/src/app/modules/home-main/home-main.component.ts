// src/app/modules/home-main/home-main.component.ts

import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselModule, Carousel } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { HttpClientModule } from '@angular/common/http';
import { ImageService } from '../../project/services/image.service';
import { ProductCarouselItem } from '../../interfaces/product.interface';
import { RouterModule } from '@angular/router'; // ¡Importante!
import { ImageModule } from 'primeng/image';

// ¡ASEGÚRATE DE QUE ESTAS IMPORTACIONES ESTÉN PRESENTES!
import { HeaderHomeMainComponent } from './header-home-main/header-home-main.component';
import { FooterHomeMainComponent } from './footer-home-main/footer-home-main.component'; // <--- ¡Esta línea es crucial!

@Component({
  selector: 'app-home-main',
  standalone: true,
  imports: [
    CommonModule,
    CarouselModule,
    ButtonModule,
    RippleModule,
    HttpClientModule,
    HeaderHomeMainComponent, // Asegúrate de que este también esté
    FooterHomeMainComponent, // <--- ¡DEBE ESTAR AQUÍ!
    RouterModule,
    ImageModule // Asegúrate de que ImageModule esté importado si usas imágenes
  ],
  templateUrl: './home-main.component.html',
  styleUrl: './home-main.component.scss'
})
export class HomeMainComponent implements OnInit, OnDestroy {
  @ViewChild('carousel') carousel!: Carousel;

  products: ProductCarouselItem[] = [];
  // Opciones responsivas para el carousel
  responsiveOptions = [
    {
      breakpoint: '1199px',
      numVisible: 1,
      numScroll: 1
    },
    {
      breakpoint: '991px',
      numVisible: 1,
      numScroll: 1
    },
    {
      breakpoint: '767px',
      numVisible: 1,
      numScroll: 1
    }
  ];

  constructor(
    private imageService: ImageService
  ) { }

  ngOnInit(): void {
    console.log('HomeMainComponent: ngOnInit iniciado.');

    this.imageService.getLatestProductImages().subscribe({
      next: (data) => {
        console.log('HomeMainComponent: Datos recibidos en el subscribe:', data);
        if (Array.isArray(data) && data.length > 0) {
          this.products = data;
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

  nextSlide(): void {
    if (this.carousel) {
      this.carousel.navForward({} as MouseEvent);
      console.log('Navegación siguiente ejecutada.');
    } else {
      console.warn('Carousel no está disponible para navegación siguiente.');
    }
  }

  prevSlide(): void {
    if (this.carousel) {
      this.carousel.navBackward({} as MouseEvent);
      console.log('Navegación anterior ejecutada.');
    } else {
      console.warn('Carousel no está disponible para navegación anterior.');
    }
  }

  ngOnDestroy(): void {
    // Si HomeMainComponent tiene sus propias suscripciones que no son del header, gestionarlas aquí.
  }
}