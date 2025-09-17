import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductService } from '../../../core/services/product.service';
import { Product, ProductFilter, Category } from '../../../core/models';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  // Signals for state management
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  isLoading = signal(false);
  searchTerm = signal('');
  categoryFilter = signal('');
  statusFilter = signal('');
  stockFilter = signal('');
  currentPage = signal(1);
  pageSize = signal(12);
  totalItems = signal(0);

  // Modal states
  showModal = signal(false);
  showDeleteModal = signal(false);
  submitting = signal(false);
  editingProduct = signal<Product | null>(null);
  productToDelete = signal<Product | null>(null);

  // Form signals
  productForm!: FormGroup;

  // Computed properties
  totalProducts = computed(() => this.products().length);
  activeProducts = computed(() => this.products().filter(p => p.isActive).length);
  lowStockProducts = computed(() => this.products().filter(p => p.stock <= p.minStock).length);
  totalValue = computed(() => this.products().reduce((sum, p) => sum + (p.price * p.stock), 0));
  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));
  
  filteredProducts = computed(() => {
    let filtered = this.products();
    
    // Apply search filter
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(search) ||
        product.description?.toLowerCase().includes(search) ||
        product.code.toLowerCase().includes(search)
      );
    }
    
    // Apply category filter
    const category = this.categoryFilter();
    if (category) {
      filtered = filtered.filter(product => product.categoryId === category);
    }
    
    // Apply status filter
    const status = this.statusFilter();
    if (status === 'active') {
      filtered = filtered.filter(product => product.isActive);
    } else if (status === 'inactive') {
      filtered = filtered.filter(product => !product.isActive);
    }
    
    // Apply stock filter
    const stock = this.stockFilter();
    if (stock === 'low') {
      filtered = filtered.filter(product => product.stock <= product.minStock);
    } else if (stock === 'out') {
      filtered = filtered.filter(product => product.stock <= 0);
    }
    
    return filtered;
  });

  hasFilters = computed(() => 
    this.searchTerm() !== '' || 
    this.categoryFilter() !== '' || 
    this.statusFilter() !== '' || 
    this.stockFilter() !== ''
  );

  constructor(
    private productService: ProductService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  private initForm(): void {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      code: ['', [Validators.required]],
      categoryId: ['', [Validators.required]],
      price: [0, [Validators.required, Validators.min(0)]],
      cost: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      minStock: [0, [Validators.required, Validators.min(0)]],
      unit: ['UNIDAD', [Validators.required]],
      barcode: [''],
      isActive: [true]
    });
  }

  loadProducts(): void {
    this.isLoading.set(true);
    const filter: ProductFilter = {
      page: this.currentPage(),
      limit: this.pageSize()
    };

    this.productService.getProducts(filter).subscribe({
      next: (response) => {
        this.products.set(response.data);
        this.totalItems.set(response.total);
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

  // Event handlers
  onSearchChange(): void {
    this.currentPage.set(1);
  }

  onFilterChange(): void {
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.categoryFilter.set('');
    this.statusFilter.set('');
    this.stockFilter.set('');
    this.currentPage.set(1);
  }

  // Modal methods
  openCreateModal(): void {
    this.editingProduct.set(null);
    this.productForm.reset();
    this.productForm.patchValue({ isActive: true, unit: 'UNIDAD' });
    this.showModal.set(true);
  }

  editProduct(product: Product): void {
    this.editingProduct.set(product);
    this.productForm.patchValue(product);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingProduct.set(null);
    this.productForm.reset();
  }

  onSubmit(): void {
    if (this.productForm.valid) {
      this.submitting.set(true);
      const formData = this.productForm.value;
      
      if (this.editingProduct()) {
        this.updateProduct(this.editingProduct()!.id, formData);
      } else {
        this.createProduct(formData);
      }
    }
  }

  private createProduct(productData: Partial<Product>): void {
    this.productService.createProduct(productData).subscribe({
      next: (newProduct) => {
        this.products.update(products => [...products, newProduct]);
        this.closeModal();
        this.submitting.set(false);
      },
      error: (error) => {
        console.error('Error creating product:', error);
        this.submitting.set(false);
      }
    });
  }

  private updateProduct(id: string, productData: Partial<Product>): void {
    this.productService.updateProduct(id, productData).subscribe({
      next: (updatedProduct) => {
        this.products.update(products => 
          products.map(p => p.id === id ? updatedProduct : p)
        );
        this.closeModal();
        this.submitting.set(false);
      },
      error: (error) => {
        console.error('Error updating product:', error);
        this.submitting.set(false);
      }
    });
  }

  deleteProduct(product: Product): void {
    this.productToDelete.set(product);
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    const product = this.productToDelete();
    if (product) {
      this.submitting.set(true);
      this.productService.deleteProduct(product.id).subscribe({
        next: () => {
          this.products.update(products => 
            products.filter(p => p.id !== product.id)
          );
          this.cancelDelete();
          this.submitting.set(false);
        },
        error: (error) => {
          console.error('Error deleting product:', error);
          this.submitting.set(false);
        }
      });
    }
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.productToDelete.set(null);
  }

  toggleProductStatus(product: Product): void {
    this.updateProduct(product.id, { isActive: !product.isActive });
  }

  viewKardex(product: Product): void {
    // Implementation for viewing kardex
    console.log('View kardex for:', product.name);
  }

  // Pagination methods
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadProducts();
    }
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);
    
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  // Utility methods
  getCategoryName(categoryId: string): string {
    const category = this.categories().find(c => c.id === categoryId);
    return category?.name || 'Sin categoría';
  }

  getStockStatusClass(product: Product): string {
    if (product.stock <= 0) return 'bg-danger';
    if (product.stock <= product.minStock) return 'bg-warning';
    return 'bg-success';
  }

  getStockStatusText(product: Product): string {
    if (product.stock <= 0) return 'Sin stock';
    if (product.stock <= product.minStock) return 'Stock bajo';
    return 'Stock normal';
  }

  loading = this.isLoading;
}
