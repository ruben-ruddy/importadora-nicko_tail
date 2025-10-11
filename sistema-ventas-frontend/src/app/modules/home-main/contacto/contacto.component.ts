// src/app/home-main/contacto/contacto.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderHomeMainComponent } from '../header-home-main/header-home-main.component'; 
import { FooterHomeMainComponent } from '../footer-home-main/footer-home-main.component'; 


@Component({
  selector: 'app-contacto',
  standalone: true,

  imports: [
    CommonModule, 
    HeaderHomeMainComponent, 
    FooterHomeMainComponent, 
  ],
  templateUrl: './contacto.component.html',
  styleUrl: './contacto.component.scss' 
})
export class ContactoComponent {

}