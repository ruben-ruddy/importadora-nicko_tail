import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  
  // URL de tu API para obtener las imágenes. ¡Reemplázala!
  private apiUrl = 'http://localhost:3000/api/images'; 

  constructor(private http: HttpClient) { }

  getImages(): Observable<any> {
    return this.http.get(this.apiUrl);
  }
}