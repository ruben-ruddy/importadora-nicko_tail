import { Component, OnInit } from '@angular/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CommonModule } from '@angular/common';
import { lastValueFrom } from 'rxjs'; // Necesario para lastValueFrom

// Componentes del mismo módulo
import { HomeProductModalComponent } from './home-product-modal/home-product-modal.component';
import { HeaderHomeMainComponent } from "../header-home-main/header-home-main.component";
import { FooterHomeMainComponent } from "../footer-home-main/footer-home-main.component";

// Importa el ImageService centralizado (asegúrate de la ruta correcta)
import { ImageService } from '../../../project/services/image.service'; // <-- ¡IMPORTANTE!

// Servicios generales
import { GeneralService } from '../../../core/gerneral.service';

// PrimeNG Modules
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home-products',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    FooterHomeMainComponent,
    HeaderHomeMainComponent,
   // HomeProductModalComponent // Asegúrate de que el modal también se importe aquí si se usa como stand-alone
  ],
  templateUrl: './home-products.component.html',
  styleUrl: './home-products.component.scss',
  providers: [DialogService], // DialogService debe estar aquí
})
export class HomeProductsComponent implements OnInit {
  products: any[] = [];
  filteredProducts: any[] = [];
  ref!: DynamicDialogRef; // `ref` para la referencia al modal
  searchTerm: string = '';

  constructor(
    // ¡Ahora inyectamos el ImageService!
    private imageService: ImageService, // <--- ¡CAMBIO CLAVE AQUÍ!
    private dialogService: DialogService,
    private generalService: GeneralService
  ) { }

  ngOnInit(): void {
    this.generalService.show(); // Mostrar spinner o indicador de carga
    this.loadProducts();
  }

  async loadProducts() {
    this.generalService.show(); // Mostrar spinner o indicador de carga antes de la llamada
    try {
      // Usamos el nuevo método getAllPublicProducts() del ImageService
      const fetchedProducts = await lastValueFrom(this.imageService.getAllPublicProducts());

      if (fetchedProducts) {
        this.products = fetchedProducts;
        this.filteredProducts = [...this.products]; // Inicializar filteredProducts
        console.log('HomeProductsComponent: Productos cargados:', this.products);
      } else {
        this.products = [];
        this.filteredProducts = [];
        console.log('HomeProductsComponent: La carga de productos no devolvió datos.');
      }
    } catch (error) {
      console.error('HomeProductsComponent: Error al cargar productos:', error);
      this.products = []; // Asegurarse de que el array esté vacío en caso de error
      this.filteredProducts = [];
    } finally {
      this.generalService.hide(); // Ocultar spinner o indicador de carga
    }
  }

  filterProducts() {
    if (!this.searchTerm) {
      this.filteredProducts = [...this.products];
    } else {
      this.filteredProducts = this.products.filter(product =>
        product.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  openProductDetailsModal(product: any) {
    this.ref = this.dialogService.open(HomeProductModalComponent, {
      data: { product: product }, // Pasamos el objeto producto completo al modal
      header: product.name,
      width: '40%',
      modal: true,
      closable: true
    });

    this.ref.onClose.subscribe((data: any) => {
      // Lógica a ejecutar cuando el modal se cierra
      console.log('Modal de producto cerrado, datos de retorno (si los hay):', data);
    });
  }
}