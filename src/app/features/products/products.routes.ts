import { Routes } from '@angular/router';

export const productsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./product-list/product-list.component').then(c => c.ProductListComponent)
  },
  {
    path: 'categories',
    loadComponent: () => import('./categories/categories.component').then(c => c.CategoriesComponent)
  },
  {
    path: 'kardex',
    loadComponent: () => import('./kardex/kardex.component').then(c => c.KardexComponent)
  },
  {
    path: 'low-stock',
    loadComponent: () => import('./low-stock/low-stock.component').then(c => c.LowStockComponent)
  }
];
