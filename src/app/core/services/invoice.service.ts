import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, switchMap } from 'rxjs';
import { 
  Invoice, 
  InvoiceFilter, 
  InvoiceType, 
  InvoiceStatus, 
  Currency, 
  SunatStatus,
  CreateInvoiceRequest,
  PaginatedResponse 
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private invoicesSignal = signal<Invoice[]>([]);
  private nextInvoiceNumber = signal<number>(1);

  // Mock data
  private mockInvoices: Invoice[] = [
    {
      id: '1',
      series: 'F001',
      number: '00000001',
      type: InvoiceType.FACTURA,
      customerId: '1',
      userId: '1',
      issueDate: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
      currency: Currency.PEN,
      exchangeRate: 1.0,
      subtotal: 2500.00,
      taxAmount: 450.00,
      discountAmount: 0.00,
      totalAmount: 2950.00,
      status: InvoiceStatus.PAID,
      sunatStatus: SunatStatus.ACCEPTED,
      items: [
        {
          id: '1',
          invoiceId: '1',
          productId: '1',
          description: 'Laptop Dell Inspiron',
          quantity: 1,
          unitPrice: 2500.00,
          discountAmount: 0.00,
          taxAmount: 450.00,
          totalAmount: 2950.00
        }
      ],
      notes: 'Venta realizada con descuento especial',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      series: 'B001',
      number: '00000001',
      type: InvoiceType.BOLETA,
      customerId: '2',
      userId: '1',
      issueDate: new Date('2024-01-16'),
      currency: Currency.PEN,
      exchangeRate: 1.0,
      subtotal: 53.50,
      taxAmount: 9.63,
      discountAmount: 5.00,
      totalAmount: 58.13,
      status: InvoiceStatus.ISSUED,
      sunatStatus: SunatStatus.PENDING,
      items: [
        {
          id: '2',
          invoiceId: '2',
          productId: '2',
          description: 'Mouse Inalámbrico',
          quantity: 1,
          unitPrice: 45.00,
          discountAmount: 0.00,
          taxAmount: 8.10,
          totalAmount: 53.10
        },
        {
          id: '3',
          invoiceId: '2',
          productId: '3',
          description: 'Cuaderno A4',
          quantity: 1,
          unitPrice: 8.50,
          discountAmount: 5.00,
          taxAmount: 1.53,
          totalAmount: 5.03
        }
      ],
      notes: 'Cliente frecuente - descuento aplicado',
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date('2024-01-16')
    }
  ];

  constructor() {
    this.invoicesSignal.set(this.mockInvoices);
    this.nextInvoiceNumber.set(this.mockInvoices.length + 1);
  }

  // Signals for reactive state
  invoices = this.invoicesSignal.asReadonly();

  getInvoices(filter?: InvoiceFilter): Observable<PaginatedResponse<Invoice>> {
    return of(null).pipe(
      delay(500),
      switchMap(() => {
        let filteredInvoices = [...this.mockInvoices];

        if (filter?.search) {
          const searchTerm = filter.search.toLowerCase();
          filteredInvoices = filteredInvoices.filter(i => 
            i.number.includes(searchTerm) ||
            i.series.toLowerCase().includes(searchTerm) ||
            (i.notes && i.notes.toLowerCase().includes(searchTerm))
          );
        }

        if (filter?.type) {
          filteredInvoices = filteredInvoices.filter(i => i.type === filter.type);
        }

        if (filter?.status) {
          filteredInvoices = filteredInvoices.filter(i => i.status === filter.status);
        }

        if (filter?.customerId) {
          filteredInvoices = filteredInvoices.filter(i => i.customerId === filter.customerId);
        }

        if (filter?.dateFrom) {
          filteredInvoices = filteredInvoices.filter(i => i.issueDate >= filter.dateFrom!);
        }

        if (filter?.dateTo) {
          filteredInvoices = filteredInvoices.filter(i => i.issueDate <= filter.dateTo!);
        }

        // Sort by issue date (newest first)
        filteredInvoices.sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime());

        const page = filter?.page || 1;
        const limit = filter?.limit || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

        const response: PaginatedResponse<Invoice> = {
          data: paginatedInvoices,
          total: filteredInvoices.length,
          page,
          limit,
          totalPages: Math.ceil(filteredInvoices.length / limit)
        };

        this.invoicesSignal.set(this.mockInvoices);
        return of(response);
      })
    );
  }

  getInvoice(id: string): Observable<Invoice | null> {
    return of(null).pipe(
      delay(300),
      switchMap(() => {
        const invoice = this.mockInvoices.find(i => i.id === id);
        return of(invoice || null);
      })
    );
  }

  createInvoice(request: CreateInvoiceRequest): Observable<Invoice> {
    return of(null).pipe(
      delay(1500),
      switchMap(() => {
        const currentNumber = this.nextInvoiceNumber();
        const series = request.type === InvoiceType.FACTURA ? 'F001' : 'B001';
        const number = currentNumber.toString().padStart(8, '0');

        // Calculate totals
        let subtotal = 0;
        let taxAmount = 0;
        let discountAmount = 0;

        const items = request.items.map((item, index) => {
          const itemSubtotal = item.quantity * item.unitPrice;
          const itemDiscount = item.discountAmount || 0;
          const itemTaxableAmount = itemSubtotal - itemDiscount;
          const itemTax = itemTaxableAmount * 0.18; // 18% IGV
          const itemTotal = itemTaxableAmount + itemTax;

          subtotal += itemSubtotal;
          discountAmount += itemDiscount;
          taxAmount += itemTax;

          return {
            id: (index + 1).toString(),
            invoiceId: '',
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountAmount: itemDiscount,
            taxAmount: itemTax,
            totalAmount: itemTotal
          };
        });

        const totalAmount = subtotal - discountAmount + taxAmount;

        const newInvoice: Invoice = {
          id: (this.mockInvoices.length + 1).toString(),
          series,
          number,
          type: request.type,
          customerId: request.customerId,
          userId: '1', // Current user
          issueDate: new Date(),
          dueDate: request.type === InvoiceType.FACTURA ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined,
          currency: request.currency,
          exchangeRate: request.exchangeRate,
          subtotal,
          taxAmount,
          discountAmount,
          totalAmount,
          status: InvoiceStatus.ISSUED,
          sunatStatus: SunatStatus.PENDING,
          items: items.map(item => ({ ...item, invoiceId: (this.mockInvoices.length + 1).toString() })),
          notes: request.notes,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        this.mockInvoices.push(newInvoice);
        this.invoicesSignal.set([...this.mockInvoices]);
        this.nextInvoiceNumber.set(currentNumber + 1);
        
        return of(newInvoice);
      })
    );
  }

  updateInvoiceStatus(id: string, status: InvoiceStatus): Observable<Invoice> {
    return of(null).pipe(
      delay(1000),
      switchMap(() => {
        const index = this.mockInvoices.findIndex(i => i.id === id);
        if (index === -1) {
          throw new Error('Comprobante no encontrado');
        }

        const updatedInvoice: Invoice = {
          ...this.mockInvoices[index],
          status,
          updatedAt: new Date()
        };

        this.mockInvoices[index] = updatedInvoice;
        this.invoicesSignal.set([...this.mockInvoices]);
        
        return of(updatedInvoice);
      })
    );
  }

  sendToSunat(id: string): Observable<Invoice> {
    return of(null).pipe(
      delay(2000),
      switchMap(() => {
        const index = this.mockInvoices.findIndex(i => i.id === id);
        if (index === -1) {
          throw new Error('Comprobante no encontrado');
        }

        // Simulate SUNAT response
        const isAccepted = Math.random() > 0.1; // 90% success rate
        
        const updatedInvoice: Invoice = {
          ...this.mockInvoices[index],
          sunatStatus: isAccepted ? SunatStatus.ACCEPTED : SunatStatus.REJECTED,
          sunatResponse: isAccepted ? 'Comprobante aceptado por SUNAT' : 'Error en validación SUNAT',
          xmlPath: isAccepted ? `/xml/${this.mockInvoices[index].series}-${this.mockInvoices[index].number}.xml` : undefined,
          updatedAt: new Date()
        };

        this.mockInvoices[index] = updatedInvoice;
        this.invoicesSignal.set([...this.mockInvoices]);
        
        return of(updatedInvoice);
      })
    );
  }

  generatePdf(id: string): Observable<string> {
    return of(null).pipe(
      delay(1500),
      switchMap(() => {
        const invoice = this.mockInvoices.find(i => i.id === id);
        if (!invoice) {
          throw new Error('Comprobante no encontrado');
        }

        // Simulate PDF generation
        const pdfPath = `/pdf/${invoice.series}-${invoice.number}.pdf`;
        
        // Update invoice with PDF path
        const index = this.mockInvoices.findIndex(i => i.id === id);
        this.mockInvoices[index] = {
          ...this.mockInvoices[index],
          pdfPath,
          updatedAt: new Date()
        };
        
        this.invoicesSignal.set([...this.mockInvoices]);
        
        return of(pdfPath);
      })
    );
  }

  cancelInvoice(id: string, reason: string): Observable<Invoice> {
    return of(null).pipe(
      delay(1000),
      switchMap(() => {
        const index = this.mockInvoices.findIndex(i => i.id === id);
        if (index === -1) {
          throw new Error('Comprobante no encontrado');
        }

        if (this.mockInvoices[index].status === InvoiceStatus.PAID) {
          throw new Error('No se puede anular un comprobante pagado');
        }

        const updatedInvoice: Invoice = {
          ...this.mockInvoices[index],
          status: InvoiceStatus.CANCELLED,
          notes: `${this.mockInvoices[index].notes || ''}\n\nANULADO: ${reason}`,
          updatedAt: new Date()
        };

        this.mockInvoices[index] = updatedInvoice;
        this.invoicesSignal.set([...this.mockInvoices]);
        
        return of(updatedInvoice);
      })
    );
  }

  getInvoicesBySeries(series: string): Observable<Invoice[]> {
    return of(null).pipe(
      delay(300),
      switchMap(() => {
        const invoices = this.mockInvoices
          .filter(i => i.series === series)
          .sort((a, b) => parseInt(b.number) - parseInt(a.number));
        
        return of(invoices);
      })
    );
  }

  getDashboardStats(): Observable<{
    totalInvoices: number;
    totalAmount: number;
    pendingInvoices: number;
    paidInvoices: number;
  }> {
    return of(null).pipe(
      delay(500),
      switchMap(() => {
        const stats = {
          totalInvoices: this.mockInvoices.length,
          totalAmount: this.mockInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
          pendingInvoices: this.mockInvoices.filter(i => i.status === InvoiceStatus.ISSUED).length,
          paidInvoices: this.mockInvoices.filter(i => i.status === InvoiceStatus.PAID).length
        };
        
        return of(stats);
      })
    );
  }
}
