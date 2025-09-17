import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, switchMap, combineLatest } from 'rxjs';
import { ProductService } from './product.service';
import { CustomerService } from './customer.service';
import { InvoiceService } from './invoice.service';

export interface SalesReport {
  totalSales: number;
  totalInvoices: number;
  averageTicket: number;
  salesByMonth: MonthlyData[];
  topProducts: TopProduct[];
  salesByCategory: CategorySales[];
}

export interface InventoryReport {
  totalProducts: number;
  totalValue: number;
  lowStockProducts: number;
  stockByCategory: CategoryStock[];
  topSellingProducts: TopProduct[];
  slowMovingProducts: TopProduct[];
}

export interface CustomerReport {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  topCustomers: TopCustomer[];
  customersByType: CustomerTypeData[];
  customersByCity: CityData[];
}

export interface MonthlyData {
  month: string;
  value: number;
  invoiceCount?: number;
}

export interface TopProduct {
  id: string;
  name: string;
  value: number;
  quantity?: number;
}

export interface CategorySales {
  categoryName: string;
  sales: number;
  percentage: number;
}

export interface CategoryStock {
  categoryName: string;
  products: number;
  value: number;
}

export interface TopCustomer {
  id: string;
  name: string;
  totalPurchases: number;
  invoiceCount: number;
}

export interface CustomerTypeData {
  type: string;
  count: number;
  percentage: number;
}

export interface CityData {
  city: string;
  customers: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  constructor(
    private productService: ProductService,
    private customerService: CustomerService,
    private invoiceService: InvoiceService
  ) {}

  getSalesReport(startDate?: Date, endDate?: Date): Observable<SalesReport> {
    return combineLatest([
      this.invoiceService.getInvoices(),
      this.productService.getProducts(),
      this.productService.getCategories()
    ]).pipe(
      delay(1000),
      switchMap(([invoicesResponse, productsResponse, categories]) => {
        const invoices = invoicesResponse.data;
        const products = productsResponse.data;
        
        // Filter by date range if provided
        let filteredInvoices = invoices;
        if (startDate || endDate) {
          filteredInvoices = invoices.filter(invoice => {
            const invoiceDate = new Date(invoice.createdAt);
            if (startDate && invoiceDate < startDate) return false;
            if (endDate && invoiceDate > endDate) return false;
            return true;
          });
        }

        const totalSales = filteredInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
        const totalInvoices = filteredInvoices.length;
        const averageTicket = totalInvoices > 0 ? totalSales / totalInvoices : 0;

        // Sales by month (last 12 months)
        const salesByMonth = this.generateMonthlySalesData(filteredInvoices);

        // Top products by sales
        const productSales = new Map<string, number>();
        filteredInvoices.forEach(invoice => {
          invoice.items.forEach(item => {
            const current = productSales.get(item.productId) || 0;
            productSales.set(item.productId, current + (item.quantity * item.unitPrice));
          });
        });

        const topProducts: TopProduct[] = Array.from(productSales.entries())
          .map(([productId, sales]) => {
            const product = products.find(p => p.id === productId);
            return {
              id: productId,
              name: product?.name || 'Producto desconocido',
              value: sales
            };
          })
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);

        // Sales by category
        const categorySales = new Map<string, number>();
        filteredInvoices.forEach(invoice => {
          invoice.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
              const category = categories.find(c => c.id === product.categoryId);
              const categoryName = category?.name || 'Sin categoría';
              const current = categorySales.get(categoryName) || 0;
              categorySales.set(categoryName, current + (item.quantity * item.unitPrice));
            }
          });
        });

        const salesByCategory: CategorySales[] = Array.from(categorySales.entries())
          .map(([categoryName, sales]) => ({
            categoryName,
            sales,
            percentage: totalSales > 0 ? (sales / totalSales) * 100 : 0
          }))
          .sort((a, b) => b.sales - a.sales);

        const report: SalesReport = {
          totalSales,
          totalInvoices,
          averageTicket,
          salesByMonth,
          topProducts,
          salesByCategory
        };

