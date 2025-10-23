// sistema-ventas-frontend/src/app/modules/purchase/purchase-details/purchase-details.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Purchase, PurchaseDetail } from '../../../interfaces/purchase.interface';

// Servicio de modales
import { ModalService } from '../../../project/services/modal.service';

@Component({
  selector: 'app-purchase-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './purchase-details.component.html',
  styleUrl: './purchase-details.component.scss'
})
export class PurchaseDetailsComponent implements OnInit {
  @Input() modalData: any = {};
  @Input() modalConfig: any = {};

  purchase: Purchase = {
    id_compra: '',
    id_usuario: '',
    numero_compra: '',
    fecha_compra: new Date(),
    total: 0,
    estado: 'pendiente',
    observaciones: '',
    detalle_compras: [],
    user: {
      id_usuario: '',
      nombre_usuario: '',
      nombre_completo: '',
      email: ''
      // Quitar 'activo' y 'fecha_creacion' ya que no están en la interfaz
    }
  };

  constructor(
    private modalService: ModalService
  ) {}

  ngOnInit() {
    console.log('🔄 Iniciando componente de detalles...');
    
    // CORREGIDO: Inicializar después de que los inputs estén disponibles
    if (this.modalData?.purchase) {
      this.purchase = {
        ...this.purchase,
        ...this.modalData.purchase
      };
      
      // Asegurar que detalle_compras sea un array
      if (!this.purchase.detalle_compras) {
        this.purchase.detalle_compras = [];
      }
      
      // Asegurar que user tenga valores por defecto según la interfaz
      if (!this.purchase.user) {
        this.purchase.user = {
          id_usuario: '',
          nombre_usuario: 'N/A',
          nombre_completo: 'N/A',
          email: ''
        };
      } else {
        // Limpiar propiedades que no están en la interfaz
        this.purchase.user = {
          id_usuario: this.purchase.user.id_usuario || '',
          nombre_usuario: this.purchase.user.nombre_usuario || 'N/A',
          nombre_completo: this.purchase.user.nombre_completo || 'N/A',
          email: this.purchase.user.email || ''
        };
      }
      
      console.log('✅ Datos de compra cargados:', this.purchase);
      console.log('📦 Número de detalles:', this.purchase.detalle_compras.length);
    } else {
      console.error('❌ No se recibieron datos de compra');
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(amount || 0);
  }

  formatDate(date: string | Date): string {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('es-BO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  close() {
    this.modalService.close();
  }

  getStatusClass(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm';
      case 'completada':
        return 'bg-green-100 text-green-800 px-2 py-1 rounded text-sm';
      case 'cancelada':
        return 'bg-red-100 text-red-800 px-2 py-1 rounded text-sm';
      default:
        return 'bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm';
    }
  }

  getProductName(detalle: PurchaseDetail): string {
    return detalle.producto?.nombre_producto || 'Producto no encontrado';
  }

  getUserName(): string {
    return this.purchase.user?.nombre_completo || 
           this.purchase.user?.nombre_usuario || 
           'Usuario no disponible';
  }
}