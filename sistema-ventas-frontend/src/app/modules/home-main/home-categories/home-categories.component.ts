// src/app/modules/home/home-categories/home-categories.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

import { CategoriesService } from './home-categories.service';
import { Category } from '../../../interfaces/category.interface'; // Asegúrate de que esta ruta sea correcta

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
          icono_url: this.getFullImageUrl(cat.icono_url),
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

  // --- CORRECCIÓN AQUÍ: Navegar con parámetros de ruta ---
  viewProductsByCategory(categoryId: string, categoryName: string): void {
    // Para una URL amigable, limpia el nombre de la categoría (ej. "Equipo Táctico" -> "Equipo-Tactico")
    const cleanedCategoryName = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    this.router.navigate(['/products', cleanedCategoryName, categoryId]); // <--- ¡CAMBIO AQUÍ!
  }

  getFullImageUrl(relativeUrl: string | null | undefined): string {
    if (relativeUrl && !relativeUrl.startsWith('http://') && !relativeUrl.startsWith('https://')) {
      return `${this.backendBaseUrl}${relativeUrl}`;
    }
    return relativeUrl || 'assets/placeholder-category.png';
  }
}