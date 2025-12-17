/**
 * useCustomers Hook
 * 
 * React hook for managing customer state and operations in the application.
 * Handles customer CRUD operations, offline-first sync, and authentication state changes.
 * 
 * @module useCustomers
 * 
 * State Management Pattern:
 * - Loads customers from local storage immediately on mount
 * - Fetches from API when user is authenticated
 * - Clears state on logout
 * 
 * Error Handling Pattern:
 * - Catches all errors from service layer
 * - Displays user-friendly toast notifications
 * - Handles authentication errors with redirect
 * 
 * @returns {Object} Customer state and operations
 * @property {Customer[]} customers - Array of all customers
 * @property {boolean} loading - Loading state indicator
 * @property {Error | null} error - Current error state
 * @property {Function} handleAddCustomer - Creates a new customer
 * @property {Function} handleUpdateCustomer - Updates an existing customer
 * @property {Function} handleDeleteCustomer - Deletes a customer
 * @property {Function} refreshCustomers - Refreshes customers from API
 */

import { useState, useEffect } from 'react';
import { Customer } from '@/types';
import { generateId } from '@/lib/formatter';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/components/ui/use-toast';
import {
  fetchCustomersFromAPI,
  getFromStorage,
  deleteFromAPI,
  deleteFromStorage,
  syncEntity,
} from '@/services/customerService';
import { AppError, getUserMessage, logError } from '@/lib/errorHandler';
import { useAuthErrorHandler } from './useAuthErrorHandler';

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { organization } = useOrganization();
  const { toast } = useToast();
  const { handleError: handleAuthError } = useAuthErrorHandler();

  useEffect(() => {
    // Load customers from offline storage
    try {
      const storedCustomers = getFromStorage();
      setCustomers(storedCustomers);
    } catch (err) {
      console.error('Error loading customers from storage:', err);
    }

    // If user is authenticated, fetch data from Supabase
    if (user) {
      fetchCustomers();
    } else {
      // Clear state when user logs out
      setCustomers([]);
      setLoading(false);
    }
  }, [user]);

  const fetchCustomers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const fetchedCustomers = await fetchCustomersFromAPI(user.id);
      setCustomers(fetchedCustomers);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching customers'));
      handleAuthError(err, 'Failed to load customer data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (customerData: Partial<Customer>): Promise<Customer | null> => {
    if (!customerData.name) {
      toast({
        title: 'Error',
        description: 'Please enter a customer name',
        variant: 'destructive',
      });
      return null;
    }

    if (!user?.id) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to add customers.',
        variant: 'destructive',
      });
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const customer: Customer = {
        id: generateId(),
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email,
        address: customerData.address,
        synced: false,
        lastModified: new Date().toISOString(),
      };

      // Use syncEntity to handle both API and storage
      const result = await syncEntity(customer, user.id, 'create', organization?.id);

      if (result.success && result.data) {
        // Update state with the synced customer
        setCustomers([...customers, result.data]);

        // Show appropriate message based on sync status
        if (result.synced) {
          toast({
            title: 'Success',
            description: 'Customer added successfully.',
            variant: 'default',
          });
        } else {
          toast({
            title: 'Saved Locally',
            description: 'Customer saved. Will sync when connection is restored.',
            variant: 'default',
          });
        }

        // Reset form and close dialog
        setNewCustomer({
          name: '',
          phone: '',
          email: '',
          address: '',
        });
        setCustomerDialogOpen(false);

        return result.data;
      }

      return null;
    } catch (err) {
      console.error('Error adding customer:', err);
      setError(err instanceof Error ? err : new Error('Unknown error adding customer'));
      handleAuthError(err, 'Failed to add customer. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCustomer = async (updatedCustomer: Customer): Promise<boolean> => {
    if (!updatedCustomer.id) {
      toast({
        title: 'Error',
        description: 'Cannot update customer without an ID',
        variant: 'destructive',
      });
      return false;
    }

    if (!updatedCustomer.name) {
      toast({
        title: 'Error',
        description: 'Please enter a customer name',
        variant: 'destructive',
      });
      return false;
    }

    if (!user?.id) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to update customers.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      // Use syncEntity to handle both API and storage
      const result = await syncEntity(updatedCustomer, user.id, 'update', organization?.id);

      if (result.success && result.data) {
        // Update state with the synced customer
        setCustomers(customers.map((c) => (c.id === result.data!.id ? result.data! : c)));

        // Show appropriate message based on sync status
        if (result.synced) {
          toast({
            title: 'Success',
            description: 'Customer updated successfully.',
            variant: 'default',
          });
        } else {
          toast({
            title: 'Saved Locally',
            description: 'Customer updated. Will sync when connection is restored.',
            variant: 'default',
          });
        }

        return true;
      }

      return false;
    } catch (err) {
      console.error('Error updating customer:', err);
      setError(err instanceof Error ? err : new Error('Unknown error updating customer'));
      handleAuthError(err, 'Failed to update customer. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (customerId: string): Promise<boolean> => {
    if (!user?.id) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to delete customers.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to delete from API first
      try {
        await deleteFromAPI(customerId);

        toast({
          title: 'Success',
          description: 'Customer deleted successfully.',
          variant: 'default',
        });
      } catch (apiError) {
        console.warn('Failed to delete from API, deleting locally:', apiError);

        toast({
          title: 'Deleted Locally',
          description: 'Customer deleted locally. Will sync when connection is restored.',
          variant: 'default',
        });
      }

      // Always delete from local storage
      deleteFromStorage(customerId);

      // Update state
      setCustomers(customers.filter((customer) => customer.id !== customerId));

      return true;
    } catch (err) {
      console.error('Error deleting customer:', err);
      setError(err instanceof Error ? err : new Error('Unknown error deleting customer'));
      handleAuthError(err, 'Failed to delete customer. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshCustomers = async (): Promise<void> => {
    await fetchCustomers();
  };

  return {
    customers,
    setCustomers,
    customerDialogOpen,
    setCustomerDialogOpen,
    newCustomer,
    setNewCustomer,
    handleAddCustomer,
    handleUpdateCustomer,
    handleDeleteCustomer,
    loading,
    error,
    refreshCustomers,
  };
};
