// sistema-ventas-frontend/src/app/modules/sales/sale-ticket/sale-ticket.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-sale-ticket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sale-ticket.component.html',
  styleUrl: './sale-ticket.component.scss'
})
export class SaleTicketComponent implements OnInit {
  dynamicDialogConfig = inject(DynamicDialogConfig);
  dynamicDialogRef = inject(DynamicDialogRef);
  
  saleData: any = null;
  showPrintButton: boolean = true;
  
//  companyLogo: string = environment.companyLogo || 'assets/images/nicko.png';
  companyName: string = environment.companyName || 'Mi Empresa';
  companyAddress: string = environment.companyAddress || 'Dirección de la empresa';
  companyPhone: string = environment.companyPhone || 'Teléfono';
  companyTaxId: string = environment.companyTaxId || 'NIT';

  currentDate: string = new Date().toLocaleDateString();
  currentTime: string = new Date().toLocaleTimeString();

  ngOnInit() {
    if (this.dynamicDialogConfig.data) {
      this.saleData = this.dynamicDialogConfig.data.saleData;
      this.showPrintButton = this.dynamicDialogConfig.data.showPrintButton !== false;
      
      console.log('Datos del ticket:', this.saleData);
      console.log('Mostrar botón imprimir:', this.showPrintButton);
    }
  }

  printTicket() {
    console.log('Imprimiendo ticket...');
    window.print();
  }

  closeDialog() {
    this.dynamicDialogRef.close();
  }
}