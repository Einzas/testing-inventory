import { Routes } from '@angular/router';
import { loginGuard } from '../../core';

export const authRoutes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(c => c.LoginComponent),
    canActivate: [loginGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component').then(c => c.RegisterComponent),
    canActivate: [loginGuard]
  }
];
