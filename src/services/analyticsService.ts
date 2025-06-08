
import { StaffTransaction, SalesAnalytics } from '@/types/manager';

export const generateSalesAnalytics = (transactions: StaffTransaction[]): SalesAnalytics => {
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
