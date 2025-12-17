/**
 * useTransactions Hook
 * 
 * React hook for managing transaction state and operations in the application.
 * Handles transaction CRUD operations, offline-first sync, and data validation.
 * 
 * @module useTransactions
 * 
 * State Management Pattern:
 * - Loads transactions from local storage immediately on mount
 * - Fetches from API when user is authenticated
 * - Clears state on logout
 * - Sorts transactions by date (newest first)
 * 
 * Error Handling Pattern:
 * - Catches all errors from service layer
 * - Displays user-friendly toast notifications
 * - Handles authentication errors with redirect
 * - Validates required fields before operations
 * 
 * Transaction Types:
 * - sale: Revenue from sales
 * - purchase: Inventory purchases
 * - expense: Business expenses
 * 
 * @returns {Object} Transaction state and operations
 * @property {Transaction[]} transactions - Array of all transactions
 * @property {boolean} loading - Loading state indicator
 * @property {Error | null} error - Current error state
 * @property {Function} addTransaction - Creates a new transaction
 * @property {Function} updateTransaction - Updates an existing transaction
 * @property {Function} deleteTransaction - Deletes a transaction
 * @property {Function} refreshTransactions - Refreshes transactions from API
 */

import { useState, useEffect } from 'react';
import { Transaction } from '@/types';
import { generateId } from '@/lib/formatter';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/components/ui/use-toast';
import {
  fetchFromAPI,
  getFromStorage,
  deleteFromAPI,
  deleteFromStorage,
  syncEntity,
} from '@/services/transactionService';
import { AppError, getUserMessage, logError } from '@/lib/errorHandler';
import { useAuthErrorHandler } from './useAuthErrorHandler';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { organization } = useOrganization();
  const { toast } = useToast();
  const { handleError: handleAuthError } = useAuthErrorHandler();

  useEffect(() => {
    // Load transactions from offline storage (scoped by organization)
    try {
      const storedTransactions = getFromStorage(organization?.id);
      setTransactions(storedTransactions);
    } catch (err) {
      console.error("Error loading transactions from storage:", err);
    }

    // If user is authenticated and has an organization, fetch data from Supabase
    if (user && organization) {
      fetchTransactions();
    } else {
      // Clear state when user logs out or has no organization
      setTransactions([]);
      setLoading(false);
    }
  }, [user, organization?.id]);

  const fetchTransactions = async () => {
    if (!user || !organization?.id) return;

    try {
      setLoading(true);
      setError(null);

      const fetchedTransactions = await fetchFromAPI(user.id, organization.id);
      setTransactions(fetchedTransactions);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(err instanceof Error ? err : new Error("Unknown error fetching transactions"));
      handleAuthError(err, "Failed to load transaction data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (newTransaction: Partial<Transaction>): Promise<boolean> => {
    if (!newTransaction.amount || !newTransaction.description || !newTransaction.date || !newTransaction.type) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return false;
    }

    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to add transactions.",
        variant: "destructive",
      });
      return false;
    }

    if (!organization?.id) {
      toast({
        title: "Organization Required",
        description: "You must belong to an organization to add transactions.",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const transaction: Transaction = {
        id: generateId(),
        amount: Number(newTransaction.amount),
        description: newTransaction.description,
        date: newTransaction.date,
        type: newTransaction.type as 'sale' | 'purchase' | 'expense',
        category: newTransaction.category,
        reference: newTransaction.reference,
        synced: false,
        lastModified: new Date().toISOString(),
      };

      // Use syncEntity to handle both API and storage
      const result = await syncEntity(transaction, user.id, 'create', organization.id);

      if (result.success && result.data) {
        // Update state with the synced transaction
        setTransactions([result.data, ...transactions]);

        // Show appropriate message based on sync status
        if (result.synced) {
          toast({
            title: "Success",
            description: "Transaction added successfully.",
            variant: "default",
          });
        } else {
          toast({
            title: "Saved Locally",
            description: "Transaction saved. Will sync when connection is restored.",
            variant: "default",
          });
        }

        return true;
      }

      return false;
    } catch (err) {
      console.error("Error adding transaction:", err);
      setError(err instanceof Error ? err : new Error("Unknown error adding transaction"));
      handleAuthError(err, "Failed to add transaction. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateTransaction = async (updatedTransaction: Transaction): Promise<boolean> => {
    if (!updatedTransaction.id) {
      toast({
        title: "Error",
        description: "Cannot update transaction without an ID",
        variant: "destructive",
      });
      return false;
    }

    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to update transactions.",
        variant: "destructive",
      });
      return false;
    }

    if (!organization?.id) {
      toast({
        title: "Organization Required",
        description: "You must belong to an organization to update transactions.",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      // Use syncEntity to handle both API and storage
      const result = await syncEntity(updatedTransaction, user.id, 'update', organization.id);

      if (result.success && result.data) {
        // Update state with the synced transaction
        setTransactions(transactions.map((t) => (t.id === result.data!.id ? result.data! : t)));

        // Show appropriate message based on sync status
        if (result.synced) {
          toast({
            title: "Success",
            description: "Transaction updated successfully.",
            variant: "default",
          });
        } else {
          toast({
            title: "Saved Locally",
            description: "Transaction updated. Will sync when connection is restored.",
            variant: "default",
          });
        }

        return true;
      }

      return false;
    } catch (err) {
      console.error("Error updating transaction:", err);
      setError(err instanceof Error ? err : new Error("Unknown error updating transaction"));
      handleAuthError(err, "Failed to update transaction. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (transactionId: string): Promise<boolean> => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to delete transactions.",
        variant: "destructive",
      });
      return false;
    }

    if (!organization?.id) {
      toast({
        title: "Organization Required",
        description: "You must belong to an organization to delete transactions.",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to delete from API first
      try {
        await deleteFromAPI(transactionId);
        
        toast({
          title: "Success",
          description: "Transaction deleted successfully.",
          variant: "default",
        });
      } catch (apiError) {
        console.warn("Failed to delete from API, deleting locally:", apiError);
        
        toast({
          title: "Deleted Locally",
          description: "Transaction deleted locally. Will sync when connection is restored.",
          variant: "default",
        });
      }

      // Always delete from local storage (scoped by organization)
      deleteFromStorage(transactionId, organization.id);

      // Update state
      setTransactions(transactions.filter((transaction) => transaction.id !== transactionId));

      return true;
    } catch (err) {
      console.error("Error deleting transaction:", err);
      setError(err instanceof Error ? err : new Error("Unknown error deleting transaction"));
      handleAuthError(err, "Failed to delete transaction. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshTransactions = async (): Promise<void> => {
    await fetchTransactions();
  };

  return {
    transactions,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refreshTransactions,
  };
}