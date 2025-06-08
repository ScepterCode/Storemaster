
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
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

  const validateString = (value: any, fallback: string): string => {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    return fallback;
  };

  const validateDate = (dateStr: any): string => {
    if (typeof dateStr === 'string' && dateStr.trim().length >= 10) {
      const date = new Date(dateStr.trim());
      if (!isNaN(date.getTime())) {
        return dateStr.trim();
      }
    }
    return new Date().toISOString().split('T')[0];
  };

  const loadManagerData = async () => {
    try {
      setLoading(true);
      
      const allTransactions = loadAllTransactions();
      setTransactions(allTransactions);
      
      const performance = generateStaffPerformance(allTransactions);
      setStaffPerformance(performance);
      
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
    const allSales: StaffTransaction[] = [];
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cashdesk_sales_')) {
        try {
          const sales = JSON.parse(localStorage.getItem(key) || '[]');
          allSales.push(...sales.map((sale: any) => ({
            id: validateString(sale.id, `transaction-${Date.now()}-${Math.random()}`),
            transactionId: validateString(sale.transactionId, `TXN-${Date.now()}`),
            cashierId: validateString(sale.cashierId, 'default_cashier'),
            cashierName: validateString(sale.cashierName, 'Default Cashier'),
            timestamp: validateDate(sale.timestamp),
            items: Array.isArray(sale.items) ? sale.items : [],
            subtotal: Number(sale.subtotal) || 0,
            discountAmount: Number(sale.discountAmount) || 0,
            taxAmount: Number(sale.taxAmount) || 0,
            total: Number(sale.total) || 0,
            paymentMethod: ['cash', 'card', 'transfer', 'wallet', 'split'].includes(sale.paymentMethod) 
              ? sale.paymentMethod : 'cash',
            customer: sale.customer,
            refunded: Boolean(sale.refunded),
            voided: Boolean(sale.voided)
          })));
        } catch (error) {
          console.error('Error parsing sales data:', error);
        }
      }
    });
    
    return allSales.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const generateStaffPerformance = (transactions: StaffTransaction[]): CashierPerformance[] => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const performanceMap = new Map<string, CashierPerformance>();
    
    [today, yesterday].forEach(date => {
      const dayTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.timestamp).toISOString().split('T')[0];
        return transactionDate === date;
      });
      
      const cashierGroups = new Map<string, StaffTransaction[]>();
      
      dayTransactions.forEach(transaction => {
        const cashierId = transaction.cashierId;
        if (!cashierGroups.has(cashierId)) {
          cashierGroups.set(cashierId, []);
        }
        cashierGroups.get(cashierId)!.push(transaction);
      });
      
      cashierGroups.forEach((txns, cashierId) => {
        const key = `${cashierId}-${date}`;
        const totalSales = txns.reduce((sum, t) => sum + t.total, 0);
        const transactionCount = txns.length;
        const refundsIssued = txns.filter(t => t.refunded).length;
        const voidsIssued = txns.filter(t => t.voided).length;
        
        performanceMap.set(key, {
          cashierId: cashierId,
          cashierName: txns[0].cashierName,
          date: date,
          totalSales,
          transactionCount,
          averageTransactionValue: totalSales / (transactionCount || 1),
          refundsIssued,
          voidsIssued,
          cashDiscrepancy: 0,
          hoursWorked: 8,
          topSellingProducts: []
        });
      });
    });
    
    return Array.from(performanceMap.values())
      .filter(perf => perf.cashierId.length > 0 && perf.cashierName.length > 0);
  };

  const generateSalesAnalytics = (transactions: StaffTransaction[]): SalesAnalytics => {
    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = transactions.filter(t => 
      new Date(t.timestamp).toISOString().split('T')[0] === today &&
      !t.refunded && !t.voided
    );
    
    const totalRevenue = todayTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalTransactions = todayTransactions.length;
    
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
    
    const paymentMethodBreakdown: Record<string, number> = {};
    todayTransactions.forEach(transaction => {
      const method = transaction.paymentMethod;
      paymentMethodBreakdown[method] = (paymentMethodBreakdown[method] || 0) + transaction.total;
    });
    
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
    const { type, dateFrom, dateTo, format } = config;
    
    const filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.timestamp).toISOString().split('T')[0];
      return transactionDate >= dateFrom && transactionDate <= dateTo;
    });
    
    if (format === 'csv') {
      downloadCSV(filteredTransactions, type);
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
