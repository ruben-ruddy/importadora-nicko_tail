// sistema-ventas-frontend/src/app/modules/product/product.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalProductComponent } from './modal-product/modal-product.component';
import { ProductService } from './product.service';
import { GeneralService } from '../../core/gerneral.service';
import { ModalService } from '../../project/services/modal.service';
import { ToasterService } from '../../project/services/toaster.service';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product.component.html',
  styleUrl: './product.component.scss'
})
export class ProductComponent {
  products: any;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  activeFilter: string = 'all';
  Math = Math;
  hasLowStockProducts: boolean = false;
  lowStockCount: number = 0;

  constructor(
    private productService: ProductService,
    private modalService: ModalService,
    private generalService: GeneralService,
    private toaster: ToasterService
  ) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  async loadProducts() {
    try {
      const queryParams: any = {
        page: this.currentPage.toString(),
        limit: this.itemsPerPage.toString()
      };

      if (this.activeFilter !== 'all') {
        queryParams.active = this.activeFilter === 'active' ? 'true' : 'false';
      }

      this.products = await this.productService.getProducts(queryParams);
      console.log('Productos cargados:', this.products);
      
      // Verificar stock bajo después de cargar productos
      this.checkLowStock();
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }

  // Verificar productos con stock bajo
  checkLowStock() {
    if (!this.products?.products) return;
    
    this.lowStockCount = 0;
    let showAlert = false;
    
    this.products.products.forEach((product: any) => {
      if (this.shouldShowStockAlert(product)) {
        this.lowStockCount++;
        showAlert = true;
        
        // Mostrar toast para productos críticos
        if (product.stock_actual <= product.stock_minimo) {
          this.showStockAlertToast(product);
        }
      }
    });
    
    this.hasLowStockProducts = showAlert;
  }

  // Mostrar alerta toast para stock crítico
  showStockAlertToast(product: any) {
    this.toaster.showToast({
      severity: 'warning',
      summary: 'Stock Crítico',
      detail: `${product.nombre_producto} ha alcanzado el stock mínimo (${product.stock_actual}/${product.stock_minimo})`,
      life: 5000
    });
  }

  // Determinar si mostrar alerta de stock
  shouldShowStockAlert(product: any): boolean {
    if (!product.activo) return false;
    return product.stock_actual <= product.stock_minimo + 5; // 5 unidades de margen
  }

  // Obtener clase CSS para el estado del stock
  getStockStatusClass(product: any): string {
    if (product.stock_actual <= product.stock_minimo) {
      return 'text-red-600 font-bold';
    } else if (product.stock_actual <= product.stock_minimo + 5) {
      return 'text-yellow-600 font-medium';
    } else {
      return 'text-green-600';
    }
  }

  // Cambiar página en la paginación
  changePage(page: number) {
    this.currentPage = page;
    this.loadProducts();
  }

  // Abrir modal para agregar un nuevo producto
  openAddProductModal() {
    this.modalService.open(ModalProductComponent, {
      title: 'Nuevo Producto',
      width: '800px'
    }).then((result: any) => {
      if (result) {
        console.log('Producto creado, recargando lista...');
        setTimeout(() => {
        this.loadProducts();
      }, 100);
      }
    });
  }

  // Abrir modal para editar un producto existente
  openEditProductModal(product: any) {
    console.log('?? Abriendo modal de edición para producto:', product);
    
    // DEBUG DETALLADO: Ver la estructura completa
    console.log('?? PRODUCTO COMPLETO:', product);
    console.log('?? CATEGORY OBJECT:', product.category);
    console.log('?? KEYS de category:', product.category ? Object.keys(product.category) : 'No hay category');
    console.log('?? VALORES de category:', product.category ? Object.values(product.category) : 'No hay category');
    
    // Buscar el ID de categoría en diferentes ubicaciones posibles
    let id_categoria = null;
    
    // 1. Buscar directamente en el producto
    if (product.id_categoria) {
      id_categoria = product.id_categoria;
      console.log('?? id_categoria encontrado en producto:', id_categoria);
    }
    
    // 2. Buscar en el objeto category
    if (!id_categoria && product.category) {
      // Probar diferentes nombres de propiedad comunes
      const possibleCategoryIdKeys = ['id_categoria', 'id', 'idCategoria', 'categoria_id', 'categoryId', 'idCategory'];
      
      for (const key of possibleCategoryIdKeys) {
        if (product.category[key] !== undefined && product.category[key] !== null) {
          id_categoria = product.category[key];
          console.log(`?? id_categoria encontrado en category.${key}:`, id_categoria);
          break;
        }
      }
    }
    
    // 3. Si aun no encontramos, mostrar advertencia
    if (!id_categoria) {
      console.warn('?? NO SE ENCONTRÓ id_categoria. Propiedades disponibles:');
      console.warn('   - Producto:', Object.keys(product));
      if (product.category) {
        console.warn('   - Category:', Object.keys(product.category));
      }
    }
    
    // Convertir a número si es posible
    if (id_categoria && !isNaN(Number(id_categoria))) {
      id_categoria = Number(id_categoria);
      console.log('?? id_categoria convertido a número:', id_categoria);
    } else if (id_categoria) {
      console.warn('?? id_categoria no es un número válido:', id_categoria);
    }
    
    const productData = {
      ...product,
      id_categoria: id_categoria
    };
    
    console.log('?? Datos finales enviados al modal:', productData);
    
    this.modalService.open(ModalProductComponent, {
      title: 'Editar Producto',
      width: '800px',
      data: { data: productData }
    }).then((result: any) => {
      if (result) {
        console.log('? Producto actualizado, recargando lista...');
        setTimeout(() => {
        this.loadProducts();
      }, 100);
      }
    });
  }
}