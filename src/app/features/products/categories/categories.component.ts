import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { Category, Product } from '../../../core/models';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class CategoriesComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly formBuilder = inject(FormBuilder);

  // Signals
  categories = signal<Category[]>([]);
  products = signal<Product[]>([]);
  loading = signal(false);
  submitting = signal(false);
  showModal = signal(false);
  showDeleteModal = signal(false);
  editingCategory = signal<Category | null>(null);
  categoryToDelete = signal<Category | null>(null);

  // Filter properties
  searchTerm = '';
  statusFilter = '';

  // Form
  categoryForm: FormGroup;

  // Computed signals
  totalCategories = computed(() => this.categories().length);
  activeCategories = computed(() => this.categories().filter(c => c.isActive).length);
  inactiveCategories = computed(() => this.categories().filter(c => !c.isActive).length);
  totalProducts = computed(() => this.products().length);

  filteredCategories = computed(() => {
    let filtered = this.categories();

    // Apply search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(search) ||
        (category.description && category.description.toLowerCase().includes(search))
      );
    }

    // Apply status filter
    if (this.statusFilter !== '') {
      const isActive = this.statusFilter === 'true';
      filtered = filtered.filter(category => category.isActive === isActive);
    }

    return filtered;
  });

  constructor() {
    this.categoryForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadData();
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      isActive: [true]
    });
  }

  private loadData(): void {
    this.loading.set(true);
    
    // Load categories
    this.productService.getCategories().subscribe({
      next: (categories: Category[]) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading categories:', error);
        this.loading.set(false);
      }
    });

    // Load products for counting
    this.productService.getProducts().subscribe({
      next: (response) => {
        this.products.set(response.data);
      },
      error: (error: any) => {
        console.error('Error loading products:', error);
      }
    });
  }

  getProductCount(categoryId: string): number {
    return this.products().filter(p => p.categoryId === categoryId).length;
  }

  onSearchChange(): void {
    // Trigger reactivity by calling the computed signal
    this.filteredCategories();
  }

  onFilterChange(): void {
    // Trigger reactivity by calling the computed signal
    this.filteredCategories();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.onFilterChange();
  }

  openCreateModal(): void {
    this.editingCategory.set(null);
    this.categoryForm = this.createForm();
    this.showModal.set(true);
  }

  editCategory(category: Category): void {
    this.editingCategory.set(category);
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description,
      isActive: category.isActive
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingCategory.set(null);
    this.categoryForm.reset();
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const formValue = this.categoryForm.value;

    if (this.editingCategory()) {
      // Update existing category
      const updatedCategory: Category = {
        ...this.editingCategory()!,
        ...formValue,
        updatedAt: new Date()
      };

      this.productService.updateCategory(updatedCategory.id, updatedCategory).subscribe({
        next: (category: Category) => {
          const currentCategories = this.categories();
          const index = currentCategories.findIndex(c => c.id === category.id);
          if (index !== -1) {
            currentCategories[index] = category;
            this.categories.set([...currentCategories]);
          }
          this.closeModal();
          this.submitting.set(false);
        },
        error: (error: any) => {
          console.error('Error updating category:', error);
          this.submitting.set(false);
        }
      });
    } else {
      // Create new category
      const newCategory: Omit<Category, 'id'> = {
        ...formValue,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.productService.createCategory(newCategory).subscribe({
        next: (category: Category) => {
          this.categories.set([...this.categories(), category]);
          this.closeModal();
          this.submitting.set(false);
        },
        error: (error: any) => {
          console.error('Error creating category:', error);
          this.submitting.set(false);
        }
      });
    }
  }

  toggleCategoryStatus(category: Category): void {
    const updatedCategory: Category = {
      ...category,
      isActive: !category.isActive,
      updatedAt: new Date()
    };

    this.productService.updateCategory(category.id, updatedCategory).subscribe({
      next: (updated: Category) => {
        const currentCategories = this.categories();
        const index = currentCategories.findIndex(c => c.id === updated.id);
        if (index !== -1) {
          currentCategories[index] = updated;
          this.categories.set([...currentCategories]);
        }
      },
      error: (error: any) => {
        console.error('Error updating category status:', error);
      }
    });
  }

  deleteCategory(category: Category): void {
    // Check if category has products
    if (this.getProductCount(category.id) > 0) {
      alert('No se puede eliminar una categoría que tiene productos asociados.');
      return;
    }

    this.categoryToDelete.set(category);
    this.showDeleteModal.set(true);
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.categoryToDelete.set(null);
  }

  confirmDelete(): void {
    const category = this.categoryToDelete();
    if (!category) return;

    this.submitting.set(true);

    this.productService.deleteCategory(category.id).subscribe({
      next: () => {
        const currentCategories = this.categories();
        const filtered = currentCategories.filter(c => c.id !== category.id);
        this.categories.set(filtered);
        this.cancelDelete();
        this.submitting.set(false);
      },
      error: (error: any) => {
        console.error('Error deleting category:', error);
        this.submitting.set(false);
      }
    });
  }
}
