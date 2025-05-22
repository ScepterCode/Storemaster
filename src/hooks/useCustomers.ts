
import { useState, useEffect } from 'react';
import { Customer } from '@/types';
import { generateId } from '@/lib/formatter';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  fetchCustomersFromAPI,
  addCustomerToAPI,
  updateCustomerInAPI,
  deleteCustomerFromAPI,
  getCustomersFromStorage,
  addCustomerToStorage,
  updateCustomerInStorage,
  deleteCustomerFromStorage
} from '@/services/customerService';

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
  const { toast } = useToast();

  useEffect(() => {
    // Load customers
    const storedCustomers = getCustomersFromStorage();
    setCustomers(storedCustomers);
    
    // If user is authenticated, fetch data from Supabase
    if (user) {
      fetchCustomers();
    } else {
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
      
      toast({
        title: "Error",
        description: "Failed to load customer data. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (customerData: Partial<Customer>) => {
    if (!customerData.name) {
      toast({
        title: "Error",
        description: "Please enter a customer name",
        variant: "destructive",
      });
      return null;
    }

    try {
      setLoading(true);
      
      const customer: Customer = {
        id: generateId(),
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email,
        address: customerData.address,
        synced: false,
      };

      // If user is authenticated, store in Supabase
      if (user) {
        try {
          const syncedCustomer = await addCustomerToAPI(customer, user.id);
          customer.synced = syncedCustomer.synced;
          
          toast({
            title: "Success",
            description: "Customer added successfully",
            variant: "default",
          });
        } catch (err) {
          console.error('Error saving customer to Supabase:', err);
          toast({
            title: "Sync Error",
            description: "Customer saved locally but failed to sync",
            variant: "destructive",
          });
        }
      }

      // Add to local storage
      addCustomerToStorage(customer);

      // Update state
      setCustomers([...customers, customer]);

      // Reset form and close dialog
      setNewCustomer({
        name: '',
        phone: '',
        email: '',
        address: '',
      });
      setCustomerDialogOpen(false);
      
      return customer;
    } catch (err) {
      console.error('Error adding customer:', err);
      setError(err instanceof Error ? err : new Error('Unknown error adding customer'));
      
      toast({
        title: "Error",
        description: "Failed to add customer. Please try again.",
        variant: "destructive",
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
    if (!updatedCustomer.name) {
      toast({
        title: "Error",
        description: "Please enter a customer name",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const customerToUpdate = {
        ...updatedCustomer,
        synced: false,
      };

      // If user is authenticated, update in Supabase
      if (user) {
        try {
          const syncedCustomer = await updateCustomerInAPI(customerToUpdate);
          customerToUpdate.synced = syncedCustomer.synced;
          
          toast({
            title: "Success",
            description: "Customer updated successfully",
            variant: "default",
          });
        } catch (err) {
          console.error('Error updating customer in Supabase:', err);
          toast({
            title: "Sync Error",
            description: "Customer updated locally but failed to sync",
            variant: "destructive",
          });
        }
      }

      // Update in local storage
      updateCustomerInStorage(customerToUpdate);

      // Update state
      setCustomers(customers.map(c => c.id === customerToUpdate.id ? customerToUpdate : c));

    } catch (err) {
      console.error('Error updating customer:', err);
      setError(err instanceof Error ? err : new Error('Unknown error updating customer'));
      
      toast({
        title: "Error",
        description: "Failed to update customer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      setLoading(true);

      // If user is authenticated, delete from Supabase
      if (user) {
        try {
          await deleteCustomerFromAPI(customerId);
          
          toast({
            title: "Success",
            description: "Customer deleted successfully",
            variant: "default",
          });
        } catch (err) {
          console.error('Error deleting customer from Supabase:', err);
          toast({
            title: "Sync Error",
            description: "Customer deleted locally but failed to sync",
            variant: "destructive",
          });
        }
      }

      // Delete from local storage
      deleteCustomerFromStorage(customerId);

      // Update state
      setCustomers(customers.filter(customer => customer.id !== customerId));

    } catch (err) {
      console.error('Error deleting customer:', err);
      setError(err instanceof Error ? err : new Error('Unknown error deleting customer'));
      
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshCustomers = () => {
    fetchCustomers();
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
