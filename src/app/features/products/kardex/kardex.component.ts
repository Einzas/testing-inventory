import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { Product, Category, KardexEntry } from '../../../core/models';

@Component({
  selector: 'app-kardex',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid p-4">
      <!-- Header -->
      <div class="row mb-4">
        <div class="col">
          <h2 class="h3 mb-1">Kardex de Productos</h2>
          <p class="text-muted">Consulta el movimiento de inventario por producto</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label">Producto</label>
              <select 
                class="form-select"
                [(ngModel)]="selectedProductId"
                (change)="onProductChange()"
              >
                <option value="">Seleccionar producto</option>
                @for (product of products(); track product.id) {
                  <option [value]="product.id">{{ product.name }}</option>
                }
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Fecha Desde</label>
              <input 
                type="date" 
                class="form-control"
                [(ngModel)]="dateFrom"
                (change)="loadKardexEntries()"
              >
            </div>
            <div class="col-md-3">
              <label class="form-label">Fecha Hasta</label>
              <input 
                type="date" 
                class="form-control"
                [(ngModel)]="dateTo"
                (change)="loadKardexEntries()"
              >
            </div>
            <div class="col-md-2 d-flex align-items-end">
              <button class="btn btn-primary w-100" (click)="loadKardexEntries()">
                <i class="fas fa-search me-2"></i>
                Consultar
              </button>
            </div>
          </div>
        </div>
      </div>

      @if (selectedProductId && selectedProduct()) {
        <!-- Product Info -->
        <div class="card mb-4">
          <div class="card-body">
            <div class="row">
              <div class="col-md-3">
                <h6 class="text-muted mb-1">Producto</h6>
                <div class="fw-bold">{{ selectedProduct()!.name }}</div>
                <div class="small text-muted">{{ selectedProduct()!.code }}</div>
              </div>
              <div class="col-md-2">
                <h6 class="text-muted mb-1">Stock Actual</h6>
                <div class="fw-bold text-primary">{{ selectedProduct()!.stock }} {{ selectedProduct()!.unit }}</div>
              </div>
              <div class="col-md-2">
                <h6 class="text-muted mb-1">Costo Promedio</h6>
                <div class="fw-bold">S/ {{ selectedProduct()!.cost | number:'1.2-2' }}</div>
              </div>
              <div class="col-md-2">
                <h6 class="text-muted mb-1">Valor Total</h6>
                <div class="fw-bold text-success">S/ {{ (selectedProduct()!.stock * selectedProduct()!.cost) | number:'1.2-2' }}</div>
              </div>
              <div class="col-md-3">
                <h6 class="text-muted mb-1">Categoría</h6>
                <div class="fw-bold">{{ getCategoryName(selectedProduct()!.categoryId) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Kardex Table -->
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="fas fa-clipboard-list me-2"></i>
              Movimientos de Inventario
            </h5>
          </div>
          <div class="card-body">
            @if (isLoading()) {
              <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Cargando...</span>
                </div>
              </div>
            } @else if (kardexEntries().length === 0) {
              <div class="text-center py-4">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <h6 class="text-muted">No hay movimientos</h6>
                <p class="text-muted">No se encontraron movimientos para el período seleccionado.</p>
              </div>
            } @else {
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Referencia</th>
                      <th>Documento</th>
                      <th class="text-end">Entrada</th>
                      <th class="text-end">Salida</th>
                      <th class="text-end">Saldo</th>
                      <th class="text-end">Costo Unit.</th>
                      <th class="text-end">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (entry of kardexEntries(); track entry.id) {
                      <tr>
                        <td>{{ entry.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                        <td>
                          <span class="badge" [class]="getTypeClass(entry.type)">
                            {{ getTypeName(entry.type) }}
                          </span>
                        </td>
                        <td>{{ entry.reference }}</td>
                        <td>{{ entry.documentType }} - {{ entry.documentNumber }}</td>
                        <td class="text-end">
                          @if (isEntryType(entry.type)) {
                            <span class="text-success fw-bold">{{ entry.quantity }}</span>
                          }
                        </td>
                        <td class="text-end">
                          @if (!isEntryType(entry.type)) {
                            <span class="text-danger fw-bold">{{ entry.quantity }}</span>
                          }
                        </td>
                        <td class="text-end fw-bold">{{ entry.balanceQuantity }}</td>
                        <td class="text-end">S/ {{ entry.unitCost | number:'1.2-2' }}</td>
                        <td class="text-end fw-bold">S/ {{ entry.balanceCost | number:'1.2-2' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="text-center py-5">
          <i class="fas fa-search fa-3x text-muted mb-3"></i>
          <h5 class="text-muted">Selecciona un producto</h5>
          <p class="text-muted">Elige un producto para consultar su kardex de movimientos.</p>
        </div>
      }
    </div>
  `
})
export class KardexComponent implements OnInit {
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  kardexEntries = signal<KardexEntry[]>([]);
  selectedProduct = signal<Product | null>(null);
  isLoading = signal(false);

  selectedProductId = '';
  dateFrom = '';
  dateTo = '';

  constructor(private productService: ProductService) {
    // Set default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    this.dateTo = today.toISOString().split('T')[0];
    this.dateFrom = thirtyDaysAgo.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (response) => {
        this.products.set(response.data);
      },
      error: (error) => {
        console.error('Error loading products:', error);
      }
    });
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  onProductChange(): void {
    if (this.selectedProductId) {
      const product = this.products().find(p => p.id === this.selectedProductId);
      this.selectedProduct.set(product || null);
      this.loadKardexEntries();
    } else {
      this.selectedProduct.set(null);
      this.kardexEntries.set([]);
    }
  }

  loadKardexEntries(): void {
    if (!this.selectedProductId) return;

    this.isLoading.set(true);
    
    // Mock kardex entries for demonstration
    setTimeout(() => {
      const mockEntries: KardexEntry[] = [
        {
          id: '1',
          productId: this.selectedProductId,
          type: 'PURCHASE' as any,
          quantity: 100,
          unitCost: 50,
          totalCost: 5000,
          balanceQuantity: 100,
          balanceCost: 5000,
          reference: 'Compra inicial',
          documentType: 'FACTURA' as any,
          documentNumber: 'F001-0001',
          userId: '1',
          createdAt: new Date('2024-01-01T10:00:00')
        },
        {
          id: '2',
          productId: this.selectedProductId,
          type: 'SALE' as any,
          quantity: 10,
          unitCost: 50,
          totalCost: 500,
          balanceQuantity: 90,
          balanceCost: 4500,
          reference: 'Venta - Cliente ABC',
          documentType: 'FACTURA' as any,
          documentNumber: 'F001-0001',
          userId: '1',
          createdAt: new Date('2024-01-02T14:30:00')
        },
        {
          id: '3',
          productId: this.selectedProductId,
          type: 'ADJUSTMENT' as any,
          quantity: 5,
          unitCost: 50,
          totalCost: 250,
          balanceQuantity: 95,
          balanceCost: 4750,
          reference: 'Ajuste de inventario',
          documentType: 'AJUSTE' as any,
          documentNumber: 'AJ001-0001',
          userId: '1',
          createdAt: new Date('2024-01-03T09:15:00')
        }
      ];

      this.kardexEntries.set(mockEntries);
      this.isLoading.set(false);
    }, 500);
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories().find(c => c.id === categoryId);
    return category?.name || 'Sin categoría';
  }

  getTypeName(type: string): string {
    const types: {[key: string]: string} = {
      'PURCHASE': 'Compra',
      'SALE': 'Venta',
      'ADJUSTMENT': 'Ajuste',
      'TRANSFER': 'Transferencia',
      'PRODUCTION': 'Producción',
      'RETURN': 'Devolución'
    };
    return types[type] || type;
  }

  getTypeClass(type: string): string {
    const classes: {[key: string]: string} = {
      'PURCHASE': 'bg-success',
      'SALE': 'bg-primary',
      'ADJUSTMENT': 'bg-warning',
      'TRANSFER': 'bg-info',
      'PRODUCTION': 'bg-secondary',
      'RETURN': 'bg-danger'
    };
    return classes[type] || 'bg-secondary';
  }

  isEntryType(type: string): boolean {
    return ['PURCHASE', 'ADJUSTMENT', 'PRODUCTION', 'RETURN'].includes(type);
  }
}
