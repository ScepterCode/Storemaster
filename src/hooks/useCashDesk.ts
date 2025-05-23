
import { useState } from 'react';
import { useProducts } from './useProducts';
import { useCustomers } from './useCustomers';
import { useInvoices } from './useInvoices';
import { CartItem, Customer, Invoice, InvoiceItem, PaymentDetails, Product } from '@/types';
import { generateId } from '@/lib/formatter';
import { useToast } from '@/components/ui/use-toast';

export const useCashDesk = () => {
  const { products, refreshProducts } = useProducts();
  const { 
    customers, 
    handleAddCustomer, 
    refreshCustomers 
  } = useCustomers();
  const { 
    currentInvoice, 
    setCurrentInvoice,
    createInvoice,
    saveInvoice,
    finalizeInvoice,
    markAsPaid
  } = useInvoices();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    method: 'cash',
    amount: 0,
  });
  const { toast } = useToast();

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
  
  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  
  const addToCart = (product: Product) => {
    console.log('Adding product to cart:', product);
    
    if (product.quantity <= 0) {
      toast({
        title: "Cannot Add Product",
        description: "This product is out of stock",
        variant: "destructive",
      });
      return;
    }
    
    const existingItemIndex = cart.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex !== -1) {
      // Product already in cart, update quantity
      const existingItem = cart[existingItemIndex];
      
      if (existingItem.quantity >= product.quantity) {
        toast({
          title: "Maximum Quantity Reached",
          description: `Only ${product.quantity} units available`,
          variant: "destructive",
        });
        return;
      }
      
      const updatedCart = [...cart];
      updatedCart[existingItemIndex] = {
        ...existingItem,
        quantity: existingItem.quantity + 1,
        totalPrice: (existingItem.quantity + 1) * existingItem.unitPrice,
      };
      
      setCart(updatedCart);
      console.log('Updated cart item:', updatedCart[existingItemIndex]);
    } else {
      // New product, add to cart
      const cartItem: CartItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.unitPrice,
        totalPrice: product.unitPrice,
        available: product.quantity,
      };
      
      setCart([...cart, cartItem]);
      console.log('Added new cart item:', cartItem);
    }
  };
  
  const updateCartItemQuantity = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      toast({
        title: "Error",
        description: "Product not found",
        variant: "destructive",
      });
      return;
    }
    
    if (quantity > product.quantity) {
      toast({
        title: "Invalid Quantity",
        description: `Only ${product.quantity} units available`,
        variant: "destructive",
      });
      return;
    }
    
    if (quantity <= 0) {
      // Remove item from cart
      setCart(cart.filter(item => item.productId !== productId));
      return;
    }
    
    const updatedCart = cart.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          quantity,
          totalPrice: quantity * item.unitPrice,
        };
      }
      return item;
    });
    
    setCart(updatedCart);
  };
  
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };
  
  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
  };
  
  const handleCustomerSelect = (customer: Customer | null) => {
    console.log('Selected customer:', customer);
    setSelectedCustomer(customer);
    setShowNewCustomerForm(false);
  };
  
  const createNewCustomer = async (customerData: Partial<Customer>) => {
    console.log('Creating new customer:', customerData);
    const newCustomer = await handleAddCustomer(customerData);
    
    if (newCustomer) {
      setSelectedCustomer(newCustomer);
      setShowNewCustomerForm(false);
      refreshCustomers();
    }
  };
  
  const createNewInvoice = () => {
    console.log('Creating new invoice with customer:', selectedCustomer, 'and cart:', cart);
    
    if (!selectedCustomer) {
      toast({
        title: "Customer Required",
        description: "Please select a customer or create a new one",
        variant: "destructive",
      });
      return false;
    }
    
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add at least one product to the cart",
        variant: "destructive",
      });
      return false;
    }
    
    const invoice = createInvoice(selectedCustomer.name, selectedCustomer.id);
    invoice.items = cart.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    }));
    
    setCurrentInvoice(invoice);
    console.log('Created invoice:', invoice);
    return true;
  };
  
  const saveCurrentInvoice = async (): Promise<boolean> => {
    if (!currentInvoice) {
      toast({
        title: "No Invoice",
        description: "No active invoice to save",
        variant: "destructive",
      });
      return false;
    }
    
    return saveInvoice(currentInvoice);
  };
  
  const finalizeCurrentInvoice = async (): Promise<boolean> => {
    if (!currentInvoice) {
      toast({
        title: "No Invoice",
        description: "No active invoice to finalize",
        variant: "destructive",
      });
      return false;
    }
    
    return finalizeInvoice(currentInvoice);
  };
  
  const processPayment = async (): Promise<boolean> => {
    if (!currentInvoice) {
      toast({
        title: "No Invoice",
        description: "No active invoice to process payment",
        variant: "destructive",
      });
      return false;
    }
    
    if (paymentDetails.amount < currentInvoice.totalAmount) {
      toast({
        title: "Insufficient Payment",
        description: "Payment amount is less than the invoice total",
        variant: "destructive",
      });
      return false;
    }
    
    const change = paymentDetails.amount - currentInvoice.totalAmount;
    setPaymentDetails({
      ...paymentDetails,
      change,
    });
    
    const success = await markAsPaid(currentInvoice);
    
    if (success) {
      // Refresh products to update inventory
      refreshProducts();
      clearCart();
      
      toast({
        title: "Payment Processed",
        description: `Receipt #${currentInvoice.id.substring(0, 8)} has been created`,
        variant: "default",
      });
    }
    
    return success;
  };
  
  const generateReceipt = (invoice: Invoice) => {
    // In a real application, this could return HTML or generate a PDF
    // For now, we'll return a simple object that can be used to display a receipt
    return {
      receiptNumber: invoice.id.substring(0, 8),
      date: invoice.date,
      customerName: invoice.customerName,
      items: invoice.items,
      total: invoice.totalAmount,
      payment: paymentDetails,
    };
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
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    handleCustomerSelect,
    createNewCustomer,
    createNewInvoice,
    saveCurrentInvoice,
    finalizeCurrentInvoice,
    processPayment,
    generateReceipt,
  };
};
