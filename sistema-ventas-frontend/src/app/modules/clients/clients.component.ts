// sistema-ventas-frontend/src/app/modules/clients/clients.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ClientsService } from './clients.service';
import { GeneralService } from '../../core/gerneral.service';
import { ModalClientsComponent } from './modal-clients/modal-clients.component';
import { ModalService } from '../../project/services/modal.service';
import { ToasterService } from '../../project/services/toaster.service';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss'
})
export class ClientsComponent {
  Math = Math;
  clients: any = { clients: [], total: 0, page: 1, limit: 10, totalPages: 0 };
  currentPage: number = 1;
  itemsPerPage: number = 10;
  searchTerm: string = '';

  private clientsService = inject(ClientsService);
  private modalService = inject(ModalService);
  private generalService = inject(GeneralService);
  private toaster = inject(ToasterService);

  ngOnInit(): void {
    this.generalService.show();
    this.loadClients();
  }

  // Cargar los clientes desde el servicio
  async loadClients(page: number = 1, limit: number = 10) {
    try {
      this.clients = await this.clientsService.getClients(page, limit, this.searchTerm);
      this.currentPage = page;
      this.itemsPerPage = limit;
    } catch (error) {
      console.error('Error loading clients:', error);
      this.toaster.showToast({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los clientes'
      });
    } finally {
      this.generalService.hide();
    }
  }

  // Manejar cambios en el término de búsqueda
  onSearchChange(event: any) {
    this.searchTerm = event.target.value;
    this.loadClients(1, this.itemsPerPage);
  }

  // Cambiar de página
  changePage(page: number) {
    this.loadClients(page, this.itemsPerPage);
  }

  // Cambiar la cantidad de elementos por página
  changeItemsPerPage(limit: number) {
    this.loadClients(1, limit);
  }

  // Abrir el modal para agregar un nuevo cliente
  openAddClientsModal() {
    this.modalService.open(ModalClientsComponent, {
      title: 'Nuevo Cliente',
      width: '800px'
    }).then((result: any) => {
      if (result) {
        this.loadClients(this.currentPage, this.itemsPerPage);
      }
    });
  }

  // Abrir el modal para editar un cliente existente
  openEditClientsModal(client: any){
    this.modalService.open(ModalClientsComponent, {
      title: 'Editar Cliente',
      width: '800px',
      data: { data: client }
    }).then((result: any) => {
      if (result) {
        this.loadClients(this.currentPage, this.itemsPerPage);
      }
    });
  }

  // Confirmar eliminación de un cliente
  confirmDelete(client: any) {
    const confirmMessage = `¿Está seguro de eliminar al cliente "${client.nombre_completo}"?`;
    
    if (confirm(confirmMessage)) {
      this.deleteClient(client.id_cliente);
    }
  }

  // Eliminar un cliente
  async deleteClient(id: string) {
    try {
      await this.clientsService.deleteClients(id);
      this.toaster.showToast({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Cliente eliminado correctamente'
      });
      this.loadClients(this.currentPage, this.itemsPerPage);
    } catch (error: any) {
      console.error('Error deleting client:', error);
      let errorMessage = 'Error al eliminar el cliente';
      
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 409) {
        errorMessage = 'No se puede eliminar el cliente porque tiene ventas asociadas';
      }
      
      this.toaster.showToast({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage
      });
    }
  }

  // Obtener las páginas para la paginación
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