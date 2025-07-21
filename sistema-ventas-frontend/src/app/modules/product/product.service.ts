import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GeneralService } from '../../core/gerneral.service';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor( private http: HttpClient,
    private generalService: GeneralService) { }

       getProducts() {
        return firstValueFrom(this.http.get(`${environment.backend}/productos`));
       }

       createProducts(data:any) {
        return firstValueFrom(this.http.post(`${environment.backend}/productos`, data));
      }

       updateProducts(id:string,data:any) {
        return firstValueFrom(this.http.patch(`${environment.backend}/productos/${id}`, data));
      }

      getCategories() {
        return firstValueFrom(this.http.get(`${environment.backend}/categorias`));
      } 

       getMarca() {
        return firstValueFrom(this.http.get(`${environment.backend}/marca`));
      } 
}
