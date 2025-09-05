import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { GeneralService } from '../../core/gerneral.service';
import { ApiService } from '../../project/services/api.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  public user: any;
  public navItems: any;
  
  @Input() isMenuOpen = false;
  @Output() sidebarToggled = new EventEmitter<boolean>();

  constructor(private generalService: GeneralService, private service: ApiService) {}

  ngOnInit(): void {
    this.user = this.generalService.getUser();
    this.loadNavItems();
  }

  loadNavItems() {
    if (this.user?.role?.nombre_rol == "Administrador") {
      this.navItems = [
        { path: 'products', title: 'Productos' },
        { path: 'category', title: 'Categorías' },
        { path: 'users', title: 'Usuarios' },
        { path: 'clients', title: 'Clientes' },
        { path: 'sale', title: 'Ventas' },
        { path: 'purchase', title: 'Compras' },
        { path: 'forecast', title: 'Pronostico' },
        { path: 'reportes', title: 'Reportes de Ventas'}
      ];
    } else if (this.user?.role?.nombre_rol == "Almacenero") {
      
      this.navItems = [
        { path: 'products', title: 'Productos' },
        { path: 'purchase', title: 'Compras' },
      ];
    }else if (this.user?.role?.nombre_rol == "Vendedor") {
      this.navItems = [
        { path: 'sale', title: 'Ventas' }
      ];
  }
}
  closeMenu() {
    this.sidebarToggled.emit(false);
  }

  toggleMenu() {
    this.sidebarToggled.emit(!this.isMenuOpen);
  }

  logout() {
    this.service.logout();
  }
}