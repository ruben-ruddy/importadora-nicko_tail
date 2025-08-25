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

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [
    CommonModule, 
    DynamicDialogModule, 
    ButtonModule, 
    InputTextModule
  ],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss',
  providers: [DialogService],
})
export class SalesComponent implements OnInit {
  sales: Sale[] = [];
  ref!: DynamicDialogRef;
  loading = true;

  constructor(
    private salesService: SalesService,
    private dialogService: DialogService
  ) { }

  async ngOnInit() {
    await this.loadSales();
  }

  async loadSales() {
    try {
      this.loading = true;
      const response: any = await this.salesService.getSales();
      this.sales = response.data || response;
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      this.loading = false;
    }
  }

openAddSaleModal() {
  this.ref = this.dialogService.open(ModalSalesComponent, {
    header: 'Nueva Venta',
    width: '90%',
    styleClass: 'bg-white rounded-lg shadow-xl', // Clases de Tailwind
    style: { 
      'max-width': '1200px',
    },
    contentStyle: { 
      'padding': '0',
      'border-radius': '8px',
    },
    baseZIndex: 10000,
    modal: true,
    closable: true,
    dismissableMask: true
  });
  
  this.ref.onClose.subscribe((data: any) => {
    if (data) {
      this.loadSales();
    }
  });
}

  openEditSaleModal(sale: Sale) {
    this.ref = this.dialogService.open(ModalSalesComponent, {
      data: { data: sale },
      header: 'Editar Venta',
      width: '90%',
      style: { 'max-width': '1200px' }, // Usa style en lugar de maxWidth
      closable: true
    });

    this.ref.onClose.subscribe((data: any) => {
      if (data) {
        this.loadSales();
      }
    });
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