        return of(report);
      })
    );
  }

  getInventoryReport(): Observable<InventoryReport> {
    return combineLatest([
      this.productService.getProducts(),
      this.productService.getCategories(),
      this.productService.getLowStockProducts()
    ]).pipe(
      delay(800),
      switchMap(([productsResponse, categories, lowStock]) => {
        const products = productsResponse.data;
        
        const totalProducts = products.length;
        const totalValue = products.reduce((sum, product) => sum + (product.stock * product.cost), 0);
        const lowStockProducts = lowStock.length;

        // Stock by category
        const categoryStockMap = new Map<string, { products: number; value: number }>();
        products.forEach(product => {
          const category = categories.find(c => c.id === product.categoryId);
          const categoryName = category?.name || 'Sin categoría';
          const current = categoryStockMap.get(categoryName) || { products: 0, value: 0 };
          current.products += 1;
          current.value += product.stock * product.cost;
          categoryStockMap.set(categoryName, current);
        });

        const stockByCategory: CategoryStock[] = Array.from(categoryStockMap.entries())
          .map(([categoryName, data]) => ({
            categoryName,
            products: data.products,
            value: data.value
          }))
          .sort((a, b) => b.value - a.value);

        // Top selling products (mock data - in real app would come from sales data)
        const topSellingProducts: TopProduct[] = products
          .filter(p => p.isActive)
          .sort((a, b) => (b.stock - b.minStock) - (a.stock - a.minStock))
          .slice(0, 10)
          .map(product => ({
            id: product.id,
            name: product.name,
            value: product.stock * product.price,
            quantity: product.stock
          }));

        // Slow moving products (high stock relative to min stock)
        const slowMovingProducts: TopProduct[] = products
          .filter(p => p.isActive && p.stock > p.maxStock * 0.8)
          .sort((a, b) => (b.stock / b.maxStock) - (a.stock / a.maxStock))
          .slice(0, 10)
          .map(product => ({
            id: product.id,
            name: product.name,
            value: product.stock * product.cost,
            quantity: product.stock
          }));

        const report: InventoryReport = {
          totalProducts,
          totalValue,
          lowStockProducts,
          stockByCategory,
          topSellingProducts,
          slowMovingProducts
        };

        return of(report);
      })
    );
  }

  getCustomerReport(): Observable<CustomerReport> {
    return combineLatest([
      this.customerService.getCustomers(),
      this.invoiceService.getInvoices()
    ]).pipe(
      delay(600),
      switchMap(([customersResponse, invoicesResponse]) => {
        const customers = customersResponse.data;
        const invoices = invoicesResponse.data;
        
        const totalCustomers = customers.length;
        const activeCustomers = customers.filter(c => c.isActive).length;
        
        // New customers this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newCustomersThisMonth = customers.filter(c => 
          new Date(c.createdAt) >= startOfMonth
        ).length;

        // Top customers by purchase amount
        const customerPurchases = new Map<string, { total: number; count: number }>();
        invoices.forEach(invoice => {
          const current = customerPurchases.get(invoice.customerId) || { total: 0, count: 0 };
          current.total += invoice.totalAmount;
          current.count += 1;
          customerPurchases.set(invoice.customerId, current);
        });

        const topCustomers: TopCustomer[] = Array.from(customerPurchases.entries())
          .map(([customerId, data]) => {
            const customer = customers.find(c => c.id === customerId);
            const name = customer 
              ? (customer.type === 'INDIVIDUAL' 
                ? `${customer.firstName} ${customer.lastName}` 
                : customer.businessName || '')
              : 'Cliente desconocido';
            return {
              id: customerId,
              name,
              totalPurchases: data.total,
              invoiceCount: data.count
            };
          })
          .sort((a, b) => b.totalPurchases - a.totalPurchases)
          .slice(0, 10);

        // Customers by type
        const individualCount = customers.filter(c => c.type === 'INDIVIDUAL').length;
        const businessCount = customers.filter(c => c.type === 'BUSINESS').length;
        
        const customersByType: CustomerTypeData[] = [
          {
            type: 'Personas',
            count: individualCount,
            percentage: totalCustomers > 0 ? (individualCount / totalCustomers) * 100 : 0
          },
          {
            type: 'Empresas',
            count: businessCount,
            percentage: totalCustomers > 0 ? (businessCount / totalCustomers) * 100 : 0
          }
        ];

        // Customers by city
        const cityMap = new Map<string, number>();
        customers.forEach(customer => {
          const city = customer.city || 'No especificado';
          cityMap.set(city, (cityMap.get(city) || 0) + 1);
        });

        const customersByCity: CityData[] = Array.from(cityMap.entries())
          .map(([city, customers]) => ({ city, customers }))
          .sort((a, b) => b.customers - a.customers)
          .slice(0, 10);

        const report: CustomerReport = {
          totalCustomers,
          activeCustomers,
          newCustomersThisMonth,
          topCustomers,
          customersByType,
          customersByCity
        };

        return of(report);
      })
    );
  }

  private generateMonthlySalesData(invoices: any[]): MonthlyData[] {
    const monthlyData = new Map<string, { value: number; count: number }>();
    
    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      monthlyData.set(key, { value: 0, count: 0 });
    }

    // Aggregate invoice data
    invoices.forEach(invoice => {
      const date = new Date(invoice.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = monthlyData.get(key);
      if (current) {
        current.value += invoice.totalAmount;
        current.count += 1;
      }
    });

    // Convert to array
    return Array.from(monthlyData.entries()).map(([key, data]) => {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return {
        month: date.toLocaleDateString('es-ES', { month: 'short' }),
        value: data.value,
        invoiceCount: data.count
      };
    });
  }
}
