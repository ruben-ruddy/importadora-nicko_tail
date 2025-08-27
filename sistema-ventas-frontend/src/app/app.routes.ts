//src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { HomeProductsComponent } from './modules/home-main/home-products/home-products.component';
import { HomeCategoriesComponent } from './modules/home-main/home-categories/home-categories.component';
import { CategoryProductsComponent } from './modules/home-main/category-products/category-products.component';
import { QuienesSomosComponent } from './modules/home-main/quienes-somos/quienes-somos.component';

export const routes: Routes = [
    { path: '', redirectTo: 'home-main', pathMatch: 'full' },
    {
        path: 'login',
        loadChildren: () => import('./modules/login/login.routes').then(m => m.routes),
        title: 'Login'
    },
    {
        path: 'home-main',
        loadChildren: () => import('./modules/home-main/home-main.routes').then(m => m.routes),
        title: 'Importadora Nicko'
    },
    {
         path: 'products', // La ruta para la nueva página de productos (con buscador, etc.)
                      // Esta ruta no debe colisionar con el módulo 'product' existente si lo tienes
        component: HomeProductsComponent, // Usa el NUEVO componente de productos
          title: 'Productos - Importadora Nicko'
    },
    {
        path: 'home',
        loadChildren: () => import('./modules/home/home.routes').then(m => m.routes),
        canActivate: [authGuard] ,
        title: 'Importadora Nicko'
    },
    { path: 'categories', 
      component: HomeCategoriesComponent, 
      title: 'Categorías'
    },
    {
        path: 'products/:categoryName/:categoryId', // <--- ¡CAMBIO AQUÍ!
        component: CategoryProductsComponent,
        title: 'Productos por Categoría'
    },
    
    { path: 'quienes-somos', 
      component: QuienesSomosComponent,
      title: 'Quiénes Somos'
    }

];