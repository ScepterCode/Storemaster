
import { useState } from 'react';
import { Customer } from '@/types';
import { useCustomers } from './useCustomers';
import { useToast } from '@/components/ui/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

export const useCashDeskCustomers = () => {
  const { customers, handleAddCustomer, refreshCustomers } = useCustomers();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const { canEditCashDesk } = usePermissions();
  const { toast } = useToast();
  
  const handleCustomerSelect = (customer: Customer | null) => {
    console.log('Selected customer:', customer);
    setSelectedCustomer(customer);
    setShowNewCustomerForm(false);
  };
  
  const createNewCustomer = async (customerData: Partial<Customer>) => {
    if (!canEditCashDesk) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to create customers",
        variant: "destructive",
      });
      return null;
    }
    
    console.log('Creating new customer:', customerData);
    const newCustomer = await handleAddCustomer(customerData);
    
    if (newCustomer) {
      setSelectedCustomer(newCustomer);
      setShowNewCustomerForm(false);
      refreshCustomers();
    }
    
    return newCustomer;
  };

  const clearSelectedCustomer = () => {
    setSelectedCustomer(null);
  };

  return {
    customers,
    selectedCustomer,
    showNewCustomerForm,
    setShowNewCustomerForm,
    handleCustomerSelect,
    createNewCustomer,
    clearSelectedCustomer,
  };
};
