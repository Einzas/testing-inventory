import { Routes } from '@angular/router';

export const customersRoutes: Routes = [
    /**
     * Rutas de gestión de clientes
     */
  {

    /**
     * Ruta para la lista de clientes
     * Muestra todos los clientes registrados en el sistema.
     * @param {string} id - El ID del cliente a mostrar.
     */
    path: '',
    loadComponent: () => import('./customer-list/customer-list.component').then(c => c.CustomerListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./customer-form/customer-form.component').then(c => c.CustomerFormComponent)
  }
];
