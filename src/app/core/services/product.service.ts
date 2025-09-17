import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, switchMap, throwError } from 'rxjs';
import { Product, Category, KardexEntry, ProductFilter, KardexType, DocumentType, PaginatedResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsSignal = signal<Product[]>([]);
  private categoriesSignal = signal<Category[]>([]);

  // Mock data
  private mockCategories: Category[] = [
    {
      id: '1',
      name: 'Electrónicos',
      description: 'Productos electrónicos y tecnológicos',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '2',
      name: 'Oficina',
      description: 'Artículos de oficina y papelería',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '3',
      name: 'Hogar',
      description: 'Productos para el hogar',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  ];

  private mockProducts: Product[] = [
    {
      id: '1',
      code: 'PROD001',
      name: 'Laptop Dell Inspiron',
      description: 'Laptop Dell Inspiron 15 3000, Intel Core i5, 8GB RAM, 256GB SSD',
      categoryId: '1',
      price: 2500.00,
      cost: 2000.00,
      stock: 15,
      minStock: 5,
      maxStock: 50,
      unit: 'UND',
      barcode: '7890123456789',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '2',
      code: 'PROD002',
      name: 'Mouse Inalámbrico',
      description: 'Mouse inalámbrico Logitech M220',
      categoryId: '1',
      price: 45.00,
      cost: 30.00,
      stock: 3,
      minStock: 10,
      maxStock: 100,
      unit: 'UND',
      barcode: '7890123456790',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '3',
      code: 'PROD003',
      name: 'Cuaderno A4',
      description: 'Cuaderno A4 rayado 100 hojas',
      categoryId: '2',
      price: 8.50,
      cost: 5.00,
      stock: 50,
      minStock: 20,
      maxStock: 200,
      unit: 'UND',
      barcode: '7890123456791',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  ];

  private mockKardex: KardexEntry[] = [
    {
      id: '1',
      productId: '1',
      type: KardexType.INPUT,
      quantity: 20,
      unitCost: 2000.00,
      totalCost: 40000.00,
      balanceQuantity: 20,
      balanceCost: 40000.00,
      reference: 'Compra inicial',
      documentType: DocumentType.PURCHASE,
      documentNumber: 'COMP-001',
      userId: '1',
      createdAt: new Date('2024-01-01')
    },
    {
      id: '2',
      productId: '1',
      type: KardexType.OUTPUT,
      quantity: 5,
      unitCost: 2000.00,
      totalCost: 10000.00,
      balanceQuantity: 15,
      balanceCost: 30000.00,
      reference: 'Venta',
      documentType: DocumentType.SALE,
      documentNumber: 'FAC-001',
      userId: '1',
      createdAt: new Date('2024-01-02')
    }
  ];

  constructor() {
    this.productsSignal.set(this.mockProducts);
    this.categoriesSignal.set(this.mockCategories);
  }

  // Signals for reactive state
  products = this.productsSignal.asReadonly();
  categories = this.categoriesSignal.asReadonly();

  getProducts(filter?: ProductFilter): Observable<PaginatedResponse<Product>> {
    return of(null).pipe(
      delay(500),
      switchMap(() => {
        let filteredProducts = [...this.mockProducts];

        if (filter?.search) {
          const searchTerm = filter.search.toLowerCase();
          filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.code.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm)
          );
        }

        if (filter?.categoryId) {
          filteredProducts = filteredProducts.filter(p => p.categoryId === filter.categoryId);
        }

        if (filter?.isActive !== undefined) {
          filteredProducts = filteredProducts.filter(p => p.isActive === filter.isActive);
        }

        if (filter?.lowStock) {
          filteredProducts = filteredProducts.filter(p => p.stock <= p.minStock);
        }

        // Add category information
        filteredProducts = filteredProducts.map(product => ({
          ...product,
          category: this.mockCategories.find(c => c.id === product.categoryId)
        }));

        const page = filter?.page || 1;
        const limit = filter?.limit || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

        const response: PaginatedResponse<Product> = {
          data: paginatedProducts,
          total: filteredProducts.length,
          page,
          limit,
          totalPages: Math.ceil(filteredProducts.length / limit)
        };

        this.productsSignal.set(this.mockProducts);
        return of(response);
      })
    );
  }

  getProduct(id: string): Observable<Product | null> {
    return of(null).pipe(
      delay(300),
      switchMap(() => {
        const product = this.mockProducts.find(p => p.id === id);
        if (product) {
          const productWithCategory = {
            ...product,
            category: this.mockCategories.find(c => c.id === product.categoryId)
          };
          return of(productWithCategory);
        }
        return of(null);
      })
    );
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    return of(null).pipe(
      delay(1000),
      switchMap(() => {
        const newProduct: Product = {
          id: (this.mockProducts.length + 1).toString(),
          code: product.code || '',
          name: product.name || '',
          description: product.description || '',
          categoryId: product.categoryId || '',
          price: product.price || 0,
          cost: product.cost || 0,
          stock: product.stock || 0,
          minStock: product.minStock || 0,
          maxStock: product.maxStock || 0,
          unit: product.unit || 'UND',
          barcode: product.barcode,
          isActive: product.isActive !== false,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        this.mockProducts.push(newProduct);
        this.productsSignal.set([...this.mockProducts]);
        
        return of(newProduct);
      })
    );
  }

  updateProduct(id: string, product: Partial<Product>): Observable<Product> {
    return of(null).pipe(
      delay(1000),
      switchMap(() => {
        const index = this.mockProducts.findIndex(p => p.id === id);
        if (index === -1) {
          throw new Error('Producto no encontrado');
        }

        const updatedProduct: Product = {
          ...this.mockProducts[index],
          ...product,
          id,
          updatedAt: new Date()
        };

        this.mockProducts[index] = updatedProduct;
        this.productsSignal.set([...this.mockProducts]);
        
        return of(updatedProduct);
      })
    );
  }

  deleteProduct(id: string): Observable<void> {
    return of(null).pipe(
      delay(500),
      switchMap(() => {
        const index = this.mockProducts.findIndex(p => p.id === id);
        if (index === -1) {
          throw new Error('Producto no encontrado');
        }

        this.mockProducts.splice(index, 1);
        this.productsSignal.set([...this.mockProducts]);
        
        return of(void 0);
      })
    );
  }

  getCategories(): Observable<Category[]> {
    return of(null).pipe(
      delay(300),
      switchMap(() => {
        this.categoriesSignal.set(this.mockCategories);
        return of([...this.mockCategories]);
      })
    );
  }

  createCategory(categoryData: Omit<Category, 'id'>): Observable<Category> {
    return of(null).pipe(
      delay(500),
      switchMap(() => {
        const newCategory: Category = {
          ...categoryData,
          id: (this.mockCategories.length + 1).toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        this.mockCategories.push(newCategory);
        this.categoriesSignal.set([...this.mockCategories]);
        
        return of(newCategory);
      })
    );
  }

  updateCategory(id: string, categoryData: Partial<Category>): Observable<Category> {
    return of(null).pipe(
      delay(500),
      switchMap(() => {
        const index = this.mockCategories.findIndex(c => c.id === id);
        if (index === -1) {
          return throwError(() => new Error('Categoría no encontrada'));
        }

        const updatedCategory: Category = {
          ...this.mockCategories[index],
          ...categoryData,
          id,
          updatedAt: new Date()
        };

        this.mockCategories[index] = updatedCategory;
        this.categoriesSignal.set([...this.mockCategories]);
        
        return of(updatedCategory);
      })
    );
  }

  deleteCategory(id: string): Observable<void> {
    return of(null).pipe(
      delay(500),
      switchMap(() => {
        const index = this.mockCategories.findIndex(c => c.id === id);
        if (index === -1) {
          return throwError(() => new Error('Categoría no encontrada'));
        }

        // Check if category has products
        const hasProducts = this.mockProducts.some(p => p.categoryId === id);
        if (hasProducts) {
          return throwError(() => new Error('No se puede eliminar una categoría que tiene productos asociados'));
        }

        this.mockCategories.splice(index, 1);
        this.categoriesSignal.set([...this.mockCategories]);
        
        return of(void 0);
      })
    );
  }

  getKardex(productId: string): Observable<KardexEntry[]> {
    return of(null).pipe(
      delay(500),
      switchMap(() => {
        const kardexEntries = this.mockKardex
          .filter(k => k.productId === productId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        return of(kardexEntries);
      })
    );
  }

  getLowStockProducts(): Observable<Product[]> {
    return of(null).pipe(
      delay(300),
      switchMap(() => {
        const lowStockProducts = this.mockProducts
          .filter(p => p.stock <= p.minStock && p.isActive)
          .map(product => ({
            ...product,
            category: this.mockCategories.find(c => c.id === product.categoryId)
          }));
        
        return of(lowStockProducts);
      })
    );
  }
}
