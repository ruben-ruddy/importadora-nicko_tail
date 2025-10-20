// sistemas-ventas-frontend/src/app/modules/home-main/home-main.component.ts
import { Component, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ImageService } from '../../project/services/image.service';
import { ProductCarouselItem } from '../../interfaces/product.interface';
import { RouterModule } from '@angular/router';
import { HeaderHomeMainComponent } from './header-home-main/header-home-main.component';
import { FooterHomeMainComponent } from './footer-home-main/footer-home-main.component';

@Component({
  selector: 'app-home-main',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    HeaderHomeMainComponent,
    FooterHomeMainComponent,
    RouterModule
  ],
  templateUrl: './home-main.component.html',
  styleUrl: './home-main.component.scss'
})
export class HomeMainComponent implements OnInit, OnDestroy {
  products: ProductCarouselItem[] = [];
  isDesktop: boolean = false;
  currentSlide: number = 0;
  private autoPlayInterval: any;

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
    }
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const width = window.innerWidth;
      this.isDesktop = width >= 768;
    } else {
      this.isDesktop = true;
    }

    this.imageService.getLatestProductImages().subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.products = data;
          this.startAutoPlay();
        } else {
          this.products = [];
        }
      },
      error: (e) => console.error('Error loading products:', e)
    });
  }

  nextSlide(): void {
    if (this.products.length > 0) {
      this.currentSlide = (this.currentSlide + 1) % this.products.length;
    }
  }

  prevSlide(): void {
    if (this.products.length > 0) {
      this.currentSlide = this.currentSlide === 0 ? this.products.length - 1 : this.currentSlide - 1;
    }
  }

  goToSlide(index: number): void {
    if (this.products.length > 0) {
      this.currentSlide = index;
    }
  }

  startAutoPlay(): void {
    if (isPlatformBrowser(this.platformId) && this.products.length > 1) {
      this.autoPlayInterval = setInterval(() => {
        this.nextSlide();
      }, 5000);
    }
  }

  stopAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }
}