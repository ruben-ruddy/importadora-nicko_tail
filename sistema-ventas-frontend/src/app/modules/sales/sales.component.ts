// sistema-ventas-frontend/src/app/modules/sales/sales.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SalesService } from './sales.service';
import { ModalSalesComponent } from './modal-sales/modal-sales.component';
import { Sale } from './types';
import { SaleTicketComponent } from './sale-ticket/sale-ticket.component';
import { FormsModule } from '@angular/forms';

// Servicios personalizados
import { ModalService } from '../../project/services/modal.service';
import { ToasterService } from '../../project/services/toaster.service';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule
  ],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss'
})
export class SalesComponent implements OnInit {
  Math = Math;
  sales: any = {
    data: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  };
  loading = true;
  
  // Variables para paginación y búsqueda
  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;

  constructor(
    private salesService: SalesService,
    private modalService: ModalService,
    private toaster: ToasterService
  ) { }

  async ngOnInit() {
    await this.loadSales();
  }

  async loadSales() {
    try {
      this.loading = true;
      
      const queryParams: any = {
        page: this.currentPage,
        limit: this.itemsPerPage
      };
      
      if (this.searchTerm) {
        queryParams.search = this.searchTerm;
      }
      
      const response: any = await this.salesService.getSales(queryParams);
      this.sales = response;
      this.sales.totalPages = Math.ceil(response.total / response.limit);
    } catch (error) {
      console.error('Error loading sales:', error);
      this.toaster.showToast({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar las ventas'
      });
    } finally {
      this.loading = false;
    }
  }

  onSearchChange(event: any) {
    this.searchTerm = event.target.value;
    this.debounceSearch();
  }

  private debounceTimer: any;
  private debounceSearch() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.currentPage = 1;
      this.loadSales();
    }, 300);
  }

  changePage(page: number) {
    if (page < 1 || page > this.sales.totalPages) return;
    this.currentPage = page;
    this.loadSales();
  }

  changeItemsPerPage(limit: number) {
    this.itemsPerPage = Number(limit);
    this.currentPage = 1;
    this.loadSales();
  }

  getPages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const totalPages = this.sales.totalPages;
    const current = this.currentPage;
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (current > 3) {
        pages.push('...');
      }
      
      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (current < totalPages - 2) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  }

  openAddSaleModal() {
    this.modalService.open(ModalSalesComponent, {
      title: 'Nueva Venta',
      width: '90%',
      data: {} // Asegurar que data existe
    }).then((result: any) => {
      if (result) {
        this.loadSales();
      }
    });
  }

  openEditSaleModal(sale: Sale, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    this.modalService.open(ModalSalesComponent, {
      title: 'Editar Venta',
      width: '90%',
      data: { data: sale } // Pasar los datos correctamente
    }).then((result: any) => {
      if (result) {
        this.loadSales();
      }
    });
  }

  openPrintTicketModal(sale: Sale, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    this.modalService.open(SaleTicketComponent, {
      title: 'Ticket de Venta',
      width: '340px',
      data: { 
        saleData: sale,
        showPrintButton: true
      }
    });
  }

  confirmDelete(sale: Sale) {
    const confirmMessage = `¿Estás seguro de que quieres eliminar la venta ${sale.numero_venta}?`;
    
    if (confirm(confirmMessage)) {
      this.deleteSale(sale);
    }
  }

  async deleteSale(sale: Sale) {
    try {
      await this.salesService.deleteSale(sale.id_venta);
      this.toaster.showToast({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Venta eliminada correctamente'
      });
      this.loadSales();
    } catch (error) {
      console.error('Error deleting sale:', error);
      this.toaster.showToast({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo eliminar la venta'
      });
    }
  }

  formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  }

  formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('es-CO');
  }
}