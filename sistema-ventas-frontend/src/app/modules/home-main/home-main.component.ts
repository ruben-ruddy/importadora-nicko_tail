import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselModule, Carousel } from 'primeng/carousel'; 
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-home-main',
  standalone: true,
  imports: [CommonModule, CarouselModule, ButtonModule, RippleModule],
  templateUrl: './home-main.component.html',
  styleUrl: './home-main.component.scss' 
})
export class HomeMainComponent implements OnInit {
  
  @ViewChild('carousel') carousel!: Carousel;
  images: string[] = []; 
  ngOnInit(): void {
    this.images = [
      'https://picsum.photos/1200/600?random=1',
      'https://picsum.photos/1200/600?random=2',
      'https://picsum.photos/1200/600?random=3',
      'https://picsum.photos/1200/600?random=4',
      'https://picsum.photos/1200/600?random=5',
      'https://picsum.photos/1200/600?random=6'
    ];
  }

  // Métodos para navegar el carrusel con los nombres correctos
  nextSlide(): void {
    if (this.carousel) {
      this.carousel.navForward(undefined as any as MouseEvent);
    }
  }

  prevSlide(): void {
    if (this.carousel) {
      this.carousel.navBackward(undefined as any as MouseEvent);
    }
  }
}