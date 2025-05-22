
import { Customer } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { 
  STORAGE_KEYS, 
  getStoredItems, 
  storeItems, 
  addItem, 
  updateItem, 
  deleteItem 
} from '@/lib/offlineStorage';

/**
 * Fetches customers from Supabase
 */
export const fetchCustomersFromAPI = async (userId?: string) => {
  if (!userId) return [];
  
  try {
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .order('name');
      
    if (customersError) throw customersError;
    
    if (customersData) {
      return customersData.map(customer => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone || undefined,
        email: customer.email || undefined,
        address: customer.address || undefined,
        synced: true,
      }));
    }
  } catch (error) {
    console.error('Error fetching customers from API:', error);
    throw error;
  }
  
  return [];
};

/**
 * Adds a customer to Supabase
 */
export const addCustomerToAPI = async (customer: Customer, userId: string) => {
  try {
    const { error } = await supabase
      .from('customers')
      .insert({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        user_id: userId
      });
      
    if (error) throw error;
    return { ...customer, synced: true };
  } catch (error) {
    console.error('Error adding customer to API:', error);
    throw error;
  }
};

/**
 * Updates a customer in Supabase
 */
export const updateCustomerInAPI = async (customer: Customer) => {
  try {
    const { error } = await supabase
      .from('customers')
      .update({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
      })
      .eq('id', customer.id);
      
    if (error) throw error;
    return { ...customer, synced: true };
  } catch (error) {
    console.error('Error updating customer in API:', error);
    throw error;
  }
};

/**
 * Deletes a customer from Supabase
 */
export const deleteCustomerFromAPI = async (customerId: string) => {
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting customer from API:', error);
    throw error;
  }
};

/**
 * Gets customers from local storage
 */
export const getCustomersFromStorage = (): Customer[] => {
  return getStoredItems<Customer>(STORAGE_KEYS.CUSTOMERS);
};

/**
 * Adds a customer to local storage
 */
export const addCustomerToStorage = (customer: Customer): void => {
  addItem<Customer>(STORAGE_KEYS.CUSTOMERS, customer);
};

/**
 * Updates a customer in local storage
 */
export const updateCustomerInStorage = (customer: Customer): void => {
  updateItem<Customer>(STORAGE_KEYS.CUSTOMERS, customer);
};

/**
 * Deletes a customer from local storage
 */
export const deleteCustomerFromStorage = (customerId: string): void => {
  deleteItem<Customer>(STORAGE_KEYS.CUSTOMERS, customerId);
};
