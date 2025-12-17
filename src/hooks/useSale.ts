import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useProducts } from '@/hooks/useProducts';
import { useCashdeskSession } from '@/hooks/useCashdeskSession';
import { Sale, SaleItem, SaleCustomer, PaymentMethod } from '@/types/cashdesk';
import { Product, Transaction } from '@/types';
import { generateId } from '@/lib/formatter';
import * as productService from '@/services/productService';
import * as transactionService from '@/services/transactionService';

export const useSale = (sessionId: string) => {
  // Retrieve and set tax rate from environment variable
  const VITE_TAX_RATE_STRING = import.meta.env.VITE_STANDARD_TAX_RATE;
  const STANDARD_TAX_RATE = parseFloat(VITE_TAX_RATE_STRING) || 0.075; // Default to 0.075

  if (isNaN(parseFloat(VITE_TAX_RATE_STRING))) {
    console.warn(
      'VITE_STANDARD_TAX_RATE environment variable is not set or is invalid. ' +
      'Defaulting to 7.5% tax rate. Please set this in your .env file (e.g., VITE_STANDARD_TAX_RATE=0.075).'
    );
  }

  const [currentSale, setCurrentSale] = useState<Sale>({
    id: '',
    transactionId: '',
    sessionId,
    cashierId: '',
    cashierName: '',
    customer: { isWalkIn: true },
    items: [],
    subtotal: 0,
    discountAmount: 0,
    taxAmount: 0,
    total: 0,
    payments: [],
    timestamp: '',
    status: 'completed'
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const { products, refreshProducts } = useProducts();
  const { updateSession, currentSession } = useCashdeskSession();

  useEffect(() => {
    if (user && sessionId) {
      resetSale();
    }
  }, [user, sessionId]);

  useEffect(() => {
    calculateTotals();
  }, [currentSale.items, currentSale.discountAmount]);

  const resetSale = () => {
    setCurrentSale({
      id: generateId(),
      transactionId: generateId(),
      sessionId,
      cashierId: user?.id || '',
      cashierName: user?.email || 'Cashier',
      customer: { isWalkIn: true },
      items: [],
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      total: 0,
      payments: [],
      timestamp: new Date().toISOString(),
      status: 'completed'
    });
  };

  const calculateTotals = () => {
    const subtotal = currentSale.items.reduce((sum, item) => sum + item.subtotal, 0);
    const discountedSubtotal = subtotal - currentSale.discountAmount;
    const taxAmount = discountedSubtotal * STANDARD_TAX_RATE; // Use configurable tax rate
    const total = discountedSubtotal + taxAmount;

    setCurrentSale(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      total: Math.max(0, total)
    }));
  };

  const addItem = (itemData: Omit<SaleItem, 'id'>) => {
    const existingItemIndex = currentSale.items.findIndex(
      item => item.productId === itemData.productId
    );

    if (existingItemIndex !== -1) {
      // Update existing item quantity
      const updatedItems = [...currentSale.items];
      const existingItem = updatedItems[existingItemIndex];
      const newQuantity = existingItem.quantity + itemData.quantity;
      
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        subtotal: newQuantity * existingItem.unitPrice,
        taxAmount: newQuantity * existingItem.unitPrice * (existingItem.taxRate || 0),
        total: newQuantity * existingItem.unitPrice * (1 + (existingItem.taxRate || 0))
      };

      setCurrentSale(prev => ({ ...prev, items: updatedItems }));
    } else {
      // Add new item
      const newItem: SaleItem = {
        id: generateId(),
        ...itemData
      };

      setCurrentSale(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
    }
  };

  const removeItem = (itemId: string) => {
    setCurrentSale(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setCurrentSale(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const subtotal = quantity * item.unitPrice;
          const taxAmount = subtotal * (item.taxRate || 0);
          return {
            ...item,
            quantity,
            subtotal,
            taxAmount,
            total: subtotal + taxAmount
          };
        }
        return item;
      })
    }));
  };

  const applyDiscount = (itemId?: string, discount = 0, type: 'percentage' | 'fixed' = 'percentage') => {
    if (itemId) {
      // Apply discount to specific item
      setCurrentSale(prev => ({
        ...prev,
        items: prev.items.map(item => {
          if (item.id === itemId) {
            const discountAmount = type === 'percentage' 
              ? item.subtotal * (discount / 100)
              : discount;
            
            return {
              ...item,
              discount: discountAmount,
              discountType: type,
              total: Math.max(0, item.subtotal - discountAmount + (item.taxAmount || 0))
            };
          }
          return item;
        })
      }));
    } else {
      // Apply overall discount
      const discountAmount = type === 'percentage' 
        ? currentSale.subtotal * (discount / 100)
        : discount;
      
      setCurrentSale(prev => ({
        ...prev,
        discountAmount: Math.min(discountAmount, prev.subtotal)
      }));
    }
  };

  const setCustomer = (customer: SaleCustomer) => {
    setCurrentSale(prev => ({ ...prev, customer }));
  };

  const processSale = async (payments: PaymentMethod[]) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated. Please log in.",
        variant: "destructive",
      });
      return;
    }

    // Validate stock availability before processing sale
    for (const item of currentSale.items) {
      const productInStock = products.find(p => p.id === item.productId);

      if (!productInStock) {
        toast({
          title: "Error",
          description: `Product ${item.productName} not found in inventory.`,
          variant: "destructive",
        });
        return;
      }

      if (productInStock.quantity < item.quantity) {
        toast({
          title: "Insufficient Stock",
          description: `Not enough stock for ${productInStock.name}. Available: ${productInStock.quantity}, Required: ${item.quantity}`,
          variant: "destructive",
        });
        return;
      }
    }

    // Update inventory for each item using product service
    const inventoryUpdateErrors: string[] = [];
    const conflictErrors: string[] = [];
    
    for (const item of currentSale.items) {
      try {
        const productInStock = products.find(p => p.id === item.productId);
        
        if (!productInStock) {
          continue; // Already validated above
        }

        const updatedProduct: Product = {
          ...productInStock,
          quantity: productInStock.quantity - item.quantity,
          lastModified: new Date().toISOString(),
        };
        
        // Use product service to sync the update with optimistic locking
        const result = await productService.syncEntity(updatedProduct, user.id, 'update');
        
        if (!result.success) {
          // Check if it's a concurrent update conflict
          if (result.error?.message?.includes('modified by another user')) {
            conflictErrors.push(productInStock.name);
          } else {
            inventoryUpdateErrors.push(`Failed to update ${productInStock.name}`);
          }
          console.error('Failed to update inventory for product:', item.productId, result.error);
        } else if (!result.synced) {
          console.warn(`Product ${productInStock.name} updated locally but not synced to server`);
        }
      } catch (error) {
        // Check if it's a concurrent update conflict
        const errorMessage = error instanceof Error ? error.message : '';
        if (errorMessage.includes('modified by another user')) {
          conflictErrors.push(item.productName);
        } else {
          inventoryUpdateErrors.push(`Error updating ${item.productName}`);
        }
        console.error('Failed to update inventory for product:', item.productId, error);
      }
    }

    // Handle concurrent update conflicts
    if (conflictErrors.length > 0) {
      toast({
        title: "Inventory Conflict",
        description: `Products were modified by another user: ${conflictErrors.join(', ')}. Please refresh inventory and retry the sale.`,
        variant: "destructive",
      });
      await refreshProducts();
      return;
    }

    // Show warning if there were inventory update errors
    if (inventoryUpdateErrors.length > 0) {
      toast({
        title: "Inventory Update Issues",
        description: `Sale completed but some inventory updates failed: ${inventoryUpdateErrors.join(', ')}`,
        variant: "destructive",
      });
    }

    // Refresh products to get updated inventory
    await refreshProducts();

    // Create transaction record using transaction service
    const transaction: Transaction = {
      id: generateId(),
      amount: currentSale.total,
      description: `Sale: ${currentSale.items.length} item(s) - ${currentSale.items.map(i => i.productName).join(', ')}`,
      date: new Date().toISOString(),
      type: 'sale',
      category: 'sales',
      reference: currentSale.transactionId,
      synced: false,
      lastModified: new Date().toISOString(),
    };

    try {
      const transactionResult = await transactionService.syncEntity(transaction, user.id, 'create');
      
      if (!transactionResult.success) {
        console.error('Failed to save transaction:', transactionResult.error);
        toast({
          title: "Warning",
          description: "Sale completed but transaction record failed to save",
          variant: "destructive",
        });
      } else if (!transactionResult.synced) {
        console.warn('Transaction saved locally but not synced to server');
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast({
        title: "Warning",
        description: "Sale completed but transaction record failed to save",
        variant: "destructive",
      });
    }

    // Save sale to local storage for cashdesk history
    const salesKey = `cashdesk_sales_${user.id}`;
    const sales = JSON.parse(localStorage.getItem(salesKey) || '[]');
    
    const completedSale: Sale = {
      ...currentSale,
      payments,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };

    sales.unshift(completedSale);
    
    // Keep only last 1000 sales
    if (sales.length > 1000) {
      sales.splice(1000);
    }
    
    localStorage.setItem(salesKey, JSON.stringify(sales));

    // Update session totals
    if (currentSession) {
      updateSession({
        totalSales: currentSession.totalSales + currentSale.total,
        transactionCount: currentSession.transactionCount + 1
      });
    }

    toast({
      title: "Sale Completed",
      description: `Transaction ${currentSale.transactionId.substring(0, 8)} processed successfully`,
    });

    // Reset for next sale
    resetSale();
  };

  const clearSale = () => {
    resetSale();
  };

  return {
    currentSale,
    addItem,
    removeItem,
    updateQuantity,
    applyDiscount,
    setCustomer,
    processSale,
    clearSale
  };
};
