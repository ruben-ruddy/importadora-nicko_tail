//sistema-ventas-frontend/src/app/modules/product/product.component.ts
import { Component } from '@angular/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalProductComponent } from './modal-product/modal-product.component';
import { ProductService } from './product.service';
import { GeneralService } from '../../core/gerneral.service';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product.component.html',
  styleUrl: './product.component.scss',
  providers: [DialogService],
})
export class ProductComponent {
  products: any;
  ref!: DynamicDialogRef;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  activeFilter: string = 'all';
  Math = Math; // Para usar Math en la plantilla

  constructor(
    private productService: ProductService,
    private dialogService: DialogService,
    private generalService: GeneralService
  ) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  async loadProducts() {
    const queryParams: any = {
      page: this.currentPage.toString(),
      limit: this.itemsPerPage.toString()
    };

    if (this.activeFilter !== 'all') {
      queryParams.active = this.activeFilter === 'active' ? 'true' : 'false';
    }

    this.products = await this.productService.getProducts(queryParams);
  }

  changePage(page: number) {
    this.currentPage = page;
    this.loadProducts();
  }

  openAddProductModal() {
    this.ref = this.dialogService.open(ModalProductComponent, {
      header: 'Nuevo Producto',
      width: '800px',
      //closable: true
    });
    
    this.ref.onClose.subscribe((data: any) => {
      if (data) {
        this.loadProducts();
      }
    });
  }

  openEditProductModal(product: any) {
    this.ref = this.dialogService.open(ModalProductComponent, {
      data: { data: product },
      header: 'Editar Producto',
      width: '800px',
      //closable: true
    });

    this.ref.onClose.subscribe((data: any) => {
      if (data) {
        this.loadProducts();
      }
    });
  }
}