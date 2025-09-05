// purchase.component.ts
import { Component, OnInit } from '@angular/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ModalPurchaseComponent } from './modal-purchase/modal-purchase.component';
import { PurchaseService } from './purchase.service';
import { Purchase } from '../../interfaces/purchase.interface';
import { PurchaseDetailsComponent } from './purchase-details/purchase-details.component';

@Component({
  selector: 'app-purchase',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe],
  templateUrl: './purchase.component.html',
  styleUrl: './purchase.component.scss',
  providers: [DialogService],
})
export class PurchaseComponent implements OnInit {
  purchases: Purchase[] = [];
  loading = true;
  error = '';
  ref!: DynamicDialogRef;

  constructor(
    private purchaseService: PurchaseService,
    private dialogService: DialogService
  ) { }

  async ngOnInit() {
    await this.loadPurchases();
  }

  async loadPurchases() {
    this.loading = true;
    this.error = '';
    
    try {
      const data = await this.purchaseService.getPurchases();
      
      // Asegúrate de que siempre sea un array
      this.purchases = Array.isArray(data) ? data : [];
      
    } catch (error: any) {
      console.error('Error loading purchases:', error);
      this.error = 'Error al cargar las compras';
      this.purchases = []; // Asegurar que siempre sea un array
    } finally {
      this.loading = false;
    }
  }

openAddPurchaseModal() {
  this.ref = this.dialogService.open(ModalPurchaseComponent, {
    //header: 'Nueva Compra',
    width: '900px',
    //closable: true,
    data: { data: null } // Enviar null explícitamente para nueva compra
  });
  
  this.ref.onClose.subscribe((reload: boolean) => {
    if (reload) {
      this.loadPurchases();
    }
  });
}

openEditPurchaseModal(purchase: Purchase) {
  this.ref = this.dialogService.open(ModalPurchaseComponent, {
    data: { data: purchase }, // Enviar el objeto purchase completo
    //header: 'Editar Compra',
    width: '900px',
    //closable: true
  });

  this.ref.onClose.subscribe((reload: boolean) => {
    if (reload) {
      this.loadPurchases();
    }
  });
}

  viewPurchaseDetails(purchase: Purchase) {
    this.ref = this.dialogService.open(PurchaseDetailsComponent, {
      //header: 'Detalles de Compra',
      //width: '800px',
      //closable: true,
      data: { purchase: purchase }
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completada': return 'text-green-600';
      case 'pendiente': return 'text-yellow-600';
      case 'cancelada': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  
}