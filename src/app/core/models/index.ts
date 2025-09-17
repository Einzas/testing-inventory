// Auth models
export * from './auth.models';

// Product models
export * from './product.models';

// Customer models
export * from './customer.models';

// Invoice models
export * from './invoice.models';

// Common interfaces
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FilterBase {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
