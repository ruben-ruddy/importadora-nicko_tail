import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- ¡Asegúrate de que esté aquí!

@Component({
  selector: 'app-footer-home-main',
  standalone: true,
  imports: [CommonModule], // <-- ¡Asegúrate de que esté aquí!
  templateUrl: './footer-home-main.component.html',
  styleUrls: ['./footer-home-main.component.scss']
})
export class FooterHomeMainComponent implements OnInit {
  currentYear: number = new Date().getFullYear();

  constructor() { }

  ngOnInit(): void {
  }
}