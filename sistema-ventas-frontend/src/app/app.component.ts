// sistema-ventas-frontend/src/app/app.component.ts
import { Component, inject, ViewChild, ViewContainerRef, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './project/components/toast/toast.component';
import { LoadingOverlayComponent } from './project/components/loading-overlay/loading-overlay.component';
import { ModalService } from './project/services/modal.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, LoadingOverlayComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit {
  title = 'frontend-angular';
  
  @ViewChild('modalContainer', { read: ViewContainerRef }) 
  modalContainer!: ViewContainerRef;

  private modalService = inject(ModalService);

  ngAfterViewInit() {
    console.log('AppComponent - Setting modal container');
    
    // Pequeño delay para asegurar que el DOM esté listo
    setTimeout(() => {
      if (this.modalContainer) {
        this.modalService.setContainer(this.modalContainer);
        console.log('Modal container set successfully');
      } else {
        console.error('Modal container not found!');
      }
    }, 0);
  }
}