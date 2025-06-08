import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { StaffTransaction, CashierPerformance, SalesAnalytics } from '@/types/manager';

export const useManagerData = () => {
  const [transactions, setTransactions] = useState<StaffTransaction[]>([]);
  const [staffPerformance, setStaffPerformance] = useState<CashierPerformance[]>([]);
  const [salesAnalytics, setSalesAnalytics] = useState<SalesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadManagerData();
    }
  }, [user]);

  const loadManagerData = async () => {
    try {
      setLoading(true);
      
      // Load transactions from all cashier sessions
      const allTransactions = loadAllTransactions();
      setTransactions(allTransactions);
      
      // Generate staff performance data
      const performance = generateStaffPerformance(allTransactions);
      setStaffPerformance(performance);
      
      // Generate sales analytics
      const analytics = generateSalesAnalytics(allTransactions);
      setSalesAnalytics(analytics);
      
    } catch (error) {
      console.error('Error loading manager data:', error);
      toast({
        title: "Error",
        description: "Failed to load manager data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAllTransactions = (): StaffTransaction[] => {
    // Load all sales from localStorage across all users/sessions
    const allSales: StaffTransaction[] = [];
    
    // Get all cashdesk sales keys from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cashdesk_sales_')) {
        try {
          const sales = JSON.parse(localStorage.getItem(key) || '[]');
          allSales.push(...sales.map((sale: any) => ({
            id: sale.id || `transaction-${Date.now()}-${Math.random()}`,
            transactionId: sale.transactionId || `TXN-${Date.now()}`,
            cashierId: validateStringValue(sale.cashierId, 'cashier1'),
            cashierName: validateStringValue(sale.cashierName, 'Cashier 1'),
            timestamp: sale.timestamp,
            items: sale.items || [],
            subtotal: sale.subtotal || 0,
            discountAmount: sale.discountAmount || 0,
            taxAmount: sale.taxAmount || 0,
            total: sale.total || 0,
            paymentMethod: determinePaymentMethod(sale.payments),
            customer: sale.customer,
            refunded: sale.status === 'refunded',
            voided: sale.status === 'voided'
          })));
        } catch (error) {
          console.error('Error parsing sales data:', error);
        }
      }
    });
    
    return allSales.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  // Helper function to validate string values and ensure they're never empty
  const validateStringValue = (value: any, fallback: string): string => {
    if (!value || typeof value !== 'string' || value.trim() === '' || value.trim().length === 0) {
      console.log(`validateStringValue: Invalid value "${value}", using fallback "${fallback}"`);
      return fallback;
    }
    return value.trim();
  };

  const determinePaymentMethod = (payments: any[]): 'cash' | 'card' | 'transfer' | 'wallet' | 'split' => {
    if (!payments || payments.length === 0) return 'cash';
    if (payments.length > 1) return 'split';
    return payments[0].type || 'cash';
  };

  const generateStaffPerformance = (transactions: StaffTransaction[]): CashierPerformance[] => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const cashierMap = new Map<string, CashierPerformance>();
    
    // Ensure we always have valid dates
    const validDates = [today, yesterday].filter(date => 
      date && date.length === 10 && !isNaN(new Date(date).getTime())
    );
    
    // Process transactions for valid dates only
    validDates.forEach(date => {
      const dayTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.timestamp).toISOString().split('T')[0];
        return transactionDate === date &&
               t.cashierId &&
               t.cashierId.trim() !== '' &&
               t.cashierId !== 'unknown' &&
               t.cashierName &&
               t.cashierName.trim() !== '' &&
               t.cashierName !== 'Unknown Cashier';
      });
      
      dayTransactions.forEach(transaction => {
        // Extra validation to ensure no empty strings
        const validCashierId = validateStringValue(transaction.cashierId, 'cashier1');
        const validCashierName = validateStringValue(transaction.cashierName, 'Cashier 1');
        const validDate = validateStringValue(date, today);
        
        const key = `${validCashierId}-${validDate}`;
        
        if (!cashierMap.has(key)) {
          cashierMap.set(key, {
            cashierId: validCashierId,
            cashierName: validCashierName,
            date: validDate,
            totalSales: 0,
            transactionCount: 0,
            averageTransactionValue: 0,
            refundsIssued: 0,
            voidsIssued: 0,
            cashDiscrepancy: 0,
            hoursWorked: 8, // Default, could be calculated from session data
            topSellingProducts: []
          });
        }
        
        const performance = cashierMap.get(key)!;
        performance.totalSales += transaction.total;
        performance.transactionCount += 1;
        
        if (transaction.refunded) performance.refundsIssued += 1;
        if (transaction.voided) performance.voidsIssued += 1;
      });
    });
    
    // Calculate averages and finalize data
    Array.from(cashierMap.values()).forEach(performance => {
      performance.averageTransactionValue = performance.totalSales / (performance.transactionCount || 1);
    });
    
    const result = Array.from(cashierMap.values());
    console.log('generateStaffPerformance: Final result:', result);
    
    // Final validation - ensure no empty strings in the result
    return result.filter(perf => 
      perf.cashierId && 
      perf.cashierId.trim() !== '' && 
      perf.cashierName && 
      perf.cashierName.trim() !== '' &&
      perf.date && 
      perf.date.trim() !== ''
    );
  };

  const generateSalesAnalytics = (transactions: StaffTransaction[]): SalesAnalytics => {
    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = transactions.filter(t => 
      new Date(t.timestamp).toISOString().split('T')[0] === today &&
      !t.refunded && !t.voided
    );
    
    const totalRevenue = todayTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalTransactions = todayTransactions.length;
    
    // Calculate hourly distribution
    const hourlyMap = new Map<number, { count: number; revenue: number }>();
    todayTransactions.forEach(transaction => {
      const hour = new Date(transaction.timestamp).getHours();
      const existing = hourlyMap.get(hour) || { count: 0, revenue: 0 };
      hourlyMap.set(hour, {
        count: existing.count + 1,
        revenue: existing.revenue + transaction.total
      });
    });
    
    const peakHours = Array.from(hourlyMap.entries())
      .map(([hour, data]) => ({
        hour,
        transactionCount: data.count,
        revenue: data.revenue
      }))
      .sort((a, b) => b.transactionCount - a.transactionCount);
    
    // Calculate payment method breakdown
    const paymentMethodBreakdown: Record<string, number> = {};
    todayTransactions.forEach(transaction => {
      const method = transaction.paymentMethod;
      paymentMethodBreakdown[method] = (paymentMethodBreakdown[method] || 0) + transaction.total;
    });
    
    // Calculate top selling products
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    todayTransactions.forEach(transaction => {
      transaction.items.forEach(item => {
        const existing = productMap.get(item.id) || { name: item.name, quantity: 0, revenue: 0 };
        productMap.set(item.id, {
          name: item.name,
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + item.total
        });
      });
    });
    
    const topSellingProducts = Array.from(productMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        quantitySold: data.quantity,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue);
    
    return {
      totalRevenue,
      totalTransactions,
      averageTransactionValue: totalRevenue / (totalTransactions || 1),
      topSellingProducts,
      peakHours,
      paymentMethodBreakdown
    };
  };

  const generateReport = async (config: any) => {
    // Implementation for generating and downloading reports
    const { type, dateFrom, dateTo, format } = config;
    
    // Filter transactions based on config
    const filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.timestamp).toISOString().split('T')[0];
      return transactionDate >= dateFrom && transactionDate <= dateTo;
    });
    
    if (format === 'csv') {
      downloadCSV(filteredTransactions, type);
    } else if (format === 'pdf') {
      // PDF generation would be implemented here
      console.log('PDF generation not yet implemented');
    }
  };

  const downloadCSV = (data: StaffTransaction[], type: string) => {
    const headers = [
      'Transaction ID',
      'Date',
      'Time',
      'Cashier',
      'Items Count',
      'Subtotal',
      'Discount',
      'Tax',
      'Total',
      'Payment Method',
      'Customer'
    ];
    
    const csvContent = [
      headers.join(','),
      ...data.map(transaction => [
        transaction.transactionId,
        new Date(transaction.timestamp).toLocaleDateString(),
        new Date(transaction.timestamp).toLocaleTimeString(),
        transaction.cashierName,
        transaction.items.length,
        transaction.subtotal.toFixed(2),
        transaction.discountAmount.toFixed(2),
        transaction.taxAmount.toFixed(2),
        transaction.total.toFixed(2),
        transaction.paymentMethod,
        transaction.customer?.name || 'Walk-in'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const refreshTransactions = () => {
    loadManagerData();
  };

  return {
    transactions,
    staffPerformance,
    salesAnalytics,
    loading,
    generateReport,
    refreshTransactions
  };
};
