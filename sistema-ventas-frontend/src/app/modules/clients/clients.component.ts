// sistema-ventas-frontend/src/app/modules/clients/clients.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ClientsService } from './clients.service';
import { GeneralService } from '../../core/gerneral.service';
import { ModalClientsComponent } from './modal-clients/modal-clients.component';

@Component({
  selector: 'app-clients',
  imports: [CommonModule],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss',
  providers: [DialogService],
})
export class ClientsComponent {
    clients: any;
  ref!: DynamicDialogRef;

  constructor( private clientsService: ClientsService, 
              private dialogService: DialogService,
              private generalService: GeneralService
            ) { }

  ngOnInit(): void {
    this.generalService.show(); // option
    this.loadClients();
  }

  async loadClients() {
    this.clients = await this.clientsService.getClients()
    this.generalService.hide(); // option
  }

  openAddClientsModal() {
    this.ref = this.dialogService.open(ModalClientsComponent, {
      //header: 'Nuevo Cliente',
      width: '800px',
      //closable: true
    });
    this.ref.onClose.subscribe((data: any) => {
      
  
        this.loadClients()
    
    });
  }

  openEditClientsModal(clients:any){
    this.ref = this.dialogService.open(ModalClientsComponent, {
      data: { data: clients},
      //header: 'Actualizar Cliente',
      width: '800px',
      //closable: true
    });

    this.ref.onClose.subscribe((data: any) => {
      
     
        this.loadClients()
     
    });
  }



}
