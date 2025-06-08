
import { StaffTransaction, CashierPerformance } from '@/types/manager';

export const generateStaffPerformance = (transactions: StaffTransaction[]): CashierPerformance[] => {
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
