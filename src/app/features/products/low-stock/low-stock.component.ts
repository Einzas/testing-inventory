import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { Product, Category } from '../../../core/models';

@Component({
  selector: 'app-low-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container-fluid p-4">
      <!-- Header -->
      <div class="row mb-4">
        <div class="col">
          <h2 class="h3 mb-1">
            <i class="fas fa-exclamation-triangle text-warning me-2"></i>
            Productos con Stock Bajo
          </h2>
          <p class="text-muted">Productos que requieren reabastecimiento</p>
        </div>
        <div class="col-auto">
          <button class="btn btn-primary" routerLink="/products/list">
            <i class="fas fa-arrow-left me-2"></i>
            Volver a Productos
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card border-warning">
            <div class="card-body text-center">
              <i class="fas fa-exclamation-triangle fa-2x text-warning mb-2"></i>
              <h3 class="mb-1">{{ lowStockCount() }}</h3>
              <p class="text-muted mb-0">Stock Bajo</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-danger">
            <div class="card-body text-center">
              <i class="fas fa-times-circle fa-2x text-danger mb-2"></i>
              <h3 class="mb-1">{{ outOfStockCount() }}</h3>
              <p class="text-muted mb-0">Sin Stock</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-info">
            <div class="card-body text-center">
              <i class="fas fa-dollar-sign fa-2x text-info mb-2"></i>
              <h3 class="mb-1">S/ {{ totalValueAtRisk() | number:'1.2-2' }}</h3>
              <p class="text-muted mb-0">Valor en Riesgo</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-success">
            <div class="card-body text-center">
              <i class="fas fa-shopping-cart fa-2x text-success mb-2"></i>
              <h3 class="mb-1">S/ {{ reorderCost() | number:'1.2-2' }}</h3>
              <p class="text-muted mb-0">Costo de Reposición</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label">Buscar</label>
              <input 
                type="text" 
                class="form-control"
                placeholder="Buscar por nombre o código..."
                [(ngModel)]="searchTerm"
              >
            </div>
            <div class="col-md-3">
              <label class="form-label">Categoría</label>
              <select class="form-select" [(ngModel)]="selectedCategory">
                <option value="">Todas las categorías</option>
                @for (category of categories(); track category.id) {
                  <option [value]="category.id">{{ category.name }}</option>
                }
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Estado</label>
              <select class="form-select" [(ngModel)]="selectedStatus">
                <option value="">Todos</option>
                <option value="low">Stock Bajo</option>
                <option value="out">Sin Stock</option>
              </select>
            </div>
            <div class="col-md-2 d-flex align-items-end">
              <button class="btn btn-success w-100" (click)="generateReorderList()">
                <i class="fas fa-file-excel me-2"></i>
                Exportar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Products Table -->
      <div class="card">
        <div class="card-header">
          <h5 class="mb-0">
            <i class="fas fa-list me-2"></i>
            Productos con Stock Bajo ({{ filteredProducts().length }})
          </h5>
        </div>
        <div class="card-body">
          @if (isLoading()) {
            <div class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
            </div>
          } @else if (filteredProducts().length === 0) {
            <div class="text-center py-4">
              <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
              <h6 class="text-muted">¡Excelente!</h6>
              <p class="text-muted">No hay productos con stock bajo en este momento.</p>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="table table-hover">
                <thead class="table-light">
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th class="text-center">Stock Actual</th>
                    <th class="text-center">Stock Mínimo</th>
                    <th class="text-center">Diferencia</th>
                    <th class="text-center">Estado</th>
                    <th class="text-end">Valor Actual</th>
                    <th class="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (product of filteredProducts(); track product.id) {
                    <tr [class.table-warning]="isLowStock(product)" [class.table-danger]="isOutOfStock(product)">
                      <td>
                        <span class="badge bg-secondary">{{ product.code }}</span>
                      </td>
                      <td>
                        <div class="fw-bold">{{ product.name }}</div>
                        <div class="text-muted small">{{ product.description || 'Sin descripción' }}</div>
                      </td>
                      <td>{{ getCategoryName(product.categoryId) }}</td>
                      <td class="text-center">
                        <span class="fw-bold" [class.text-danger]="isOutOfStock(product)" [class.text-warning]="isLowStock(product)">
                          {{ product.stock }}
                        </span>
                        <div class="small text-muted">{{ product.unit }}</div>
                      </td>
                      <td class="text-center">
                        <span class="fw-bold">{{ product.minStock }}</span>
                      </td>
                      <td class="text-center">
                        <span class="fw-bold" [class.text-danger]="getStockDifference(product) < 0">
                          {{ getStockDifference(product) }}
                        </span>
                      </td>
                      <td class="text-center">
                        <span class="badge" [class]="getStatusClass(product)">
                          {{ getStatusText(product) }}
                        </span>
                      </td>
                      <td class="text-end">
                        <div class="fw-bold">S/ {{ (product.stock * product.cost) | number:'1.2-2' }}</div>
                      </td>
                      <td class="text-center">
                        <div class="btn-group" role="group">
                          <button 
                            class="btn btn-sm btn-outline-primary"
                            [routerLink]="['/products/list']"
                            [queryParams]="{edit: product.id}"
                            title="Editar producto"
                          >
                            <i class="fas fa-edit"></i>
                          </button>
                          <button 
                            class="btn btn-sm btn-outline-success"
                            (click)="quickReorder(product)"
                            title="Crear orden de compra"
                          >
                            <i class="fas fa-shopping-cart"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-warning {
      --bs-table-bg: #fff3cd !important;
    }
    .table-danger {
      --bs-table-bg: #f8d7da !important;
    }
    .card {
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
      border: 1px solid rgba(0, 0, 0, 0.125);
    }
    .card-header {
      background-color: #f8f9fa;
      border-bottom: 1px solid rgba(0, 0, 0, 0.125);
    }
  `]
})
export class LowStockComponent implements OnInit {
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  isLoading = signal(false);

  searchTerm = '';
  selectedCategory = '';
  selectedStatus = '';

  // Computed properties
  lowStockProducts = computed(() => {
    return this.products().filter(p => this.isLowStock(p));
  });

  outOfStockProducts = computed(() => {
    return this.products().filter(p => this.isOutOfStock(p));
  });

  lowStockCount = computed(() => this.lowStockProducts().length);
  outOfStockCount = computed(() => this.outOfStockProducts().length);

  totalValueAtRisk = computed(() => {
    return this.lowStockProducts().reduce((total, product) => {
      return total + (product.stock * product.cost);
    }, 0);
  });

  reorderCost = computed(() => {
    return this.lowStockProducts().reduce((total, product) => {
      const neededQuantity = product.minStock - product.stock;
      return total + (neededQuantity > 0 ? neededQuantity * product.cost : 0);
    }, 0);
  });

  filteredProducts = computed(() => {
    let filtered = this.lowStockProducts();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.code.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term)
      );
    }

    if (this.selectedCategory) {
      filtered = filtered.filter(p => p.categoryId === this.selectedCategory);
    }

    if (this.selectedStatus) {
      if (this.selectedStatus === 'low') {
        filtered = filtered.filter(p => this.isLowStock(p) && !this.isOutOfStock(p));
      } else if (this.selectedStatus === 'out') {
        filtered = filtered.filter(p => this.isOutOfStock(p));
      }
    }

    return filtered;
  });

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.productService.getProducts().subscribe({
      next: (response) => {
        this.products.set(response.data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.isLoading.set(false);
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

  isLowStock(product: Product): boolean {
    return product.stock <= product.minStock && product.stock > 0;
  }

  isOutOfStock(product: Product): boolean {
    return product.stock === 0;
  }

  getStockDifference(product: Product): number {
    return product.stock - product.minStock;
  }

  getStatusText(product: Product): string {
    if (this.isOutOfStock(product)) return 'Sin Stock';
    if (this.isLowStock(product)) return 'Stock Bajo';
    return 'Normal';
  }

  getStatusClass(product: Product): string {
    if (this.isOutOfStock(product)) return 'bg-danger';
    if (this.isLowStock(product)) return 'bg-warning';
    return 'bg-success';
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories().find(c => c.id === categoryId);
    return category?.name || 'Sin categoría';
  }

  quickReorder(product: Product): void {
    const neededQuantity = product.minStock - product.stock;
    const orderQuantity = Math.max(neededQuantity, product.minStock);
    
    alert(`Función de reorden rápido para ${product.name}\n\nCantidad sugerida: ${orderQuantity} ${product.unit}\nCosto estimado: S/ ${(orderQuantity * product.cost).toFixed(2)}`);
  }

  generateReorderList(): void {
    const productsToReorder = this.filteredProducts();
    
    if (productsToReorder.length === 0) {
      alert('No hay productos para generar la lista de reorden.');
      return;
    }

    console.log('Generating reorder list for products:', productsToReorder);
    alert(`Lista de reorden generada para ${productsToReorder.length} productos.\n\nEsta función exportaría un archivo Excel con la lista de productos para reorden.`);
  }
}
