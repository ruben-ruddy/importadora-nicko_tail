// sistema-ventas-frontend/src/app/modules/purchase/purchase.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalPurchaseComponent } from './modal-purchase/modal-purchase.component';
import { PurchaseService, PurchaseQuery } from './purchase.service';
import { Purchase } from '../../interfaces/purchase.interface';
import { PurchaseDetailsComponent } from './purchase-details/purchase-details.component';
import { GeneralService } from '../../core/gerneral.service';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ModalService } from '../../project/services/modal.service';
import { ToasterService } from '../../project/services/toaster.service';

@Component({
  selector: 'app-purchase',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe, FormsModule],
  templateUrl: './purchase.component.html'
})
export class PurchaseComponent implements OnInit, OnDestroy {
  Math = Math;
  purchases: Purchase[] = [];
  loading = true;
  error = '';
  
  // Paginación
  totalRecords = 0;
  page = 1;
  limit = 10;
  lastPage = 1;
  
  // Búsqueda
  searchTerm = '';
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  
  // Filtros
  estadoFilter = '';
  
  // Usuario logeado
  currentUser: any = null;

  constructor(
    private purchaseService: PurchaseService,
    private modalService: ModalService,
    private generalService: GeneralService,
    private toaster: ToasterService
  ) {
    // Configurar búsqueda en tiempo real con debounce
    this.searchSubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.page = 1;
      this.loadPurchases();
    });
  }

  //
  async ngOnInit() {
    await this.loadCurrentUser();
    await this.loadPurchases();
  }

  // Limpieza al destruir el componente
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Cargar el usuario actual
  async loadCurrentUser() {
    try {
      this.currentUser = this.generalService.getUser();
      console.log('👤 Usuario actual:', this.currentUser);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  }

  // Cargar las compras desde el servicio
  async loadPurchases() {
    this.loading = true;
    this.error = '';
    
    try {
      const query: PurchaseQuery = {
        page: this.page,
        limit: this.limit,
        search: this.searchTerm,
        estado: this.estadoFilter,
      };
      
      const response = await this.purchaseService.getPurchases(query);
      
      this.purchases = response.data;
      this.totalRecords = response.total;
      this.page = response.page;
      this.limit = response.limit;
      this.lastPage = response.lastPage;
      
      console.log(' Compras cargadas:', this.purchases.length);
      
    } catch (error: any) {
      console.error('Error loading purchases:', error);
      this.error = 'Error al cargar las compras';
      this.purchases = [];
      this.toaster.showToast({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar las compras'
      });
    } finally {
      this.loading = false;
    }
  }

  // Manejar cambios en el campo de búsqueda
  onSearchChange(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value;
    this.searchSubject.next(searchTerm);
  }

  // Manejar cambios en el filtro de estado
  onEstadoFilterChange(event: Event) {
    this.estadoFilter = (event.target as HTMLSelectElement).value;
    this.page = 1;
    this.loadPurchases();
  }

  // Manejar cambio de página
  onPageChange(newPage: number) {
    if (newPage >= 1 && newPage <= this.lastPage) {
      this.page = newPage;
      this.loadPurchases();
    }
  }

  // Manejar cambio de límite de registros por página
  onLimitChange(newLimit: number) {
    this.limit = Number(newLimit);
    this.page = 1;
    this.loadPurchases();
  }

  // Limpiar filtros y búsqueda
  clearFilters() {
    this.searchTerm = '';
    this.estadoFilter = '';
    this.page = 1;
    this.loadPurchases();
  }

  // Obtener las páginas para la paginación
  getPages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const totalPages = this.lastPage;
    const currentPage = this.page;
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  }

  // Abrir modal para agregar nueva compra
  openAddPurchaseModal(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    const initialData = this.currentUser ? { 
      id_usuario: this.currentUser.id_usuario 
    } : {};
    
    console.log(' Abriendo modal para nueva compra');
    
    this.modalService.open(ModalPurchaseComponent, {
      title: 'Nueva Compra',
      width: '900px',
      data: { 
        data: initialData,
        currentUser: this.currentUser 
      }
    }).then((reload: boolean) => {
      if (reload) {
        console.log(' Recargando lista de compras...');
        this.loadPurchases();
      }
    });
  }

  // Abrir modal para editar una compra existente
  openEditPurchaseModal(purchase: Purchase, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    if (purchase.estado?.toLowerCase() !== 'pendiente') {
      this.toaster.showToast({
        severity: 'warning',
        summary: 'Advertencia',
        detail: 'Solo se pueden editar compras pendientes'
      });
      return;
    }

    console.log(' Abriendo modal para editar compra:', purchase.numero_compra);

    this.modalService.open(ModalPurchaseComponent, {
      title: 'Editar Compra',
      width: '900px',
      data: { 
        data: purchase,
        currentUser: this.currentUser 
      }
    }).then((reload: boolean) => {
      if (reload) {
        console.log(' Recargando lista de compras...');
        this.loadPurchases();
      }
    });
  }

  // Ver detalles de una compra
  async viewPurchaseDetails(purchase: Purchase, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    console.log(' Abriendo detalles de compra:', purchase.numero_compra);
    
    try {
      // Cargar los detalles completos de la compra
      const purchaseWithDetails = await this.purchaseService.getPurchaseById(purchase.id_compra!);
      console.log(' Detalles cargados para visualización:', purchaseWithDetails);
      
      this.modalService.open(PurchaseDetailsComponent, {
        title: `Detalles de Compra - ${purchase.numero_compra}`,
        width: '800px',
        data: { purchase: purchaseWithDetails }
      });
    } catch (error) {
      console.error(' Error loading purchase details:', error);
      this.toaster.showToast({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los detalles de la compra'
      });
    }
  }
}