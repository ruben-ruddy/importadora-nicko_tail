// sistema-ventas-frontend/src/app/modules/home-main/quienes-somos/quienes-somos.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterHomeMainComponent } from "../footer-home-main/footer-home-main.component";
import { HeaderHomeMainComponent } from "../header-home-main/header-home-main.component";

@Component({
  selector: 'app-quienes-somos',
  standalone: true,
  imports: [CommonModule, FooterHomeMainComponent, HeaderHomeMainComponent],
  templateUrl: './quienes-somos.component.html',
  styleUrls: ['./quienes-somos.component.scss']
})
export class QuienesSomosComponent {

}