import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselModule } from 'primeng/carousel'; // <-- Importa el módulo del carrusel


@Component({
  selector: 'app-home-main',
  standalone: true,
  imports: [CommonModule, CarouselModule], // <-- Añade CarouselModule a los imports
  templateUrl: './home-main.component.html',
  styleUrl: './home-main.component.scss' // Nota el singular
})
export class HomeMainComponent implements OnInit {

  images: string[] = []; 

  constructor() { }

  ngOnInit(): void {
    // La lógica de movimiento ya no es necesaria aquí
    this.images = [
      'https://picsum.photos/1200/600?random=1',
      'https://picsum.photos/1200/600?random=2',
      'https://picsum.photos/1200/600?random=3'

    ];
  }
}