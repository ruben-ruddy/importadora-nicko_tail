import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { ProductComponent } from '../product/product.component';
import { ExampleCssComponent } from '../example-css/example-css.component';
import { CategoriesComponent } from '../categories/categories.component';
import { ClientsComponent } from '../clients/clients.component';
import { HomeMainComponent } from '../home-main/home-main.component';
import { UsersComponent } from '../users/users.component';
import { SalesComponent } from '../sales/sales.component';
import { ForecastComponent } from '../forecast/forecast.component';
import { PurchaseComponent } from '../purchase/purchase.component';



export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [
      {
        path: '',
        redirectTo: '',
        pathMatch: 'full',
      },     
      {
        path: 'products',
        loadChildren: () => import('../product/produt.routes').then((m) => m.routes),
      },
      {
        path: 'style',
        component: ExampleCssComponent,
      },
      {
        path: 'category',
        component: CategoriesComponent,
      },
      {
        path: 'users',
        component: UsersComponent,
      },
      {
        path: 'clients',
        component: ClientsComponent,
      },
      {
        path: 'sale',
        component: SalesComponent,
      },
      {
        path: 'forecast',
        component: ForecastComponent,
      },
      {
        path: 'purchase',
        component: PurchaseComponent,
      },
      // {
      //   path: 'clients',
      //   component: ClientsComponent,
      // },
      {
        path: 'home-main',
        component: HomeMainComponent,
      },
    ]
  },
  

 
 
];
