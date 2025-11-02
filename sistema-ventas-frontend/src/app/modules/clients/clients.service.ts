// sistema-ventas-frontend/src/app/modules/clients/clients.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientsService {

    constructor(private http: HttpClient) { }

    // Obtener la lista de clientes con paginación y búsqueda
    getClients(page: number = 1, limit: number = 10, search: string = '') {
      let params = new HttpParams()
        .set('page', page.toString())
        .set('limit', limit.toString());
      
      if (search) {
        params = params.set('search', search);
      }
      
      return firstValueFrom(this.http.get(`${environment.backend}/clients`, { params }));
    }

    // Crear un nuevo cliente
    createClients(data: any) {
      return firstValueFrom(this.http.post(`${environment.backend}/clients`, data));
    }

    // Actualizar un cliente por ID
    updateClients(id: string, data: any) {
      return firstValueFrom(this.http.patch(`${environment.backend}/clients/${id}`, data));
    }

    // Eliminar un cliente por ID
    deleteClients(id: string) {
      return firstValueFrom(this.http.delete(`${environment.backend}/clients/${id}`));
    }
}