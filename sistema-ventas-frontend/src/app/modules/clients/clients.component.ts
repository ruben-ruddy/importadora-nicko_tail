// sistema-ventas-frontend/src/app/modules/clients/clients.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ClientsService } from './clients.service';
import { GeneralService } from '../../core/gerneral.service';
import { ModalClientsComponent } from './modal-clients/modal-clients.component';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss',
  providers: [DialogService],
})
export class ClientsComponent {
    Math = Math;
    clients: any = { clients: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    ref!: DynamicDialogRef;
    currentPage: number = 1;
    itemsPerPage: number = 10;
    searchTerm: string = '';

 // ✅ Usar inject() en lugar de constructor
  private clientsService = inject(ClientsService);
  private dialogService = inject(DialogService);
  private generalService = inject(GeneralService);

  ngOnInit(): void {
    this.generalService.show();
    this.loadClients();
  }

  async loadClients(page: number = 1, limit: number = 10) {
    try {
      this.clients = await this.clientsService.getClients(page, limit, this.searchTerm);
      this.currentPage = page;
      this.itemsPerPage = limit;
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      this.generalService.hide();
    }
  }

  onSearchChange(event: any) {
    this.searchTerm = event.target.value;
    this.loadClients(1, this.itemsPerPage);
  }

  changePage(page: number) {
    this.loadClients(page, this.itemsPerPage);
  }

  changeItemsPerPage(limit: number) {
    this.loadClients(1, limit);
  }

  openAddClientsModal() {
    this.ref = this.dialogService.open(ModalClientsComponent, {
      width: '800px',
    });
    this.ref.onClose.subscribe((data: any) => {
      if (data) {
        this.loadClients(this.currentPage, this.itemsPerPage);
      }
    });
  }

  openEditClientsModal(client: any){
    this.ref = this.dialogService.open(ModalClientsComponent, {
      data: { data: client},
      width: '800px',
    });

    this.ref.onClose.subscribe((data: any) => {
      if (data) {
        this.loadClients(this.currentPage, this.itemsPerPage);
      }
    });
  }

  // ✅ NUEVO MÉTODO PARA CONFIRMAR ELIMINACIÓN (BÁSICO)
  confirmDelete(client: any) {
    const confirmMessage = `¿Está seguro de eliminar al cliente "${client.nombre_completo}"?`;
    
    if (confirm(confirmMessage)) {
      this.deleteClient(client.id_cliente);
    }
  }

  // ✅ NUEVO MÉTODO PARA ELIMINAR CLIENTE
  async deleteClient(id: string) {
    try {
      await this.clientsService.deleteClients(id);
      alert('Cliente eliminado correctamente');
      this.loadClients(this.currentPage, this.itemsPerPage);
    } catch (error: any) {
      console.error('Error deleting client:', error);
      let errorMessage = 'Error al eliminar el cliente';
      
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 409) {
        errorMessage = 'No se puede eliminar el cliente porque tiene ventas asociadas';
      }
      
      alert(errorMessage);
    }
  }

  // ✅ MÉTODO PARA GENERAR PÁGINAS
  getPages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const totalPages = this.clients.totalPages;
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
}