import { Routes } from '@angular/router';

export const invoicingRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./invoice-list/invoice-list.component').then(c => c.InvoiceListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./invoice-form/invoice-form.component').then(c => c.InvoiceFormComponent)
  },
  {
    path: 'boletas',
    loadComponent: () => import('./boleta-list/boleta-list.component').then(c => c.BoletaListComponent)
  }
];
