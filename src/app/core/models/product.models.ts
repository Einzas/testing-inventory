import { User } from './auth.models';
import { FilterBase } from './index';

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  categoryId: string;
  category?: Category;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  barcode?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  parentId?: string;
  children?: Category[];
  createdAt: Date;
  updatedAt: Date;
}

export interface KardexEntry {
  id: string;
  productId: string;
  product?: Product;
  type: KardexType;
  quantity: number;
  unitCost: number;
  totalCost: number;
  balanceQuantity: number;
  balanceCost: number;
  reference: string;
  documentType: DocumentType;
  documentNumber: string;
  userId: string;
  user?: User;
  createdAt: Date;
}

export enum KardexType {
  INPUT = 'input',
  OUTPUT = 'output',
  ADJUSTMENT = 'adjustment'
}

export enum DocumentType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  ADJUSTMENT = 'adjustment',
  TRANSFER = 'transfer'
}

export interface ProductFilter extends FilterBase {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  lowStock?: boolean;
}
