// sistema-ventas-frontend/src/app/modules/users/users.service.ts
import { Injectable } from '@angular/core';
import { GeneralService } from '../../core/gerneral.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
    constructor( private http: HttpClient,
    private generalService: GeneralService) { }

      
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token'); // Ajusta según tu storage
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
       getUsers() {
        console.log('Fetching useer from backend:', environment.backend);
        return firstValueFrom(this.http.get(`${environment.backend}/users`));
       }

       createUsers(data:any) {
        return firstValueFrom(this.http.post(`${environment.backend}/users`, data));
      }

       updateUsers(id:string,data:any) {
        return firstValueFrom(this.http.patch(`${environment.backend}/users/${id}`, data));
      }

      getRoles() {
        return firstValueFrom(this.http.get(`${environment.backend}/roles`));
      } 

}
