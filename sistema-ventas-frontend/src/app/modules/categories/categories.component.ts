// sistema-ventas-frontend/src/app/modules/categories/categories.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { CategoriesService } from './categories.service';
import { GeneralService } from '../../core/gerneral.service';
import { ModalCategoryComponent } from './modal-category/modal-category.component';
import { ModalService } from '../../project/services/modal.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss'
})
export class CategoriesComponent implements OnInit {
  category: any[] = []; // Cambiar a array para mejor manejo
  
  private categoriesService = inject(CategoriesService);
  private generalService = inject(GeneralService);
  private modalService = inject(ModalService);

  ngOnInit(): void {
    this.generalService.show();
    this.loadCategory();
  }

  async loadCategory() {
    try {
      const categories = await this.categoriesService.getCategory();
      // Asegurarse de que sea un array
      this.category = Array.isArray(categories) ? categories : [categories];
      console.log('CategoriesComponent - Categories loaded:', this.category);
    } catch (error) {
      console.error('CategoriesComponent - Error loading categories:', error);
      this.category = [];
    } finally {
      this.generalService.hide();
    }
  }

  openAddProductModal() {
    console.log('CategoriesComponent - Opening add category modal');
    
    setTimeout(() => {
      this.modalService.open(ModalCategoryComponent, {
        title: 'Nueva categoría',
        width: '800px'
      }).then(result => {
        console.log('CategoriesComponent - Add modal closed with result:', result);
        if (result) {
          // Recargar categorías después de agregar
          this.loadCategory();
        }
      });
    }, 100);
  }

  openEditProductModal(product: any) {
    console.log('CategoriesComponent - Opening edit category modal for:', product);
    
    setTimeout(() => {
      this.modalService.open(ModalCategoryComponent, {
        title: 'Actualizar Categoría',
        width: '800px',
        data: { data: product }
      }).then(result => {
        console.log('CategoriesComponent - Edit modal closed with result:', result);
        if (result) {
          // Recargar categorías después de editar
          this.loadCategory();
        }
      });
    }, 100);
  }

  // Método para verificar si una categoría está activa
  isCategoryActive(category: any): boolean {
    return category.activo === true || category.activo === 'true';
  }
}