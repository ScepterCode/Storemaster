import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useProducts } from '@/hooks/useProducts';
import { useCashdeskSession } from '@/hooks/useCashdeskSession';
import { Sale, SaleItem, SaleCustomer, PaymentMethod } from '@/types/cashdesk';
import { generateId } from '@/lib/formatter';

export const useSale = (sessionId: string) => {
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
  const { handleUpdateProduct } = useProducts();
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
    const taxAmount = discountedSubtotal * 0.075; // 7.5% VAT
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
    // Update inventory for each item
    for (const item of currentSale.items) {
      try {
        // Find the product and update its quantity
        const updatedProduct = {
          id: item.productId,
          name: item.productName,
          quantity: 0, // Will be set correctly in the update
          unitPrice: item.unitPrice,
          synced: false
        };
        
        // Note: In a real implementation, you'd fetch the current product 
        // and subtract the sold quantity
        // await handleUpdateProduct(updatedProduct);
      } catch (error) {
        console.error('Failed to update inventory for product:', item.productId);
      }
    }

    // Save sale to local storage
    const salesKey = `cashdesk_sales_${user?.id}`;
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
