import { Component, input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../core';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  badge?: string;
  badgeClass?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbCollapse],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  isCollapsed = input<boolean>(false);
  currentUser = computed(() => this.authService.currentUser());

  // Collapse states for menu items
  collapseStates = signal<{[key: string]: boolean}>({
    'productos': false,
    'clientes': false,
    'facturacion': false,
    'reportes': false
  });

  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'fas fa-tachometer-alt',
      route: '/dashboard'
    },
    {
      label: 'Productos',
      icon: 'fas fa-boxes',
      children: [
        { label: 'Lista de Productos', icon: 'fas fa-list', route: '/products' },
        { label: 'Categorías', icon: 'fas fa-tags', route: '/products/categories' },
        { label: 'Kardex', icon: 'fas fa-clipboard-list', route: '/products/kardex' },
        { label: 'Stock Bajo', icon: 'fas fa-exclamation-triangle', route: '/products/low-stock', badge: '2', badgeClass: 'bg-warning' }
      ]
    },
    {
      label: 'Clientes',
      icon: 'fas fa-users',
      children: [
        { label: 'Lista de Clientes', icon: 'fas fa-list', route: '/customers' },
        { label: 'Nuevo Cliente', icon: 'fas fa-user-plus', route: '/customers/new' }
      ]
    },
    {
      label: 'Facturación',
      icon: 'fas fa-file-invoice',
      children: [
        { label: 'Nueva Factura', icon: 'fas fa-plus', route: '/invoicing/new' },
        { label: 'Lista de Facturas', icon: 'fas fa-list', route: '/invoicing' },
        { label: 'Boletas', icon: 'fas fa-receipt', route: '/invoicing/boletas' },
        { label: 'Notas de Crédito', icon: 'fas fa-file-invoice-dollar', route: '/invoicing/credit-notes' }
      ]
    },
    {
      label: 'Reportes',
      icon: 'fas fa-chart-bar',
      children: [
        { label: 'Ventas', icon: 'fas fa-chart-line', route: '/reports/sales' },
        { label: 'Inventario', icon: 'fas fa-warehouse', route: '/reports/inventory' },
        { label: 'Clientes', icon: 'fas fa-users', route: '/reports/customers' }
      ]
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  isParentActive(item: MenuItem): boolean {
    if (item.route) {
      return this.isActive(item.route);
    }
    
    if (item.children) {
      return item.children.some(child => child.route && this.isActive(child.route));
    }
    
    return false;
  }

  toggleCollapse(key: string): void {
    this.collapseStates.update(states => ({
      ...states,
      [key]: !states[key]
    }));
  }

  isMenuCollapsed(key: string): boolean {
    return this.collapseStates()[key] || false;
  }
}
