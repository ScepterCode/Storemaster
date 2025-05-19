
import { useState, useEffect } from 'react';
import { Transaction } from '@/types';
import { getStoredItems, addItem, STORAGE_KEYS } from '@/lib/offlineStorage';
import { generateId } from '@/lib/formatter';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    setLoading(true);
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
      } else if (data) {
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
      // Fall back to local storage
      const storedTransactions = getStoredItems<Transaction>(STORAGE_KEYS.TRANSACTIONS);
      setTransactions(storedTransactions);
    } finally {
      setLoading(false);
    }
  }

  async function addTransaction(newTransaction: Partial<Transaction>) {
    if (!newTransaction.amount || !newTransaction.description || !newTransaction.date || !newTransaction.type) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // TypeScript type assertion for transaction.type
    const transactionType = newTransaction.type as 'sale' | 'purchase' | 'expense';

    const transaction: Transaction = {
      id: generateId(),
      amount: Number(newTransaction.amount),
      description: newTransaction.description,
      date: newTransaction.date,
      type: transactionType,
      category: newTransaction.category,
      reference: newTransaction.reference,
      synced: false,
    };

    try {
      // Try to add to Supabase first
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          id: transaction.id,
          amount: transaction.amount,
          description: transaction.description,
          date: transaction.date,
          type: transaction.type,
          category: transaction.category,
          reference: transaction.reference,
        })
        .select();

      if (error) {
        console.error('Error adding transaction to Supabase:', error);
        // Fall back to local storage
        addItem<Transaction>(STORAGE_KEYS.TRANSACTIONS, transaction);
        setTransactions([...transactions, transaction]);
      } else if (data) {
        // Mark as synced and update with the returned data
        const syncedTransaction: Transaction = {
          ...transaction,
          synced: true,
        };
        setTransactions([...transactions, syncedTransaction]);
      }

      toast({
        title: "Transaction Added",
        description: "Your transaction has been recorded successfully",
      });
      
      return true;
    } catch (err) {
      console.error('Failed to add transaction:', err);
      // Fall back to local storage
      addItem<Transaction>(STORAGE_KEYS.TRANSACTIONS, transaction);
      setTransactions([...transactions, transaction]);
      
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
    addTransaction,
    refreshTransactions: loadTransactions,
  };
}
