import { FilterBase } from './index';

export interface Customer {
  id: string;
  type: CustomerType;
  documentType: CustomerDocumentType;
  documentNumber: string;
  businessName?: string;
  tradeName?: string;
  contactPerson?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum CustomerType {
  INDIVIDUAL = 'INDIVIDUAL',
  BUSINESS = 'BUSINESS'
}

export enum CustomerDocumentType {
  RUC = 'RUC',
  DNI = 'DNI',
  PASSPORT = 'PASSPORT',
  FOREIGNER_ID = 'FOREIGNER_ID'
}

export interface CustomerFilter extends FilterBase {
  search?: string;
  type?: CustomerType;
  documentType?: CustomerDocumentType;
  isActive?: boolean;
  city?: string;
}
