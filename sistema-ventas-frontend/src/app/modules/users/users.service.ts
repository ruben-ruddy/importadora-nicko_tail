// sistema-ventas-frontend/src/app/modules/users/users.service.ts
import { Injectable } from '@angular/core';
import { GeneralService } from '../../core/gerneral.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  constructor(
    private http: HttpClient,
    private generalService: GeneralService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getUsers(query: any = {}) {
    let params = new HttpParams();
    
    // Agregar parámetros de consulta
    Object.keys(query).forEach(key => {
      if (query[key] !== undefined && query[key] !== null && query[key] !== '') {
        params = params.set(key, query[key]);
      }
    });

    return firstValueFrom(this.http.get(`${environment.backend}/users`, { 
      params,
      headers: this.getHeaders() 
    }));
  }

  createUsers(data: any) {
    return firstValueFrom(this.http.post(`${environment.backend}/users`, data, {
      headers: this.getHeaders()
    }));
  }

  updateUsers(id: string, data: any) {
    return firstValueFrom(this.http.patch(`${environment.backend}/users/${id}`, data, {
      headers: this.getHeaders()
    }));
  }

deleteUser(id: string) {
  return firstValueFrom(this.http.delete(`${environment.backend}/users/${id}`, {
    headers: this.getHeaders()
  }));
}

  getRoles() {
    return firstValueFrom(this.http.get(`${environment.backend}/roles`, {
      headers: this.getHeaders()
    }));
  }
}