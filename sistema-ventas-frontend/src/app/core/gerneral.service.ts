// sistema-ventas-frontend/src/app/core/gerneral.service.ts
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
//Servicio general para manejar el token de autenticación y el estado de carga
export class GeneralService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // Guarda el token y los datos del usuario en el almacenamiento local
  setSaveToken(data: any) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(environment.appCode + '.token', data.accessToken);
      localStorage.setItem(environment.appCode + '.userData',  JSON.stringify(data.user));
    }
  }

  // Recupera el token del almacenamiento local
  getToken() {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(environment.appCode + '.token');
    }
    return null; 
  }

  // Elimina el token y los datos del usuario del almacenamiento local
  logout(){
    if (isPlatformBrowser(this.platformId)) {
       localStorage.removeItem(environment.appCode + '.token');
       localStorage.removeItem(environment.appCode + '.userData');
    }
    return null; 
  }
  
  // Recupera los datos del usuario del almacenamiento local
   getUser() {
    if (isPlatformBrowser(this.platformId)) {
       const user = localStorage.getItem(environment.appCode + '.userData');
      if (user) {
       return JSON.parse(user);
       } else {
        // Maneja el caso cuando no hay datos en localStorage
       return null; 
     }
    }
    return null; 
  }


// Métodos para mostrar y ocultar el estado de carga
  show() {
    this.loadingSubject.next(true);
  }

  hide() {
    this.loadingSubject.next(false);
  }


}