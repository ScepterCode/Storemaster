
import { useState } from 'react';
import { CartItem, Product } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { canEditCashDesk } = usePermissions();
  const { toast } = useToast();

  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  
  const addToCart = (product: Product) => {
    if (!canEditCashDesk) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to modify the cart",
        variant: "destructive",
      });
      return;
    }
    
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
  
  const updateCartItemQuantity = (productId: string, quantity: number, products: Product[]) => {
    if (!canEditCashDesk) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to modify the cart",
        variant: "destructive",
      });
      return;
    }
    
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
    if (!canEditCashDesk) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to modify the cart",
        variant: "destructive",
      });
      return;
    }
    
    setCart(cart.filter(item => item.productId !== productId));
  };
  
  const clearCart = () => {
    setCart([]);
  };

  return {
    cart,
    cartTotal,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
  };
};
