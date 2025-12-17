
export interface SyncableEntity {
  id: string;
  synced: boolean;
  lastModified: string;
  syncAttempts?: number;
  lastSyncError?: string;
}

export interface Transaction extends SyncableEntity {
  amount: number;
  description: string;
  date: string;
  type: 'sale' | 'purchase' | 'expense';
  category?: string;
  reference?: string;
}

export interface Product extends SyncableEntity {
  name: string;
  quantity: number;
  unitPrice: number;
  category?: string; // DEPRECATED: Use category_id instead
  category_id?: string; // Foreign key to categories table
  categoryName?: string; // Populated from join with categories table
  description?: string;
}

export interface Customer extends SyncableEntity {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface Invoice extends SyncableEntity {
  customerName: string;
  customerId?: string;
  date: string;
  items: InvoiceItem[];
  totalAmount: number;
  status: 'draft' | 'issued' | 'paid' | 'overdue';
  dueDate?: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CartItem extends InvoiceItem {
  available: number;
}

export interface PaymentDetails {
  method: 'cash' | 'card' | 'bank_transfer';
  amount: number;
  reference?: string;
  change?: number;
}

export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  lowStockItems: number;
  pendingInvoices: number;
}

export interface Category extends SyncableEntity {
  name: string;
  description?: string;
}
