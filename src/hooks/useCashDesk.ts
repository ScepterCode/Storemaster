
import { useState } from 'react';
import { useProducts } from './useProducts';
import { useCart } from './useCart';
import { useCashDeskCustomers } from './useCashDeskCustomers';
import { useCashDeskInvoices } from './useCashDeskInvoices';
import { useCashDeskPayment } from './useCashDeskPayment';

export const useCashDesk = () => {
  const { products, refreshProducts } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  
  const {
    cart,
    cartTotal,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  
  const {
    customers,
    selectedCustomer,
    showNewCustomerForm,
    setShowNewCustomerForm,
    handleCustomerSelect,
    createNewCustomer,
    clearSelectedCustomer,
  } = useCashDeskCustomers();
  
  const {
    currentInvoice,
    createNewInvoice,
    saveCurrentInvoice,
    finalizeCurrentInvoice,
    markAsPaid,
    generateReceipt,
  } = useCashDeskInvoices();
  
  const {
    paymentDetails,
    setPaymentDetails,
    processPayment,
  } = useCashDeskPayment();

  const filteredProducts = products
    .filter(p => p.quantity > 0)
    .filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
  const filteredCustomers = customers
    .filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm)) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  
  const clearCartAndCustomer = () => {
    clearCart();
    clearSelectedCustomer();
  };
  
  const processPaymentComplete = async (): Promise<boolean> => {
    const success = await processPayment(currentInvoice, markAsPaid);
    
    if (success) {
      // Refresh products to update inventory
      refreshProducts();
      clearCartAndCustomer();
    }
    
    return success;
  };
  
  return {
    products: filteredProducts,
    customers: filteredCustomers,
    cart,
    selectedCustomer,
    showNewCustomerForm,
    searchTerm,
    paymentDetails,
    cartTotal,
    currentInvoice,
    
    setSearchTerm,
    setShowNewCustomerForm,
    setPaymentDetails,
    
    addToCart,
    updateCartItemQuantity: (productId: string, quantity: number) => 
      updateCartItemQuantity(productId, quantity, products),
    removeFromCart,
    clearCart: clearCartAndCustomer,
    handleCustomerSelect,
    createNewCustomer,
    createNewInvoice: () => createNewInvoice(selectedCustomer, cart),
    saveCurrentInvoice,
    finalizeCurrentInvoice,
    processPayment: processPaymentComplete,
    generateReceipt: (invoice: any) => generateReceipt(invoice, paymentDetails),
  };
};
