import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselModule, Carousel } from 'primeng/carousel'; 
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ImageService } from '../../services/image.service';
import { HttpClientModule } from '@angular/common/http'; // Asegúrate de importar esto

@Component({
  selector: 'app-home-main',
  standalone: true,
  imports: [CommonModule, CarouselModule, ButtonModule, RippleModule, HttpClientModule],
  templateUrl: './home-main.component.html',
  styleUrl: './home-main.component.scss' 
})
export class HomeMainComponent implements OnInit {
  
  @ViewChild('carousel') carousel!: Carousel;

  images: string[] = []; 

  constructor(private imageService: ImageService) { }

  ngOnInit(): void {
    // Llama al servicio para obtener las imágenes del API
    this.imageService.getLatestProductImages().subscribe(data => {
      // Asume que tu API devuelve un array de URLs de imágenes
      this.images = data; 
      // Si tu API devuelve un objeto con un array dentro, usa esto:
      // this.images = data.images;
    });
  }

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