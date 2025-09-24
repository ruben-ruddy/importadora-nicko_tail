// sistema-ventas-frontend/src/app/modules/sales/sales.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ModalSalesComponent } from './modal-sales/modal-sales.component';
import { SalesService } from './sales.service';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Sale } from './types';
import { SaleTicketComponent } from './sale-ticket/sale-ticket.component';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [
    CommonModule, 
    DynamicDialogModule, 
    ButtonModule, 
    InputTextModule,
    FormsModule,
    ConfirmDialogModule,
    ToastModule
  ],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss',
  providers: [DialogService, ConfirmationService, MessageService],
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
  ref!: DynamicDialogRef;
  loading = true;
  
  // Variables para paginación y búsqueda
  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;

  constructor(
    private salesService: SalesService,
    private dialogService: DialogService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
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
      this.messageService.add({
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
    this.ref = this.dialogService.open(ModalSalesComponent, {
      width: '90%',
      styleClass: 'bg-white dark:bg-gray-800 rounded-lg shadow-xl',
      style: { 
        'max-width': '1200px',
      },
      contentStyle: { 
        'padding': '0',
        'border-radius': '8px',
      },
      baseZIndex: 10000,
      modal: true,
      dismissableMask: true
    });
    
    this.ref.onClose.subscribe((data: any) => {
      if (data) {
        this.loadSales();
      }
    });
  }

  openEditSaleModal(sale: Sale, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    this.ref = this.dialogService.open(ModalSalesComponent, {
      data: { data: sale },
      width: '90%',
      style: { 'max-width': '1200px' },
      styleClass: 'bg-white dark:bg-gray-800'
    });

    this.ref.onClose.subscribe((data: any) => {
      if (data) {
        this.loadSales();
      }
    });
  }

  openPrintTicketModal(sale: Sale, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    this.ref = this.dialogService.open(SaleTicketComponent, {
      data: { 
        saleData: sale,
        showPrintButton: true
      },
      header: 'Ticket de Venta',
      width: '340px',
      styleClass: 'ticket-dialog bg-white dark:bg-gray-800',
      contentStyle: { 
        'padding': '0',
        'margin': '0',
        'border-radius': '8px',
        'overflow-y': 'auto',
        'max-height': '80vh',
        'max-width': '95vw'
      },
      baseZIndex: 10000,
      modal: true,
      closable: true,
      dismissableMask: true
    });
  }

  confirmDelete(sale: Sale) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que quieres eliminar la venta ${sale.numero_venta}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        this.deleteSale(sale);
      }
    });
  }

  async deleteSale(sale: Sale) {
    try {
      await this.salesService.deleteSale(sale.id_venta);
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Venta eliminada correctamente'
      });
      this.loadSales();
    } catch (error) {
      console.error('Error deleting sale:', error);
      this.messageService.add({
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