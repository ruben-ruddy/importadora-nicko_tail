// sistema-ventas-frontend/src/app/modules/clients/clients.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientsService {

    constructor(private http: HttpClient) { }

        getClients() {
          return firstValueFrom(this.http.get(`${environment.backend}/clients`));
         }
  
         createClients(data:any) {
          return firstValueFrom(this.http.post(`${environment.backend}/clients`, data));
        }
  
         updateClients(id:string,data:any) {
          return firstValueFrom(this.http.patch(`${environment.backend}/clients/${id}`, data));
        }
  
}
