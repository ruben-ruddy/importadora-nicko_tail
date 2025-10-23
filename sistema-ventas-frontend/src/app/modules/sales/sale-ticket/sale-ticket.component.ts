// sistema-ventas-frontend/src/app/modules/sales/sale-ticket/sale-ticket.component.ts
import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

// Servicio de modales
import { ModalService } from '../../../project/services/modal.service';

@Component({
  selector: 'app-sale-ticket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sale-ticket.component.html',
  styleUrl: './sale-ticket.component.scss'
})
export class SaleTicketComponent implements OnInit {
  @Input() modalData: any = {};
  @Input() modalConfig: any = {};
  
  saleData: any = null;
  showPrintButton: boolean = true;
  
  companyName: string = environment.companyName || 'Mi Empresa';
  companyAddress: string = environment.companyAddress || 'Dirección de la empresa';
  companyPhone: string = environment.companyPhone || 'Teléfono';

  currentDate: string = new Date().toLocaleDateString();
  currentTime: string = new Date().toLocaleTimeString();

  constructor(
    private modalService: ModalService
  ) {}

  ngOnInit() {
    if (this.modalData) {
      this.saleData = this.modalData.saleData;
      this.showPrintButton = this.modalData.showPrintButton !== false;
      
      console.log('Datos del ticket:', this.saleData);
      console.log('Mostrar botón imprimir:', this.showPrintButton);
    }
  }

  printTicket() {
    console.log('Imprimiendo ticket...');
    window.print();
  }

  closeDialog() {
    this.modalService.close();
  }
}