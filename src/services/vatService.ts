import { supabase } from '@/lib/supabase';
import { 
  TaxConfiguration, 
  TaxableTransaction, 
  VATReturn,
  DEFAULT_VAT_RATE,
  VAT_EXEMPT_ITEMS 
} from '@/types/tax';
import { Product, Transaction, Invoice, InvoiceItem } from '@/types';

export class VATService {
  /**
   * Calculate VAT for a transaction amount
   */
  static calculateVAT(amount: number, vatRate: number = DEFAULT_VAT_RATE, isExempt: boolean = false): {
    grossAmount: number;
    vatAmount: number;
    netAmount: number;
  } {
    if (isExempt) {
      return {
        grossAmount: amount,
        vatAmount: 0,
        netAmount: amount
      };
    }

    const vatAmount = (amount * vatRate) / 100;
    return {
      grossAmount: amount + vatAmount,
      vatAmount,
      netAmount: amount
    };
  }

  /**
   * Calculate VAT from gross amount (VAT inclusive)
   */
  static calculateVATFromGross(grossAmount: number, vatRate: number = DEFAULT_VAT_RATE, isExempt: boolean = false): {
    grossAmount: number;
    vatAmount: number;
    netAmount: number;
  } {
    if (isExempt) {
      return {
        grossAmount,
        vatAmount: 0,
        netAmount: grossAmount
      };
    }

    const netAmount = grossAmount / (1 + vatRate / 100);
    const vatAmount = grossAmount - netAmount;
    
    return {
      grossAmount,
      vatAmount,
      netAmount
    };
  }

  /**
   * Check if a product is VAT exempt based on category
   */
  static isProductVATExempt(product: Product, taxConfig?: TaxConfiguration): boolean {
    if (!taxConfig?.vat_enabled) return true;
    
    // Check if product category is in exempt list
    if (product.category_id && taxConfig.exempt_categories.includes(product.category_id)) {
      return true;
    }

    // Check if product name matches common exempt items
    const productNameLower = product.name.toLowerCase();
    return VAT_EXEMPT_ITEMS.some(exemptItem => 
      productNameLower.includes(exemptItem.name.toLowerCase()) ||
      exemptItem.description.toLowerCase().includes(productNameLower)
    );
  }

  /**
   * Calculate VAT for invoice items
   */
  static calculateInvoiceVAT(items: InvoiceItem[], taxConfig?: TaxConfiguration): {
    subtotal: number;
    totalVAT: number;
    grandTotal: number;
    itemsWithVAT: Array<InvoiceItem & { vatAmount: number; isExempt: boolean }>;
  } {
    const vatRate = taxConfig?.vat_rate || DEFAULT_VAT_RATE;
    let subtotal = 0;
    let totalVAT = 0;
    
    const itemsWithVAT = items.map(item => {
      const lineTotal = item.quantity * item.unitPrice;
      subtotal += lineTotal;
      
      // For now, assume all items are taxable unless specifically exempt
      // In a real implementation, you'd check against product data
      const isExempt = false; // This would be determined by product category
      const vatCalc = this.calculateVAT(lineTotal, vatRate, isExempt);
      
      totalVAT += vatCalc.vatAmount;
      
      return {
        ...item,
        vatAmount: vatCalc.vatAmount,
        isExempt
      };
    });

    return {
      subtotal,
      totalVAT,
      grandTotal: subtotal + totalVAT,
      itemsWithVAT
    };
  }

  /**
   * Get or create tax configuration for organization
   */
  static async getTaxConfiguration(organizationId: string): Promise<TaxConfiguration | null> {
    try {
      const { data, error } = await supabase
        .from('tax_configurations')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      if (!data) {
        // Create default configuration
        return await this.createDefaultTaxConfiguration(organizationId);
      }

      return data;
    } catch (error) {
      console.error('Error fetching tax configuration:', error);
      return null;
    }
  }

  /**
   * Create default tax configuration
   */
  static async createDefaultTaxConfiguration(organizationId: string): Promise<TaxConfiguration> {
    const defaultConfig = {
      organization_id: organizationId,
      vat_rate: DEFAULT_VAT_RATE,
      vat_enabled: true,
      exempt_categories: [],
      zero_rated_categories: [],
      small_company_status: false
    };

    const { data, error } = await supabase
      .from('tax_configurations')
      .insert(defaultConfig)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Update tax configuration
   */
  static async updateTaxConfiguration(
    organizationId: string, 
    updates: Partial<TaxConfiguration>
  ): Promise<TaxConfiguration> {
    const { data, error } = await supabase
      .from('tax_configurations')
      .update(updates)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Record taxable transaction
   */
  static async recordTaxableTransaction(
    transactionId: string,
    grossAmount: number,
    vatAmount: number,
    netAmount: number,
    vatRate: number,
    isExempt: boolean = false,
    exemptionReason?: string
  ): Promise<TaxableTransaction> {
    const taxableTransaction = {
      transaction_id: transactionId,
      gross_amount: grossAmount,
      vat_amount: vatAmount,
      net_amount: netAmount,
      vat_rate: vatRate,
      is_exempt: isExempt,
      exemption_reason: exemptionReason
    };

    const { data, error } = await supabase
      .from('taxable_transactions')
      .insert(taxableTransaction)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get VAT summary for a period
   */
  static async getVATSummary(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    outputVAT: number;
    inputVAT: number;
    netVAT: number;
    totalTransactions: number;
  }> {
    try {
      // Get all taxable transactions for the period
      const { data: transactions, error } = await supabase
        .from('taxable_transactions')
        .select(`
          *,
          transactions!inner(
            organization_id,
            date,
            type
          )
        `)
        .eq('transactions.organization_id', organizationId)
        .gte('transactions.date', startDate)
        .lte('transactions.date', endDate);

      if (error) {
        throw error;
      }

      let outputVAT = 0; // VAT on sales
      let inputVAT = 0;  // VAT on purchases

      transactions?.forEach(tx => {
        if (tx.transactions.type === 'sale') {
          outputVAT += tx.vat_amount;
        } else if (tx.transactions.type === 'purchase') {
          inputVAT += tx.vat_amount;
        }
      });

      return {
        outputVAT,
        inputVAT,
        netVAT: outputVAT - inputVAT,
        totalTransactions: transactions?.length || 0
      };
    } catch (error) {
      console.error('Error calculating VAT summary:', error);
      return {
        outputVAT: 0,
        inputVAT: 0,
        netVAT: 0,
        totalTransactions: 0
      };
    }
  }

  /**
   * Generate VAT return for a period
   */
  static async generateVATReturn(
    organizationId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<VATReturn> {
    const summary = await this.getVATSummary(organizationId, periodStart, periodEnd);
    
    // Calculate due date (14th of following month)
    const endDate = new Date(periodEnd);
    const dueDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 14);

    const vatReturn = {
      organization_id: organizationId,
      period_start: periodStart,
      period_end: periodEnd,
      output_vat: summary.outputVAT,
      input_vat: summary.inputVAT,
      net_vat: summary.netVAT,
      status: 'draft' as const,
      due_date: dueDate.toISOString().split('T')[0]
    };

    const { data, error } = await supabase
      .from('vat_returns')
      .insert(vatReturn)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}