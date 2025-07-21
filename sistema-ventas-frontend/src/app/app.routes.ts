import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';


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
        title: 'Principal'
    },
    {
        path: 'home',
        loadChildren: () => import('./modules/home/home.routes').then(m => m.routes),
        canActivate: [authGuard] ,
        title: 'home'
    },
];