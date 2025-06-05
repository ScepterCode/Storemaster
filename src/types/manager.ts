
export interface StaffTransaction {
  id: string;
  transactionId: string;
  cashierId: string;
  cashierName: string;
  timestamp: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'wallet' | 'split';
  customer?: {
    name?: string;
    phone?: string;
    tier?: string;
  };
  refunded?: boolean;
  voided?: boolean;
}

export interface CashierPerformance {
  cashierId: string;
  cashierName: string;
  date: string;
  totalSales: number;
  transactionCount: number;
  averageTransactionValue: number;
  refundsIssued: number;
  voidsIssued: number;
  cashDiscrepancy: number;
  hoursWorked: number;
  topSellingProducts: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
  }>;
}

export interface ManagerOverviewFilters {
  dateFrom?: string;
  dateTo?: string;
  cashierId?: string;
  paymentMethod?: string;
  minAmount?: number;
  maxAmount?: number;
  includeRefunded?: boolean;
  includeVoided?: boolean;
}

export interface SalesAnalytics {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  topSellingProducts: Array<{
    id: string;
    name: string;
    quantitySold: number;
    revenue: number;
  }>;
  peakHours: Array<{
    hour: number;
    transactionCount: number;
    revenue: number;
  }>;
  paymentMethodBreakdown: Record<string, number>;
}
