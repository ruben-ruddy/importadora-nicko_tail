import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { PrimeIcons } from 'primeng/api';
import { FooterHomeMainComponent } from "../footer-home-main/footer-home-main.component";
import { HeaderHomeMainComponent } from "../header-home-main/header-home-main.component";

@Component({
  selector: 'app-quienes-somos',
  standalone: true,
  imports: [CommonModule, ButtonModule, FooterHomeMainComponent, HeaderHomeMainComponent],
  templateUrl: './quienes-somos.component.html',
  styleUrls: ['./quienes-somos.component.scss']
})
export class QuienesSomosComponent {}
