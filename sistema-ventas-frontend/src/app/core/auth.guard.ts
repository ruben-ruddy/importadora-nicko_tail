// sistema-ventas-frontend/src/app/core/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GeneralService } from './gerneral.service';

//Guard para proteger las rutas que requieren autenticación
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
   const storage = inject(GeneralService);
  const isLoggedIn = storage.getToken() ; 

  if (!isLoggedIn) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};