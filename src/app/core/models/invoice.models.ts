import { Customer } from './customer.models';
import { Product } from './product.models';
import { User } from './auth.models';
import { FilterBase } from './index';

export interface Invoice {
  id: string;
  series: string;
  number: string;
  type: InvoiceType;
  customerId: string;
  customer?: Customer;
  userId: string;
  user?: User;
  issueDate: Date;
  dueDate?: Date;
  currency: Currency;
  exchangeRate: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  items: InvoiceItem[];
  notes?: string;
  sunatStatus?: SunatStatus;
  sunatResponse?: string;
  xmlPath?: string;
  pdfPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  product?: Product;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export enum InvoiceType {
  BOLETA = 'boleta',
  FACTURA = 'factura',
  NOTA_CREDITO = 'nota_credito',
  NOTA_DEBITO = 'nota_debito'
}

export enum Currency {
  PEN = 'PEN',
  USD = 'USD'
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  PAID = 'paid',
  CANCELLED = 'cancelled'
}

export enum SunatStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  ERROR = 'error'
}

export interface InvoiceFilter extends FilterBase {
  search?: string;
  type?: InvoiceType;
  status?: InvoiceStatus;
  customerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface CreateInvoiceRequest {
  type: InvoiceType;
  customerId: string;
  currency: Currency;
  exchangeRate: number;
  items: CreateInvoiceItemRequest[];
  notes?: string;
}

export interface CreateInvoiceItemRequest {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
}
