// src/app/modules/home/home-categories/home-categories.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { environment } from '../../../../environments/environment'; // Importa el entorno

// Rutas ajustadas según tu esquema y código actual
import { CategoriesService } from './home-categories.service'; // Mantenemos tu ruta actual para este servicio
import { Category } from '../../../interfaces/category.interface'; // CORRECCIÓN DE LA RUTA DEL INTERFACE

import { HeaderHomeMainComponent } from "../header-home-main/header-home-main.component";
import { FooterHomeMainComponent } from "../footer-home-main/footer-home-main.component";

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule, HeaderHomeMainComponent, FooterHomeMainComponent],
  templateUrl: './home-categories.component.html',
})
export class HomeCategoriesComponent implements OnInit {
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  searchTerm: string = '';
  isLoading: boolean = true;
  errorMessage: string | null = null;

  // --- CORRECCIÓN AQUÍ: Usar environment.backend y quitar /api ---
  backendBaseUrl: string = environment.backend.replace('/api', '');

  constructor(
    private categoriesService: CategoriesService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.isLoading = true;
    this.errorMessage = null;
    this.categoriesService.getCategories().subscribe({
      next: (data: any[]) => {
        this.categories = data.map((cat: any) => ({
          id_categoria: cat.id_categoria,
          nombre_categoria: cat.nombre_categoria,
          descripcion: cat.descripcion ?? null,
          icono_url: this.getFullImageUrl(cat.icono_url), // Prefija la URL del icono
          activo: cat.activo ?? true,
          fecha_creacion: cat.fecha_creacion ?? '',
        }));
        this.filteredCategories = [...this.categories];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.errorMessage = 'No se pudieron cargar las categorías. Inténtalo de nuevo más tarde.';
        this.isLoading = false;
      },
    });
  }

  filterCategories() {
    if (!this.searchTerm) {
      this.filteredCategories = [...this.categories];
    } else {
      this.filteredCategories = this.categories.filter((cat) =>
        cat.nombre_categoria.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  viewProductsByCategory(categoryId: string): void {
    this.router.navigate(['/products/:categoryName'], { queryParams: { categoryId: categoryId } });
  }

  getFullImageUrl(relativeUrl: string | null | undefined): string {
    if (relativeUrl && !relativeUrl.startsWith('http://') && !relativeUrl.startsWith('https://')) {
      return `${this.backendBaseUrl}${relativeUrl}`;
    }
    return relativeUrl || 'assets/placeholder-category.png';
  }
}