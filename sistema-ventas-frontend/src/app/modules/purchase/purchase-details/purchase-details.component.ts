// purchase-details.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { Purchase } from '../../../interfaces/purchase.interface';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-purchase-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './purchase-details.component.html',
  styleUrl: './purchase-details.component.scss',
  providers: [CurrencyPipe, DatePipe]
})
export class PurchaseDetailsComponent {
  purchase: Purchase;

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private currencyPipe: CurrencyPipe,
    private datePipe: DatePipe
  ) {
    this.purchase = this.config.data.purchase;
  }

  formatCurrency(amount: number): string {
    return this.currencyPipe.transform(amount, 'BOB', 'symbol', '1.2-2') || '';
  }

  formatDate(date: string | Date): string {
    return this.datePipe.transform(date, 'medium') || '';
  }

  close() {
    this.ref.close();
  }

    getStatusClass(estado: string): string {
    switch (estado) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completada':
        return 'bg-green-100 text-green-800';
      case 'Cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}