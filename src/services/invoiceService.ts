
import { Invoice, InvoiceItem } from '@/types';
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
 * Fetches invoices from Supabase
 */
export const fetchInvoicesFromAPI = async (userId?: string) => {
  if (!userId) return [];
  
  try {
    // First, fetch the invoices
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .order('date', { ascending: false });
      
    if (invoicesError) throw invoicesError;
    
    if (!invoicesData || invoicesData.length === 0) {
      return [];
    }

    // Create a map to store invoice items by invoice_id
    const invoiceItemsMap = new Map<string, InvoiceItem[]>();
    
    // Fetch all invoice items for these invoices
    const invoiceIds = invoicesData.map(invoice => invoice.id);
    const { data: itemsData, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .in('invoice_id', invoiceIds);
      
    if (itemsError) throw itemsError;
    
    // Group items by invoice_id
    if (itemsData) {
      for (const item of itemsData) {
        if (!invoiceItemsMap.has(item.invoice_id)) {
          invoiceItemsMap.set(item.invoice_id, []);
        }
        
        invoiceItemsMap.get(item.invoice_id)?.push({
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.total_price
        });
      }
    }
    
    // Map the invoices data with their items
    return invoicesData.map(invoice => ({
      id: invoice.id,
      customerName: invoice.customer_name,
      customerId: invoice.customer_id || undefined,
      date: invoice.date,
      items: invoiceItemsMap.get(invoice.id) || [],
      totalAmount: Number(invoice.total_amount),
      status: invoice.status as 'draft' | 'issued' | 'paid' | 'overdue',
      dueDate: invoice.due_date || undefined,
      synced: true,
    }));
  } catch (error) {
    console.error('Error fetching invoices from API:', error);
    throw error;
  }
};

/**
 * Adds an invoice to Supabase
 */
export const addInvoiceToAPI = async (invoice: Invoice, userId: string) => {
  try {
    // Insert the invoice
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        id: invoice.id,
        customer_id: invoice.customerId,
        customer_name: invoice.customerName,
        date: invoice.date,
        total_amount: invoice.totalAmount,
        status: invoice.status,
        due_date: invoice.dueDate,
        user_id: userId
      })
      .select();
      
    if (invoiceError) throw invoiceError;
    
    if (!invoiceData || invoiceData.length === 0) {
      throw new Error('Failed to insert invoice');
    }
    
    // Insert the invoice items
    const invoiceItems = invoice.items.map(item => ({
      invoice_id: invoice.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice
    }));
    
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems);
      
    if (itemsError) throw itemsError;
    
    return { ...invoice, synced: true };
  } catch (error) {
    console.error('Error adding invoice to API:', error);
    throw error;
  }
};

/**
 * Updates an invoice in Supabase
 */
export const updateInvoiceInAPI = async (invoice: Invoice) => {
  try {
    // Update the invoice
    const { error: invoiceError } = await supabase
      .from('invoices')
      .update({
        customer_id: invoice.customerId,
        customer_name: invoice.customerName,
        date: invoice.date,
        total_amount: invoice.totalAmount,
        status: invoice.status,
        due_date: invoice.dueDate
      })
      .eq('id', invoice.id);
      
    if (invoiceError) throw invoiceError;
    
    // Delete existing items and insert new ones (easier than trying to update)
    const { error: deleteError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', invoice.id);
      
    if (deleteError) throw deleteError;
    
    // Insert the updated invoice items
    const invoiceItems = invoice.items.map(item => ({
      invoice_id: invoice.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice
    }));
    
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems);
      
    if (itemsError) throw itemsError;
    
    return { ...invoice, synced: true };
  } catch (error) {
    console.error('Error updating invoice in API:', error);
    throw error;
  }
};

/**
 * Deletes an invoice from Supabase
 */
export const deleteInvoiceFromAPI = async (invoiceId: string) => {
  try {
    // Delete the invoice (invoice items will be deleted by the CASCADE constraint)
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting invoice from API:', error);
    throw error;
  }
};

/**
 * Gets invoices from local storage
 */
export const getInvoicesFromStorage = (): Invoice[] => {
  return getStoredItems<Invoice>(STORAGE_KEYS.INVOICES);
};

/**
 * Adds an invoice to local storage
 */
export const addInvoiceToStorage = (invoice: Invoice): void => {
  addItem<Invoice>(STORAGE_KEYS.INVOICES, invoice);
};

/**
 * Updates an invoice in local storage
 */
export const updateInvoiceInStorage = (invoice: Invoice): void => {
  updateItem<Invoice>(STORAGE_KEYS.INVOICES, invoice);
};

/**
 * Deletes an invoice from local storage
 */
export const deleteInvoiceFromStorage = (invoiceId: string): void => {
  deleteItem<Invoice>(STORAGE_KEYS.INVOICES, invoiceId);
};
