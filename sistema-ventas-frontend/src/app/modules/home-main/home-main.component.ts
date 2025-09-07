// src/app/modules/home-main/home-main.component.ts
import { Component, OnInit, ViewChild, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CarouselModule, Carousel } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { HttpClientModule } from '@angular/common/http';
import { ImageService } from '../../project/services/image.service';
import { ProductCarouselItem } from '../../interfaces/product.interface';
import { RouterModule } from '@angular/router';
import { ImageModule } from 'primeng/image';
import { HeaderHomeMainComponent } from './header-home-main/header-home-main.component';
import { FooterHomeMainComponent } from './footer-home-main/footer-home-main.component';

@Component({
  selector: 'app-home-main',
  standalone: true,
  imports: [
    CommonModule,
    CarouselModule,
    ButtonModule,
    RippleModule,
    HttpClientModule,
    HeaderHomeMainComponent,
    FooterHomeMainComponent,
    RouterModule,
    ImageModule
  ],
  templateUrl: './home-main.component.html',
  styleUrl: './home-main.component.scss'
})
export class HomeMainComponent implements OnInit, OnDestroy {
  @ViewChild('carousel') carousel!: Carousel;

  products: ProductCarouselItem[] = [];
  isDesktop: boolean = false;
  showMobileNav: boolean = false; // Control para botones móviles

  responsiveOptions = [
    {
      breakpoint: '1400px',
      numVisible: 1,
      numScroll: 1
    },
    {
      breakpoint: '1200px',
      numVisible: 1,
      numScroll: 1
    },
    {
      breakpoint: '992px',
      numVisible: 1,
      numScroll: 1
    },
    {
      breakpoint: '768px',
      numVisible: 1,
      numScroll: 1
    },
    {
      breakpoint: '576px',
      numVisible: 1,
      numScroll: 1
    }
  ];

  constructor(
    private imageService: ImageService,
    @Inject(PLATFORM_ID) private platformId: any
  ) { }

  @HostListener('window:resize', ['$event'])
  onResize() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkScreenSize();
    }
  }

  checkScreenSize() {
    if (isPlatformBrowser(this.platformId)) {
      const width = window.innerWidth;
      this.isDesktop = width >= 768;
      this.showMobileNav = width < 768; // Mostrar botones solo en móvil
    }
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const width = window.innerWidth;
      this.isDesktop = width >= 768;
      this.showMobileNav = width < 768;
    } else {
      this.isDesktop = true;
      this.showMobileNav = false;
    }

    this.imageService.getLatestProductImages().subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.products = data;
        } else {
          this.products = [];
        }
      },
      error: (e) => console.error('Error loading products:', e)
    });
  }

  nextSlide(): void {
    if (this.carousel && isPlatformBrowser(this.platformId)) {
      this.carousel.navForward({} as MouseEvent);
    }
  }

  prevSlide(): void {
    if (this.carousel && isPlatformBrowser(this.platformId)) {
      this.carousel.navBackward({} as MouseEvent);
    }
  }

  ngOnDestroy(): void {
    // Cleanup
  }
}