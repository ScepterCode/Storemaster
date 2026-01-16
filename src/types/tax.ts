export interface TaxConfiguration {
  id: string;
  organization_id: string;
  vat_rate: number; // Default 7.5%
  vat_enabled: boolean;
  exempt_categories: string[]; // Category IDs that are VAT exempt
  zero_rated_categories: string[]; // Category IDs that are zero-rated
  small_company_status: boolean; // Whether company qualifies as small
  tax_identification_number?: string; // TIN
  created_at: string;
  updated_at: string;
}

export interface VATExemptItem {
  name: string;
  description: string;
  category: string;
}

export interface TaxableTransaction {
  id: string;
  transaction_id: string;
  gross_amount: number;
  vat_amount: number;
  net_amount: number;
  vat_rate: number;
  is_exempt: boolean;
  exemption_reason?: string;
  created_at: string;
}

export interface VATReturn {
  id: string;
  organization_id: string;
  period_start: string;
  period_end: string;
  output_vat: number; // VAT collected on sales
  input_vat: number; // VAT paid on purchases
  net_vat: number; // Amount to pay/refund
  status: 'draft' | 'submitted' | 'paid';
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface TaxInvoiceData {
  invoice_number: string;
  date: string;
  supplier_name: string;
  supplier_tin?: string;
  customer_name: string;
  customer_tin?: string;
  items: TaxInvoiceItem[];
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  vat_rate: number;
}

export interface TaxInvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  vat_amount: number;
  is_exempt: boolean;
  exemption_reason?: string;
}

// Nigerian VAT exempt items as per NTA 2025
export const VAT_EXEMPT_ITEMS: VATExemptItem[] = [
  { name: 'Basic Foods', description: 'Rice, beans, yam, cassava, plantain, etc.', category: 'food_basic' },
  { name: 'Baby Products', description: 'Baby food, diapers, formula', category: 'baby_products' },
  { name: 'Agricultural Equipment', description: 'Farming tools and machinery', category: 'agriculture' },
  { name: 'Medical Supplies', description: 'Essential medicines and medical equipment', category: 'medical' },
  { name: 'Educational Materials', description: 'Books, educational software', category: 'education' },
  { name: 'Shared Transport', description: 'Public transportation services', category: 'transport_public' }
];

export const DEFAULT_VAT_RATE = 7.5;
export const SMALL_COMPANY_TURNOVER_THRESHOLD = 50000000; // ₦50 million
export const SMALL_COMPANY_ASSETS_THRESHOLD = 250000000; // ₦250 million