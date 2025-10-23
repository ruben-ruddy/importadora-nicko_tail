// sistema-ventas-frontend/src/app/project/services/modal.service.ts
import { Injectable, ComponentRef, ViewContainerRef, inject } from '@angular/core';

export interface ModalConfig {
  title?: string;
  width?: string;
  data?: any;
  showHeader?: boolean;
  maxHeight?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalContainer?: ViewContainerRef;
  private currentModal?: ComponentRef<any>;
  private modalData: any = {};

  setContainer(container: ViewContainerRef) {
    console.log('ModalService - Container set');
    this.modalContainer = container;
  }

  async open(component: any, config: ModalConfig = {}): Promise<any> {
    console.log('ModalService - Opening modal with config:', config);
    
    return new Promise((resolve) => {
      if (!this.modalContainer) {
        console.error('ModalService - Modal container not set!');
        return resolve(null);
      }

      // Limpiar modal anterior
      this.close();

      // Guardar datos del modal
      this.modalData = config.data || {};

      try {
        // Crear el contenedor del modal primero
        const wrapper = document.createElement('div');
        wrapper.className = 'fixed inset-0 z-[9999] flex items-start justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto';
        
        // Crear backdrop que cierra el modal al hacer clic
        const backdrop = document.createElement('div');
        backdrop.className = 'fixed inset-0 bg-black bg-opacity-50';
        backdrop.addEventListener('click', () => {
          console.log('ModalService - Backdrop clicked, closing modal');
          this.close();
        });
        
        // Crear contenedor para el contenido del modal con scroll
        const contentContainer = document.createElement('div');
        contentContainer.className = 'relative z-[10000] w-full max-w-2xl my-8';
        contentContainer.addEventListener('click', (event) => {
          event.stopPropagation(); // Prevenir cierre al hacer clic en el contenido
        });
        
        // Agregar elementos al DOM
        wrapper.appendChild(backdrop);
        wrapper.appendChild(contentContainer);
        document.body.appendChild(wrapper);

        // Crear el componente dentro del contenedor de contenido
        const viewContainerRef = this.modalContainer;
        this.currentModal = viewContainerRef.createComponent(component);

        // Mover el elemento host del componente al contentContainer
        const hostEl = (this.currentModal.location.nativeElement as HTMLElement);
        contentContainer.appendChild(hostEl);

        // Pasar datos al componente modal - MEJORADO
        if (this.currentModal.instance) {
          // Asignar modalData y modalConfig
          this.currentModal.instance.modalData = this.modalData;
          this.currentModal.instance.modalConfig = config;
          
          console.log('ModalService - Data passed to component:', this.modalData);
        }

        // Guardar referencias
        (this.currentModal as any).backdrop = backdrop;
        (this.currentModal as any).wrapper = wrapper;
        (this.currentModal as any).contentContainer = contentContainer;

        // Configurar resolución cuando el modal se cierre
        const originalNgOnDestroy = this.currentModal.instance.ngOnDestroy;
        this.currentModal.instance.ngOnDestroy = () => {
          if (originalNgOnDestroy) {
            originalNgOnDestroy.apply(this.currentModal!.instance);
          }
          this.cleanupModalElements();
          resolve(this.modalData.result);
        };

        console.log('ModalService - Modal opened successfully');

      } catch (error) {
        console.error('ModalService - Error opening modal:', error);
        resolve(null);
      }
    });
  }

  private cleanupModalElements() {
    if (this.currentModal) {
      const backdrop = (this.currentModal as any).backdrop;
      const wrapper = (this.currentModal as any).wrapper;
      const contentContainer = (this.currentModal as any).contentContainer;
      
      if (backdrop && backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }
      
      if (contentContainer && contentContainer.parentNode) {
        contentContainer.parentNode.removeChild(contentContainer);
      }
      
      if (wrapper && wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      }
      
      console.log('ModalService - Modal elements cleaned up');
    }
  }

  getData(): any {
    return this.modalData;
  }

  close(result?: any) {
    console.log('ModalService - Closing modal with result:', result);
    
    if (this.currentModal) {
      // Guardar resultado
      this.modalData.result = result;
      
      // Limpiar elementos del DOM
      this.cleanupModalElements();
      
      // Destruir componente
      this.currentModal.destroy();
      this.currentModal = undefined;
    }
  }
}