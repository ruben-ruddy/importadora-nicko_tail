import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { GeneralService } from '../../core/gerneral.service';
import { ApiService } from '../../project/services/api.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive,RouterOutlet],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
public user:any
public navItems:any
isMenuOpen = false;
constructor(private generalService:GeneralService, private service:ApiService){

}

ngOnInit(): void {
 this.user =  this.generalService.getUser()
 if(this.user?.role?.nombre_rol =="Administrador"){
 this.navItems= [
    {
      path: 'products',
      title: 'Productos',
      activeClass: 'border-indigo-500 text-gray-900',
      inactiveClass: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
    },
    {
      path: 'category',
      title: 'Categorías',
      activeClass: 'border-indigo-500 text-gray-900',
      inactiveClass: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
    },

    {
      path: 'user',
      title: 'Usuarios',
      activeClass: 'border-indigo-500 text-gray-900',
      inactiveClass: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
    },

    {
      path: 'client',
      title: 'Clientes',
      activeClass: 'border-indigo-500 text-gray-900',
      inactiveClass: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
    },

    {
      path: 'sale',
      title: 'Ventas',
      activeClass: 'border-indigo-500 text-gray-900',
      inactiveClass: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
    },

    {
      path: 'parchase',
      title: 'Compras',
      activeClass: 'border-indigo-500 text-gray-900',
      inactiveClass: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
    },

    {
      path: 'style',
      title: 'Estilos',
      activeClass: 'border-indigo-500 text-gray-900',
      inactiveClass: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
    },
   
  ];
 }else{
this.navItems= [
  
    {
      path: 'sale',
      title: 'Ventas',
      activeClass: 'border-indigo-500 text-gray-900',
      inactiveClass: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
    },
    {
      path: 'style',
      title: 'Estilos',
      activeClass: 'border-indigo-500 text-gray-900',
      inactiveClass: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
    }
  ];

 }
 

  
}

logout() {
this.service.logout();
}
 
}