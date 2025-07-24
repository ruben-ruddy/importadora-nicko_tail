import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Para directivas como ngIf
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog'; // Para manejar el modal dinámico
import { ButtonModule } from 'primeng/button'; // Para el botón de cerrar

// Importa aquí cualquier otra interfaz o tipo si tienes una estructura de producto más definida
// import { ProductDetail } from '../../../../interfaces/product.interface'; // Ejemplo

@Component({
  selector: 'app-home-product-modal',
  standalone: true, // Indica que este es un componente standalone
  imports: [
    CommonModule, // Necesario para directivas comunes de Angular (ej. *ngIf)
    ButtonModule, // Módulo para el componente p-button de PrimeNG
    // Puedes comentar o eliminar estos si no los necesitas en el modal
    // InputTextModule,
    // FormsModule
  ],
  templateUrl: './home-product-modal.component.html',
  styleUrls: ['./home-product-modal.component.scss'] // O styleUrl si es un solo archivo
})
export class HomeProductModalComponent implements OnInit {
  // La propiedad 'product' contendrá los detalles del producto pasados al modal
  // Considera tiparla de forma más específica si tienes una interfaz `ProductDetail`
  product: any; // O product: ProductDetail;

  constructor(
    public ref: DynamicDialogRef, // Referencia para cerrar el modal
    public config: DynamicDialogConfig // Para acceder a los datos pasados al modal
  ) { }

  ngOnInit(): void {
    // Verifica si se han pasado datos y si contienen un objeto 'product'
    if (this.config.data && this.config.data.product) {
      this.product = this.config.data.product;
      console.log('HomeProductModalComponent: Producto recibido en el modal:', this.product);

      // Puedes añadir más logs para depuración aquí, por ejemplo:
      // console.log('HomeProductModalComponent: URL de imagen del producto:', this.product.imageUrl);
    } else {
      console.warn('HomeProductModalComponent: No se recibieron datos de producto en el modal.');
    }
  }

  // Método para cerrar el modal
  closeModal(): void {
    this.ref.close(); // Cierra el modal, opcionalmente puedes pasar datos de vuelta
  }
}