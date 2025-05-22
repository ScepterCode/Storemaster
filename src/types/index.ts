export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: 'sale' | 'purchase' | 'expense';
  category?: string;
  reference?: string;
  synced: boolean;
}

export interface Product {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  category?: string;
  description?: string;
  synced: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  synced: boolean;
}

export interface Invoice {
  id: string;
  customerName: string;
  customerId?: string;
  date: string;
  items: InvoiceItem[];
  totalAmount: number;
  status: 'draft' | 'issued' | 'paid' | 'overdue';
  dueDate?: string;
  synced: boolean;
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

export interface Category {
  id: string;
  name: string;
  description?: string;
  synced: boolean;
}
