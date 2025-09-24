// sistema-ventas-frontend/src/app/modules/purchase/purchase.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalPurchaseComponent } from './modal-purchase/modal-purchase.component';
import { PurchaseService, PurchaseQuery } from './purchase.service';
import { Purchase } from '../../interfaces/purchase.interface';
import { PurchaseDetailsComponent } from './purchase-details/purchase-details.component';
import { GeneralService } from '../../core/gerneral.service';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-purchase',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe, FormsModule],
  templateUrl: './purchase.component.html',
  providers: [DialogService],
})
export class PurchaseComponent implements OnInit, OnDestroy {
  Math = Math;
  purchases: Purchase[] = [];
  loading = true;
  error = '';
  ref!: DynamicDialogRef;
  
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
    private dialogService: DialogService,
    private generalService: GeneralService
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

  async ngOnInit() {
    await this.loadCurrentUser();
    await this.loadPurchases();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadCurrentUser() {
    try {
      this.currentUser = this.generalService.getUser();
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  }

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
      
    } catch (error: any) {
      console.error('Error loading purchases:', error);
      this.error = 'Error al cargar las compras';
      this.purchases = [];
    } finally {
      this.loading = false;
    }
  }

  onSearchChange(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value;
    this.searchSubject.next(searchTerm);
  }

  onEstadoFilterChange(event: Event) {
    this.estadoFilter = (event.target as HTMLSelectElement).value;
    this.page = 1;
    this.loadPurchases();
  }

  onPageChange(newPage: number) {
    if (newPage >= 1 && newPage <= this.lastPage) {
      this.page = newPage;
      this.loadPurchases();
    }
  }

  onLimitChange(newLimit: number) {
    this.limit = Number(newLimit);
    this.page = 1;
    this.loadPurchases();
  }

  clearFilters() {
    this.searchTerm = '';
    this.estadoFilter = '';
    this.page = 1;
    this.loadPurchases();
  }

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

  openAddPurchaseModal(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    const initialData = this.currentUser ? { 
      id_usuario: this.currentUser.id_usuario 
    } : {};
    
    this.ref = this.dialogService.open(ModalPurchaseComponent, {
      width: '900px',
      styleClass: 'dark:bg-gray-900 dark:text-gray-100',
      data: { 
        data: initialData,
        currentUser: this.currentUser 
      }
    });
    
    this.ref.onClose.subscribe((reload: boolean) => {
      if (reload) {
        this.loadPurchases();
      }
    });
  }

  openEditPurchaseModal(purchase: Purchase, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    if (purchase.estado?.toLowerCase() !== 'pendiente') {
      return;
    }

    this.ref = this.dialogService.open(ModalPurchaseComponent, {
      width: '900px',
      styleClass: 'dark:bg-gray-900 dark:text-gray-100',
      data: { 
        data: purchase,
        currentUser: this.currentUser 
      }
    });

    this.ref.onClose.subscribe((reload: boolean) => {
      if (reload) {
        this.loadPurchases();
      }
    });
  }

  viewPurchaseDetails(purchase: Purchase, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    this.ref = this.dialogService.open(PurchaseDetailsComponent, {
      width: '800px',
      styleClass: 'dark:bg-gray-900 dark:text-gray-100',
      data: { purchase: purchase }
    });
  }
}