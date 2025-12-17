/**
 * useInvoices Hook
 * 
 * React hook for managing invoice state and operations in the application.
 * Handles invoice CRUD operations, status transitions, and offline-first sync.
 * 
 * @module useInvoices
 * 
 * State Management Pattern:
 * - Loads invoices from local storage immediately on mount
 * - Fetches from API when user is authenticated
 * - Manages current invoice for editing
 * - Clears state on logout
 * 
 * Error Handling Pattern:
 * - Catches all errors from service layer
 * - Displays user-friendly toast notifications
 * - Handles authentication errors with redirect
 * 
 * Invoice Lifecycle:
 * - draft → issued → paid
 * - Validates items before finalization
 * - Calculates total amount automatically
 * 
 * @returns {Object} Invoice state and operations
 * @property {Invoice[]} invoices - Array of all invoices
 * @property {Invoice | null} currentInvoice - Currently selected invoice
 * @property {boolean} loading - Loading state indicator
 * @property {Error | null} error - Current error state
 * @property {Function} createInvoice - Creates a new draft invoice
 * @property {Function} saveInvoice - Saves invoice (create or update)
 * @property {Function} finalizeInvoice - Changes status to 'issued'
 * @property {Function} markAsPaid - Changes status to 'paid'
 * @property {Function} deleteInvoice - Deletes an invoice
 * @property {Function} refreshInvoices - Refreshes invoices from API
 */

