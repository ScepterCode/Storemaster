
import { useState, useEffect } from 'react';
import { Invoice, InvoiceItem } from '@/types';
import { generateId } from '@/lib/formatter';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  fetchInvoicesFromAPI,
  addInvoiceToAPI,
  updateInvoiceInAPI,
  deleteInvoiceFromAPI,
  getInvoicesFromStorage,
  addInvoiceToStorage,
  updateInvoiceInStorage,
  deleteInvoiceFromStorage
} from '@/services/invoiceService';

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Load invoices
    const storedInvoices = getInvoicesFromStorage();
    setInvoices(storedInvoices);
    
    // If user is authenticated, fetch data from Supabase
    if (user) {
      fetchInvoices();
    } else {
      setLoading(false);
    }
  }, [user]);
  
  const fetchInvoices = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const fetchedInvoices = await fetchInvoicesFromAPI(user.id);
      setInvoices(fetchedInvoices);
      
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching invoices'));
      
      toast({
        title: "Error",
        description: "Failed to load invoice data. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createInvoice = (customerName: string, customerId?: string): Invoice => {
    return {
      id: generateId(),
      customerName,
      customerId,
      date: new Date().toISOString().split('T')[0],
      items: [],
      totalAmount: 0,
      status: 'draft',
      synced: false
    };
  };

  const calculateTotalAmount = (items: InvoiceItem[]): number => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const saveInvoice = async (invoice: Invoice): Promise<boolean> => {
    try {
      setLoading(true);
      
      const updatedInvoice = {
        ...invoice,
        totalAmount: calculateTotalAmount(invoice.items),
        synced: false,
      };
      
      const isNew = !invoices.some(inv => inv.id === updatedInvoice.id);
      
      // If user is authenticated, store in Supabase
      if (user) {
        try {
          if (isNew) {
            const syncedInvoice = await addInvoiceToAPI(updatedInvoice, user.id);
            updatedInvoice.synced = syncedInvoice.synced;
          } else {
            const syncedInvoice = await updateInvoiceInAPI(updatedInvoice);
            updatedInvoice.synced = syncedInvoice.synced;
          }
          
          toast({
            title: "Success",
            description: `Invoice ${isNew ? 'created' : 'updated'} successfully`,
            variant: "default",
          });
        } catch (err) {
          console.error(`Error ${isNew ? 'saving' : 'updating'} invoice to Supabase:`, err);
          toast({
            title: "Sync Error",
            description: `Invoice ${isNew ? 'saved' : 'updated'} locally but failed to sync`,
            variant: "destructive",
          });
        }
      }

      // Update local storage
      if (isNew) {
        addInvoiceToStorage(updatedInvoice);
        setInvoices([...invoices, updatedInvoice]);
      } else {
        updateInvoiceInStorage(updatedInvoice);
        setInvoices(invoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
      }

      // Update current invoice
      setCurrentInvoice(updatedInvoice);
      
      return true;
    } catch (err) {
      console.error('Error saving invoice:', err);
      setError(err instanceof Error ? err : new Error('Unknown error saving invoice'));
      
      toast({
        title: "Error",
        description: "Failed to save invoice. Please try again.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const finalizeInvoice = async (invoice: Invoice): Promise<boolean> => {
    if (invoice.items.length === 0) {
      toast({
        title: "Error",
        description: "Cannot finalize an empty invoice",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      setLoading(true);
      
      const updatedInvoice = {
        ...invoice,
        status: 'issued' as const,
        synced: false,
      };
      
      // Update local storage and state before API call
      updateInvoiceInStorage(updatedInvoice);
      setInvoices(invoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
      
      // If user is authenticated, update in Supabase
      if (user) {
        try {
          const syncedInvoice = await updateInvoiceInAPI(updatedInvoice);
          updatedInvoice.synced = syncedInvoice.synced;
          
          // Update state again with synced status
          setInvoices(invoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
          updateInvoiceInStorage(updatedInvoice);
          
          toast({
            title: "Success",
            description: "Invoice finalized successfully",
            variant: "default",
          });
        } catch (err) {
          console.error('Error finalizing invoice in Supabase:', err);
          toast({
            title: "Sync Error",
            description: "Invoice finalized locally but failed to sync",
            variant: "destructive",
          });
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error finalizing invoice:', err);
      setError(err instanceof Error ? err : new Error('Unknown error finalizing invoice'));
      
      toast({
        title: "Error",
        description: "Failed to finalize invoice. Please try again.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (invoice: Invoice): Promise<boolean> => {
    try {
      setLoading(true);
      
      const updatedInvoice = {
        ...invoice,
        status: 'paid' as const,
        synced: false,
      };
      
      // Update local storage and state before API call
      updateInvoiceInStorage(updatedInvoice);
      setInvoices(invoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
      
      // If user is authenticated, update in Supabase
      if (user) {
        try {
          const syncedInvoice = await updateInvoiceInAPI(updatedInvoice);
          updatedInvoice.synced = syncedInvoice.synced;
          
          // Update state again with synced status
          setInvoices(invoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
          updateInvoiceInStorage(updatedInvoice);
          
          toast({
            title: "Success",
            description: "Invoice marked as paid successfully",
            variant: "default",
          });
        } catch (err) {
          console.error('Error marking invoice as paid in Supabase:', err);
          toast({
            title: "Sync Error",
            description: "Invoice marked as paid locally but failed to sync",
            variant: "destructive",
          });
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error marking invoice as paid:', err);
      setError(err instanceof Error ? err : new Error('Unknown error marking invoice as paid'));
      
      toast({
        title: "Error",
        description: "Failed to mark invoice as paid. Please try again.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (invoiceId: string): Promise<boolean> => {
    try {
      setLoading(true);

      // If user is authenticated, delete from Supabase
      if (user) {
        try {
          await deleteInvoiceFromAPI(invoiceId);
          
          toast({
            title: "Success",
            description: "Invoice deleted successfully",
            variant: "default",
          });
        } catch (err) {
          console.error('Error deleting invoice from Supabase:', err);
          toast({
            title: "Sync Error",
            description: "Invoice deleted locally but failed to sync",
            variant: "destructive",
          });
        }
      }

      // Delete from local storage
      deleteInvoiceFromStorage(invoiceId);

      // Update state
      setInvoices(invoices.filter(invoice => invoice.id !== invoiceId));
      
      // Clear current invoice if it was deleted
      if (currentInvoice && currentInvoice.id === invoiceId) {
        setCurrentInvoice(null);
      }

      return true;
    } catch (err) {
      console.error('Error deleting invoice:', err);
      setError(err instanceof Error ? err : new Error('Unknown error deleting invoice'));
      
      toast({
        title: "Error",
        description: "Failed to delete invoice. Please try again.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshInvoices = () => {
    fetchInvoices();
  };

  return {
    invoices,
    setInvoices,
    currentInvoice,
    setCurrentInvoice,
    createInvoice,
    saveInvoice,
    finalizeInvoice,
    markAsPaid,
    deleteInvoice,
    loading,
    error,
    refreshInvoices,
  };
};
