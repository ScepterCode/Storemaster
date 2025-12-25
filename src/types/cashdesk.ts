
export interface CashdeskSession {
  id: string;
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  openingFloat: number;
  closingCash?: number;
  expectedCash?: number;
  discrepancy?: number;
  status: 'active' | 'closed';
  pettyCashTransactions: PettyCashTransaction[];
  totalSales: number;
  transactionCount: number;
}

export interface PettyCashTransaction {
  id: string;
  amount: number;
  description: string;
  type: 'out' | 'in';
  timestamp: string;
  cashierId: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  taxRate?: number;
  taxAmount?: number;
  total: number;
}

export interface SaleCustomer {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  tier?: 'regular' | 'silver' | 'gold' | 'platinum';
  isWalkIn?: boolean;
}

export interface SaleDiscount {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderValue?: number;
  applicableProducts?: string[];
  customerTiers?: string[];
  automatic: boolean;
}

export interface PaymentMethod {
  type: 'cash' | 'card' | 'transfer' | 'wallet';
  amount: number;
  reference?: string;
  cardLastFour?: string;
  walletProvider?: string;
}

export interface Sale {
  id: string;
  transactionId: string;
  sessionId: string;
  cashierId: string;
  cashierName: string;
  customer: SaleCustomer;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  payments: PaymentMethod[];
  timestamp: string;
  receiptSent?: boolean;
  receiptEmail?: string;
  receiptSms?: string;
  status: 'completed' | 'refunded' | 'partial_refund';
}

export interface BarcodeProduct {
  id: string;
  name: string;
  sku: string;
  barcode: string; // Required for barcode scanning
  price: number;
  quantity: number;
  category?: string;
  taxRate?: number;
}

export interface CashdeskSettings {
  taxRate: number;
  currency: string;
  receiptHeader: string;
  receiptFooter: string;
  autoDiscounts: SaleDiscount[];
  requireCustomerForSale: boolean;
  enableBarcodeScanning: boolean;
  defaultPaymentMethod: 'cash' | 'card';
}
