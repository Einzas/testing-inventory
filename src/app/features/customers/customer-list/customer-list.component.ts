import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CustomerService } from '../../../core/services/customer.service';
import { Customer, CustomerType, DocumentType } from '../../../core/models';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.css'
})
export class CustomerListComponent implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly formBuilder = inject(FormBuilder);

  // Signals
  customers = signal<Customer[]>([]);
  loading = signal(false);
  submitting = signal(false);
  showModal = signal(false);
  showDeleteModal = signal(false);
  editingCustomer = signal<Customer | null>(null);
  customerToDelete = signal<Customer | null>(null);

  // Filter properties
  searchTerm = '';
  typeFilter = '';
  statusFilter = '';
  documentTypeFilter = '';

  // Form
  customerForm: FormGroup;

  // Computed signals
  totalCustomers = computed(() => this.customers().length);
  activeCustomers = computed(() => this.customers().filter(c => c.isActive).length);
  businessCustomers = computed(() => this.customers().filter(c => c.type === CustomerType.BUSINESS).length);
  individualCustomers = computed(() => this.customers().filter(c => c.type === CustomerType.INDIVIDUAL).length);

  filteredCustomers = computed(() => {
    let filtered = this.customers();

    // Apply search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(customer => {
        const name = customer.type === CustomerType.INDIVIDUAL 
          ? `${customer.firstName} ${customer.lastName}`.toLowerCase()
          : customer.businessName?.toLowerCase() || '';
        const email = customer.email?.toLowerCase() || '';
        const phone = customer.phone?.toLowerCase() || '';
        const document = customer.documentNumber.toLowerCase();
        
        return name.includes(search) || 
               email.includes(search) || 
               phone.includes(search) ||
               document.includes(search);
      });
    }

    // Apply type filter
    if (this.typeFilter) {
      filtered = filtered.filter(customer => customer.type === this.typeFilter);
    }

    // Apply status filter
    if (this.statusFilter !== '') {
      const isActive = this.statusFilter === 'true';
      filtered = filtered.filter(customer => customer.isActive === isActive);
    }

    // Apply document type filter
    if (this.documentTypeFilter) {
      filtered = filtered.filter(customer => customer.documentType === this.documentTypeFilter);
    }

    return filtered;
  });

  constructor() {
    this.customerForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCustomers();
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      type: [CustomerType.INDIVIDUAL, [Validators.required]],
      firstName: [''],
      lastName: [''],
      businessName: [''],
      contactPerson: [''],
      documentType: ['', [Validators.required]],
      documentNumber: ['', [Validators.required]],
      email: ['', [Validators.email]],
      phone: [''],
      address: [''],
      isActive: [true]
    });
  }

  private loadCustomers(): void {
    this.loading.set(true);
    
    this.customerService.getCustomers().subscribe({
      next: (response) => {
        this.customers.set(response.data);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading customers:', error);
        this.loading.set(false);
      }
    });
  }

  hasFilters(): boolean {
    return !!(this.searchTerm || this.typeFilter || this.statusFilter || this.documentTypeFilter);
  }

  onSearchChange(): void {
    this.filteredCustomers();
  }

  onFilterChange(): void {
    this.filteredCustomers();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.typeFilter = '';
    this.statusFilter = '';
    this.documentTypeFilter = '';
    this.onFilterChange();
  }

  openCreateModal(): void {
    this.editingCustomer.set(null);
    this.customerForm = this.createForm();
    this.showModal.set(true);
  }

  editCustomer(customer: Customer): void {
    this.editingCustomer.set(customer);
    this.customerForm.patchValue({
      type: customer.type,
      firstName: customer.firstName,
      lastName: customer.lastName,
      businessName: customer.businessName,
      contactPerson: customer.contactPerson,
      documentType: customer.documentType,
      documentNumber: customer.documentNumber,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      isActive: customer.isActive
    });
    this.showModal.set(true);
  }

  viewCustomer(customer: Customer): void {
    // For now, just edit - could implement a read-only view later
    this.editCustomer(customer);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingCustomer.set(null);
    this.customerForm.reset();
  }

  onSubmit(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    // Set conditional validators based on customer type
    const type = this.customerForm.get('type')?.value;
    if (type === CustomerType.INDIVIDUAL) {
      this.customerForm.get('firstName')?.setValidators([Validators.required]);
      this.customerForm.get('lastName')?.setValidators([Validators.required]);
      this.customerForm.get('businessName')?.clearValidators();
    } else {
      this.customerForm.get('businessName')?.setValidators([Validators.required]);
      this.customerForm.get('firstName')?.clearValidators();
      this.customerForm.get('lastName')?.clearValidators();
    }

    // Update form validity
    this.customerForm.get('firstName')?.updateValueAndValidity();
    this.customerForm.get('lastName')?.updateValueAndValidity();
    this.customerForm.get('businessName')?.updateValueAndValidity();

    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const formValue = this.customerForm.value;

    if (this.editingCustomer()) {
      // Update existing customer
      const updatedCustomer: Customer = {
        ...this.editingCustomer()!,
        ...formValue,
        updatedAt: new Date()
      };

      this.customerService.updateCustomer(updatedCustomer.id, updatedCustomer).subscribe({
        next: (customer: Customer) => {
          const currentCustomers = this.customers();
          const index = currentCustomers.findIndex(c => c.id === customer.id);
          if (index !== -1) {
            currentCustomers[index] = customer;
            this.customers.set([...currentCustomers]);
          }
          this.closeModal();
          this.submitting.set(false);
        },
        error: (error: any) => {
          console.error('Error updating customer:', error);
          this.submitting.set(false);
        }
      });
    } else {
      // Create new customer
      const newCustomer: Omit<Customer, 'id'> = {
        ...formValue,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.customerService.createCustomer(newCustomer).subscribe({
        next: (customer: Customer) => {
          this.customers.set([...this.customers(), customer]);
          this.closeModal();
          this.submitting.set(false);
        },
        error: (error: any) => {
          console.error('Error creating customer:', error);
          this.submitting.set(false);
        }
      });
    }
  }

  toggleCustomerStatus(customer: Customer): void {
    const updatedCustomer: Customer = {
      ...customer,
      isActive: !customer.isActive,
      updatedAt: new Date()
    };

    this.customerService.updateCustomer(customer.id, updatedCustomer).subscribe({
      next: (updated: Customer) => {
        const currentCustomers = this.customers();
        const index = currentCustomers.findIndex(c => c.id === updated.id);
        if (index !== -1) {
          currentCustomers[index] = updated;
          this.customers.set([...currentCustomers]);
        }
      },
      error: (error: any) => {
        console.error('Error updating customer status:', error);
      }
    });
  }

  deleteCustomer(customer: Customer): void {
    this.customerToDelete.set(customer);
    this.showDeleteModal.set(true);
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.customerToDelete.set(null);
  }

  confirmDelete(): void {
    const customer = this.customerToDelete();
    if (!customer) return;

    this.submitting.set(true);

    this.customerService.deleteCustomer(customer.id).subscribe({
      next: () => {
        const currentCustomers = this.customers();
        const filtered = currentCustomers.filter(c => c.id !== customer.id);
        this.customers.set(filtered);
        this.cancelDelete();
        this.submitting.set(false);
      },
      error: (error: any) => {
        console.error('Error deleting customer:', error);
        this.submitting.set(false);
      }
    });
  }

  getCustomerDisplayName(customer: Customer | null): string {
    if (!customer) return '';
    
    if (customer.type === CustomerType.INDIVIDUAL) {
      return `${customer.firstName} ${customer.lastName}`;
    } else {
      return customer.businessName || '';
    }
  }
}
