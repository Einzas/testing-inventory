import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService, CustomerService, InvoiceService } from '../../core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  stats = signal({
    totalProducts: 0,
    lowStockProducts: 0,
    totalCustomers: 0,
    totalInvoices: 0,
    totalAmount: 0,
    pendingInvoices: 0,
    paidInvoices: 0
  });

  lowStockProducts = signal<any[]>([]);
  recentInvoices = signal<any[]>([]);
  isLoading = signal(true);

  constructor(
    private productService: ProductService,
    private customerService: CustomerService,
    private invoiceService: InvoiceService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.isLoading.set(true);

    // Load dashboard statistics
    Promise.all([
      this.productService.getProducts().toPromise(),
      this.productService.getLowStockProducts().toPromise(),
      this.customerService.getCustomers().toPromise(),
      this.invoiceService.getDashboardStats().toPromise(),
      this.invoiceService.getInvoices({ limit: 5 }).toPromise()
    ]).then(([products, lowStock, customers, invoiceStats, recentInvoices]) => {
      this.stats.set({
        totalProducts: products?.total || 0,
        lowStockProducts: lowStock?.length || 0,
        totalCustomers: customers?.total || 0,
        totalInvoices: invoiceStats?.totalInvoices || 0,
        totalAmount: invoiceStats?.totalAmount || 0,
        pendingInvoices: invoiceStats?.pendingInvoices || 0,
        paidInvoices: invoiceStats?.paidInvoices || 0
      });

      this.lowStockProducts.set(lowStock || []);
      this.recentInvoices.set(recentInvoices?.data || []);
      this.isLoading.set(false);
    }).catch(error => {
      console.error('Error loading dashboard data:', error);
      this.isLoading.set(false);
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'badge bg-success';
      case 'issued':
        return 'badge bg-warning';
      case 'cancelled':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  getStatusText(status: string): string {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'Pagado';
      case 'issued':
        return 'Emitido';
      case 'cancelled':
        return 'Anulado';
      default:
        return status;
    }
  }
}
