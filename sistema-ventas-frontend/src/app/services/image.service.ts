// src/app/services/image.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators'; // Importa 'map'
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  
  private apiUrl = 'http://localhost:3000/api/public/products/latest-images'; 
  // ¡Define la URL base de tu servidor donde se sirven las imágenes!
  private serverBaseUrl = 'http://localhost:3000'; // <--- ¡AÑADE ESTO!

  constructor(private http: HttpClient) { }

  getLatestProductImages(): Observable<string[]> {
    console.log('ImageService: Realizando petición a:', this.apiUrl);
    return this.http.get<string[]>(this.apiUrl).pipe(
      tap(data => console.log('ImageService: Datos recibidos (antes de procesar):', data)),
      map(data => {
        // Mapea cada ruta para añadir la URL base del servidor
        const fullImageUrls = data.map(path => `${this.serverBaseUrl}${path}`);
        //console.log('ImageService: URLs de imágenes completas:', fullImageUrls);
        return fullImageUrls;
      }),
      catchError(error => {
       // console.error('ImageService: Error al obtener imágenes:', error);
        return of([]);
      })
    );
  }
}