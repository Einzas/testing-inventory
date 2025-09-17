import { Routes } from '@angular/router';
import { authGuard } from './core';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(r => r.authRoutes)
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(c => c.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(c => c.DashboardComponent)
      },
      {
        path: 'products',
        loadChildren: () => import('./features/products/products.routes').then(r => r.productsRoutes)
      },
      {
        path: 'customers',
        loadChildren: () => import('./features/customers/customers.routes').then(r => r.customersRoutes)
      },
      {
        path: 'invoicing',
        loadChildren: () => import('./features/invoicing/invoicing.routes').then(r => r.invoicingRoutes)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