import { useState, useEffect } from 'react';
import { Invoice, InvoiceItem } from '@/types';
import { generateId } from '@/lib/formatter';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/components/ui/use-toast';
import {
  fetchInvoicesFromAPI,
  getFromStorage,
  deleteFromAPI,
  deleteFromStorage,
  syncEntity,
} from '@/services/invoiceService';
import { AppError, getUserMessage, logError } from '@/lib/errorHandler';
import { useAuthErrorHandler } from './useAuthErrorHandler';
import { canAddInvoice } from '@/lib/limitChecker';

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const { user } = useAuth();
  const { organization } = useOrganization();
  const { toast } = useToast();
  const { handleError: handleAuthError } = useAuthErrorHandler();

  useEffect(() => {
    // Load invoices from offline storage (scoped by organization)
    try {
      const storedInvoices = getFromStorage(organization?.id);
      setInvoices(storedInvoices);
    } catch (err) {
      console.error('Error loading invoices from storage:', err);
    }
    
    // If user is authenticated and has an organization, fetch data from Supabase
    if (user && organization) {
      fetchInvoices();
    } else {
      // Clear state when user logs out or has no organization
      setInvoices([]);
      setCurrentInvoice(null);
      setLoading(false);
    }
  }, [user, organization]);
  
  const fetchInvoices = async () => {
    if (!user || !organization?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const fetchedInvoices = await fetchInvoicesFromAPI(user.id, organization.id);
      setInvoices(fetchedInvoices);
      
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching invoices'));
      handleAuthError(err, "Failed to load invoice data. Please try again later.");
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
      synced: false,
      lastModified: new Date().toISOString()
    };
  };

  const calculateTotalAmount = (items: InvoiceItem[]): number => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const saveInvoice = async (invoice: Invoice): Promise<boolean> => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to save invoices.",
        variant: "destructive",
      });
      return false;
    }

    if (!organization?.id) {
      toast({
        title: "Organization Required",
        description: "You must belong to an organization to save invoices.",
        variant: "destructive",
      });
      return false;
    }

    const isNew = !invoices.some(inv => inv.id === invoice.id);
    
    // Check invoice limit before creating new invoice
    if (isNew) {
      try {
        const canAdd = await canAddInvoice(organization.id);
        if (!canAdd) {
          setShowUpgradePrompt(true);
          toast({
            title: "Invoice Limit Reached",
            description: "You've reached your plan's monthly invoice limit. Please upgrade to create more invoices.",
            variant: "destructive",
          });
          return false;
        }
      } catch (err) {
        console.error("Error checking invoice limit:", err);
        // Continue with invoice creation if limit check fails
      }
    }

    try {
      setLoading(true);
      setError(null);
      
      const updatedInvoice = {
        ...invoice,
        totalAmount: calculateTotalAmount(invoice.items),
        synced: false,
        lastModified: new Date().toISOString(),
      };
      
      const operation = isNew ? 'create' : 'update';
      
      // Use syncEntity to handle both API and storage
      const result = await syncEntity(updatedInvoice, user.id, operation, organization.id);

      if (result.success && result.data) {
        // Update state with the synced invoice
        if (isNew) {
          setInvoices([...invoices, result.data]);
        } else {
          setInvoices(invoices.map(inv => inv.id === result.data!.id ? result.data! : inv));
        }

        // Update current invoice
        setCurrentInvoice(result.data);

        // Show appropriate message based on sync status
        if (result.synced) {
          toast({
            title: "Success",
            description: `Invoice ${isNew ? 'created' : 'updated'} successfully.`,
            variant: "default",
          });
        } else {
          toast({
            title: "Saved Locally",
            description: `Invoice ${isNew ? 'saved' : 'updated'}. Will sync when connection is restored.`,
            variant: "default",
          });
        }
        
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error saving invoice:', err);
      setError(err instanceof Error ? err : new Error('Unknown error saving invoice'));
      handleAuthError(err, "Failed to save invoice. Please try again.");
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

    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to finalize invoices.",
        variant: "destructive",
      });
      return false;
    }

    if (!organization?.id) {
      toast({
        title: "Organization Required",
        description: "You must belong to an organization to finalize invoices.",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const updatedInvoice = {
        ...invoice,
        status: 'issued' as const,
        synced: false,
        lastModified: new Date().toISOString(),
      };
      
      // Use syncEntity to handle both API and storage
      const result = await syncEntity(updatedInvoice, user.id, 'update', organization.id);

      if (result.success && result.data) {
        // Update state with the synced invoice
        setInvoices(invoices.map(inv => inv.id === result.data!.id ? result.data! : inv));

        // Show appropriate message based on sync status
        if (result.synced) {
          toast({
            title: "Success",
            description: "Invoice finalized successfully.",
            variant: "default",
          });
        } else {
          toast({
            title: "Saved Locally",
            description: "Invoice finalized. Will sync when connection is restored.",
            variant: "default",
          });
        }
        
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error finalizing invoice:', err);
      setError(err instanceof Error ? err : new Error('Unknown error finalizing invoice'));
      handleAuthError(err, "Failed to finalize invoice. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (invoice: Invoice): Promise<boolean> => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to mark invoices as paid.",
        variant: "destructive",
      });
      return false;
    }

    if (!organization?.id) {
      toast({
        title: "Organization Required",
        description: "You must belong to an organization to mark invoices as paid.",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      
      const updatedInvoice = {
        ...invoice,
        status: 'paid' as const,
        synced: false,
        lastModified: new Date().toISOString(),
      };
      
      // Use syncEntity to handle both API and storage
      const result = await syncEntity(updatedInvoice, user.id, 'update', organization.id);

      if (result.success && result.data) {
        // Update state with the synced invoice
        setInvoices(invoices.map(inv => inv.id === result.data!.id ? result.data! : inv));

        // Show appropriate message based on sync status
        if (result.synced) {
          toast({
            title: "Success",
            description: "Invoice marked as paid successfully.",
            variant: "default",
          });
        } else {
          toast({
            title: "Saved Locally",
            description: "Invoice marked as paid. Will sync when connection is restored.",
            variant: "default",
          });
        }
        
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error marking invoice as paid:', err);
      setError(err instanceof Error ? err : new Error('Unknown error marking invoice as paid'));
      handleAuthError(err, "Failed to mark invoice as paid. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (invoiceId: string): Promise<boolean> => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to delete invoices.",
        variant: "destructive",
      });
      return false;
    }

    if (!organization?.id) {
      toast({
        title: "Organization Required",
        description: "You must belong to an organization to delete invoices.",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to delete from API first
      try {
        await deleteFromAPI(invoiceId, organization.id);
        
        toast({
          title: "Success",
          description: "Invoice deleted successfully.",
          variant: "default",
        });
      } catch (apiError) {
        console.warn('Failed to delete from API, deleting locally:', apiError);
        
        toast({
          title: "Deleted Locally",
          description: "Invoice deleted locally. Will sync when connection is restored.",
          variant: "default",
        });
      }

      // Always delete from local storage (scoped by organization)
      deleteFromStorage(invoiceId, organization.id);

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
      handleAuthError(err, "Failed to delete invoice. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshInvoices = async (): Promise<void> => {
    await fetchInvoices();
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
    showUpgradePrompt,
    setShowUpgradePrompt,
  };
};
