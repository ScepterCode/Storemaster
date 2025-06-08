
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { StaffTransaction, CashierPerformance, SalesAnalytics } from '@/types/manager';
import { loadAllTransactions } from '@/services/transactionService';
import { generateStaffPerformance } from '@/services/performanceService';
import { generateSalesAnalytics } from '@/services/analyticsService';
import { generateReport } from '@/services/reportService';

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

  const handleGenerateReport = async (config: any) => {
    await generateReport(config, transactions);
  };

  const refreshTransactions = () => {
    loadManagerData();
  };

  return {
    transactions,
    staffPerformance,
    salesAnalytics,
    loading,
    generateReport: handleGenerateReport,
    refreshTransactions
  };
};
