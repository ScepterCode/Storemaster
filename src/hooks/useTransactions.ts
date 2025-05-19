
import { useState, useEffect } from 'react';
import { Transaction } from '@/types';
import { getStoredItems, addItem, STORAGE_KEYS } from '@/lib/offlineStorage';
import { generateId } from '@/lib/formatter';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Separate data model for Supabase insert operations
type SupabaseTransaction = {
  id: string;
  amount: number;
  description: string | null;
  date: string;
  type: string;
  category?: string | null;
  reference?: string | null;
  product_id?: string | null;
  quantity?: number | null;
  user_id: string;
};

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTransactions();
  }, []);

  // Separated data fetching logic
  async function loadTransactions() {
    setLoading(true);
    setError(null);
    
    try {
      // Try to load from Supabase first
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading transactions from Supabase:', error);
        // Fall back to local storage
        const storedTransactions = getStoredItems<Transaction>(STORAGE_KEYS.TRANSACTIONS);
        setTransactions(storedTransactions);
        throw new Error(`Failed to load from Supabase: ${error.message}`);
      } 
      
      if (data) {
        // Map Supabase data to our Transaction type
        const mappedTransactions: Transaction[] = data.map(item => ({
          id: item.id,
          amount: Number(item.amount),
          description: item.description || '',
          date: item.date,
          type: item.type as 'sale' | 'purchase' | 'expense',
          category: item.category || undefined,
          reference: item.reference || undefined,
          synced: true,
        }));
        setTransactions(mappedTransactions);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
      // Set error state but still try to load from local storage as fallback
      setError(err instanceof Error ? err : new Error('Unknown error loading transactions'));
      
      // Fall back to local storage
      const storedTransactions = getStoredItems<Transaction>(STORAGE_KEYS.TRANSACTIONS);
      setTransactions(storedTransactions);
    } finally {
      setLoading(false);
    }
  }

  // Validate transaction data
  function validateTransaction(transaction: Partial<Transaction>): boolean {
    if (!transaction.amount || !transaction.description || !transaction.date || !transaction.type) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return false;
    }
    return true;
  }

  // Prepare transaction for Supabase
  function prepareTransactionForSupabase(transaction: Transaction): SupabaseTransaction {
    return {
      id: transaction.id,
      amount: transaction.amount,
      description: transaction.description,
      date: transaction.date,
      type: transaction.type,
      category: transaction.category,
      reference: transaction.reference,
      // Hardcoded anonymous user ID for demo purposes
      // In a real app, you would get this from auth context
      user_id: '00000000-0000-0000-0000-000000000000',
    };
  }

  async function addTransaction(newTransaction: Partial<Transaction>): Promise<boolean> {
    if (!validateTransaction(newTransaction)) {
      return false;
    }

    // TypeScript type assertion for transaction.type
    const transactionType = newTransaction.type as 'sale' | 'purchase' | 'expense';

    const transaction: Transaction = {
      id: generateId(),
      amount: Number(newTransaction.amount),
      description: newTransaction.description || '',
      date: newTransaction.date || '',
      type: transactionType,
      category: newTransaction.category,
      reference: newTransaction.reference,
      synced: false,
    };

    try {
      // Prepare data for Supabase
      const supabaseTransaction = prepareTransactionForSupabase(transaction);
      
      // Try to add to Supabase first
      const { data, error } = await supabase
        .from('transactions')
        .insert(supabaseTransaction)
        .select();

      if (error) {
        console.error('Error adding transaction to Supabase:', error);
        // Fall back to local storage
        addItem<Transaction>(STORAGE_KEYS.TRANSACTIONS, transaction);
        setTransactions(prev => [transaction, ...prev]);
        
        toast({
          title: "Transaction Added Offline",
          description: "Your transaction has been saved locally and will sync when you're back online",
        });
      } else if (data) {
        // Mark as synced and update with the returned data
        const syncedTransaction: Transaction = {
          ...transaction,
          synced: true,
        };
        setTransactions(prev => [syncedTransaction, ...prev]);
        
        toast({
          title: "Transaction Added",
          description: "Your transaction has been recorded successfully",
        });
      }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error adding transaction'));
      console.error('Failed to add transaction:', err);
      
      // Fall back to local storage
      addItem<Transaction>(STORAGE_KEYS.TRANSACTIONS, transaction);
      setTransactions(prev => [transaction, ...prev]);
      
      toast({
        title: "Transaction Added Offline",
        description: "Your transaction has been saved locally and will sync when you're back online",
      });
      
      return true;
    }
  }

  return {
    transactions,
    loading,
    error,
    addTransaction,
    refreshTransactions: loadTransactions,
  };
}
