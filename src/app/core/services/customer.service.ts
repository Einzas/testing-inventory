import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, switchMap, throwError } from 'rxjs';
import { Customer, CustomerFilter, CustomerDocumentType, CustomerType, PaginatedResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private customersSignal = signal<Customer[]>([]);

  // Mock data
  private mockCustomers: Customer[] = [
    {
      id: '1',
      type: CustomerType.BUSINESS,
      documentType: CustomerDocumentType.RUC,
      documentNumber: '20123456789',
      businessName: 'Empresa ABC S.A.C.',
      tradeName: 'ABC Store',
      contactPerson: 'Carlos Mendoza',
      email: 'contacto@abc.com',
      phone: '+51 987654321',
      address: 'Av. Principal 123',
      city: 'Lima',
      state: 'Lima',
      country: 'Perú',
      postalCode: '15001',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '2',
      type: CustomerType.INDIVIDUAL,
      documentType: CustomerDocumentType.DNI,
      documentNumber: '12345678',
      firstName: 'Juan',
      lastName: 'Pérez Rodríguez',
      email: 'juan.perez@email.com',
      phone: '+51 912345678',
      address: 'Jr. Los Olivos 456',
      city: 'Lima',
      state: 'Lima',
      country: 'Perú',
      postalCode: '15002',
      isActive: true,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02')
    },
    {
      id: '3',
      type: CustomerType.BUSINESS,
      documentType: CustomerDocumentType.RUC,
      documentNumber: '20987654321',
      businessName: 'Comercial XYZ E.I.R.L.',
      tradeName: 'XYZ Market',
      contactPerson: 'María González',
      email: 'info@xyz.com',
      phone: '+51 923456789',
      address: 'Calle Comercio 789',
      city: 'Arequipa',
      state: 'Arequipa',
      country: 'Perú',
      postalCode: '04001',
      isActive: true,
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03')
    },
    {
      id: '4',
      type: CustomerType.INDIVIDUAL,
      documentType: CustomerDocumentType.DNI,
      documentNumber: '87654321',
      firstName: 'Ana',
      lastName: 'Torres Silva',
      email: 'ana.torres@email.com',
      phone: '+51 934567890',
      address: 'Av. Los Robles 321',
      city: 'Cusco',
      state: 'Cusco',
      country: 'Perú',
      postalCode: '08001',
      isActive: true,
      createdAt: new Date('2024-01-04'),
      updatedAt: new Date('2024-01-04')
    },
    {
      id: '5',
      type: CustomerType.INDIVIDUAL,
      documentType: CustomerDocumentType.FOREIGNER_ID,
      documentNumber: 'CE001234567',
      firstName: 'Roberto',
      lastName: 'Martinez',
      email: 'roberto.martinez@email.com',
      phone: '+51 945678901',
      address: 'Jr. Internacional 654',
      city: 'Lima',
      state: 'Lima',
      country: 'Perú',
      postalCode: '15003',
      isActive: true,
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-05')
    }
  ];

  constructor() {
    this.customersSignal.set(this.mockCustomers);
  }

  get customers() {
    return this.customersSignal.asReadonly();
  }

  getCustomers(filter?: CustomerFilter): Observable<PaginatedResponse<Customer>> {
    return of(null).pipe(
      delay(500),
      switchMap(() => {
        let filteredCustomers = [...this.mockCustomers];

        // Apply filters
        if (filter?.search) {
          const searchTerm = filter.search.toLowerCase();
          filteredCustomers = filteredCustomers.filter(c =>
            (c.firstName && c.firstName.toLowerCase().includes(searchTerm)) ||
            (c.lastName && c.lastName.toLowerCase().includes(searchTerm)) ||
            (c.businessName && c.businessName.toLowerCase().includes(searchTerm)) ||
            c.documentNumber.toLowerCase().includes(searchTerm) ||
            (c.email && c.email.toLowerCase().includes(searchTerm)) ||
            (c.phone && c.phone.toLowerCase().includes(searchTerm))
          );
        }

        if (filter?.type) {
          filteredCustomers = filteredCustomers.filter(c => c.type === filter.type);
        }

        if (filter?.documentType) {
          filteredCustomers = filteredCustomers.filter(c => c.documentType === filter.documentType);
        }

        if (filter?.isActive !== undefined) {
          filteredCustomers = filteredCustomers.filter(c => c.isActive === filter.isActive);
        }

        if (filter?.city) {
          filteredCustomers = filteredCustomers.filter(c => 
            c.city && c.city.toLowerCase().includes(filter.city!.toLowerCase())
          );
        }

        // Apply sorting
        if (filter?.sortBy) {
          filteredCustomers.sort((a, b) => {
            const aValue = this.getPropertyValue(a, filter.sortBy!);
            const bValue = this.getPropertyValue(b, filter.sortBy!);
            
            const comparison = aValue.localeCompare(bValue);
            return filter.sortOrder === 'desc' ? -comparison : comparison;
          });
        }

        // Apply pagination
        const page = filter?.page || 1;
        const limit = filter?.limit || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

        const response: PaginatedResponse<Customer> = {
          data: paginatedCustomers,
          total: filteredCustomers.length,
          page,
          limit,
          totalPages: Math.ceil(filteredCustomers.length / limit)
        };

        this.customersSignal.set(this.mockCustomers);
        return of(response);
      })
    );
  }

  private getPropertyValue(customer: Customer, property: string): string {
    switch (property) {
      case 'name':
        return customer.type === CustomerType.BUSINESS 
          ? customer.businessName || ''
          : `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
      case 'documentNumber':
        return customer.documentNumber;
      case 'email':
        return customer.email || '';
      case 'phone':
        return customer.phone || '';
      case 'city':
        return customer.city || '';
      case 'createdAt':
        return customer.createdAt.toISOString();
      default:
        return '';
    }
  }

  getCustomer(id: string): Observable<Customer | null> {
    return of(null).pipe(
      delay(300),
      switchMap(() => {
        const customer = this.mockCustomers.find(c => c.id === id);
        return of(customer || null);
      })
    );
  }

  searchCustomerByDocument(documentNumber: string): Observable<Customer | null> {
    return of(null).pipe(
      delay(500),
      switchMap(() => {
        const customer = this.mockCustomers.find(c => 
          c.documentNumber === documentNumber && c.isActive
        );
        return of(customer || null);
      })
    );
  }

  createCustomer(customer: Partial<Customer>): Observable<Customer> {
    return of(null).pipe(
      delay(1000),
      switchMap(() => {
        // Check if customer with same document already exists
        const existingCustomer = this.mockCustomers.find(c => 
          c.documentNumber === customer.documentNumber
        );
        
        if (existingCustomer) {
          throw new Error('Ya existe un cliente con este número de documento');
        }

        const newCustomer: Customer = {
          id: (this.mockCustomers.length + 1).toString(),
          type: customer.type || CustomerType.INDIVIDUAL,
          documentType: customer.documentType || CustomerDocumentType.DNI,
          documentNumber: customer.documentNumber || '',
          businessName: customer.businessName || '',
          tradeName: customer.tradeName,
          contactPerson: customer.contactPerson,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address || '',
          city: customer.city || '',
          state: customer.state || '',
          country: customer.country || 'Perú',
          postalCode: customer.postalCode || '',
          isActive: customer.isActive !== false,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        this.mockCustomers.push(newCustomer);
        this.customersSignal.set([...this.mockCustomers]);
        return of(newCustomer);
      })
    );
  }

  updateCustomer(id: string, customer: Partial<Customer>): Observable<Customer> {
    return of(null).pipe(
      delay(800),
      switchMap(() => {
        const index = this.mockCustomers.findIndex(c => c.id === id);
        
        if (index === -1) {
          throw new Error('Cliente no encontrado');
        }

        // Check if document number is being changed and already exists
        if (customer.documentNumber && customer.documentNumber !== this.mockCustomers[index].documentNumber) {
          const existingCustomer = this.mockCustomers.find(c => 
            c.documentNumber === customer.documentNumber && c.id !== id
          );
          
          if (existingCustomer) {
            throw new Error('Ya existe un cliente con este número de documento');
          }
        }

        const updatedCustomer: Customer = {
          ...this.mockCustomers[index],
          ...customer,
          id,
          updatedAt: new Date()
        };

        this.mockCustomers[index] = updatedCustomer;
        this.customersSignal.set([...this.mockCustomers]);
        return of(updatedCustomer);
      })
    );
  }

  deleteCustomer(id: string): Observable<void> {
    return of(null).pipe(
      delay(500),
      switchMap(() => {
        const index = this.mockCustomers.findIndex(c => c.id === id);
        
        if (index === -1) {
          throw new Error('Cliente no encontrado');
        }

        // Soft delete - mark as inactive
        this.mockCustomers[index] = {
          ...this.mockCustomers[index],
          isActive: false,
          updatedAt: new Date()
        };

        this.customersSignal.set([...this.mockCustomers]);
        return of(void 0);
      })
    );
  }

  getActiveCustomers(): Observable<Customer[]> {
    return of(null).pipe(
      delay(300),
      switchMap(() => {
        const activeCustomers = this.mockCustomers.filter(c => c.isActive);
        return of(activeCustomers);
      })
    );
  }

  validateDocument(documentType: CustomerDocumentType, documentNumber: string): Observable<boolean> {
    return of(null).pipe(
      delay(200),
      switchMap(() => {
        let isValid = false;
        
        switch (documentType) {
          case CustomerDocumentType.RUC:
            isValid = /^\d{11}$/.test(documentNumber);
            break;
          case CustomerDocumentType.DNI:
            isValid = /^\d{8}$/.test(documentNumber);
            break;
          case CustomerDocumentType.PASSPORT:
            isValid = /^[A-Z0-9]{6,12}$/.test(documentNumber);
            break;
          case CustomerDocumentType.FOREIGNER_ID:
            isValid = documentNumber.length >= 5 && documentNumber.length <= 20;
            break;
          default:
            isValid = false;
        }
        
        return of(isValid);
      })
    );
  }
}
