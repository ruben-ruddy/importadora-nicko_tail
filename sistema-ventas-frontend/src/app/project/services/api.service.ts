//sistema-ventas-frontend/src/app/project/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom, Observable, tap } from 'rxjs';
import { GeneralService } from '../../core/gerneral.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(
    private http: HttpClient,
    private generalService: GeneralService,
    private router: Router
  ) {}

  private get url(): string {
    return environment.backend;
  }

  //  Método de login
      login(credentials: { nombre_usuario: string, password: string }) {
        return this.http.post(`${environment.backend}/auth/login`, credentials, {
        }).pipe(
          tap((response: any) => {
            console.log(response);
            if (response.accessToken) {
              this.generalService.setSaveToken(response);
              
              
            }
          })
        );
      }
//  Método de logout
      logout() {
      this.generalService.logout();
       this.router.navigate(['/login']);
      }
  // dms
     
      postDms(data:any) {
         return firstValueFrom(this.http.post(`${environment.backend}/dms/upload`, data));
      }

      getDmsById(id: string) {
        return firstValueFrom(this.http.get(`${environment.backend}/dms/${id}`));
      }

      getDmsByImgD(id: string) {
        return firstValueFrom(this.http.get(`${environment.backend}/dms/${id}`));
      }





 




}