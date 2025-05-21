
import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { getStoredItems, addItem, STORAGE_KEYS } from '@/lib/offlineStorage';
import { generateId } from '@/lib/formatter';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    quantity: 0,
    unitPrice: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Load products from offline storage
    const storedProducts = getStoredItems<Product>(STORAGE_KEYS.INVENTORY);
    setProducts(storedProducts);
    
    // If user is authenticated, fetch data from Supabase
    if (user) {
      fetchProducts();
    } else {
      setLoading(false);
    }
  }, [user]);
  
  const fetchProducts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');
        
      if (productsError) throw productsError;
      
      if (productsData) {
        const mappedProducts: Product[] = productsData.map(product => ({
          id: product.id,
          name: product.name,
          quantity: product.quantity,
          unitPrice: product.selling_price,
          category: product.category_id,
          description: product.description || undefined,
          synced: true,
        }));
        setProducts(mappedProducts);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching products'));
      
      toast({
        title: "Error",
        description: "Failed to load product data. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.unitPrice) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const product: Product = {
        id: generateId(),
        name: newProduct.name,
        quantity: Number(newProduct.quantity) || 0,
        unitPrice: Number(newProduct.unitPrice),
        category: newProduct.category,
        description: newProduct.description,
        synced: false,
      };

      // If user is authenticated, store in Supabase
      if (user) {
        try {
          const { error } = await supabase
            .from('products')
            .insert({
              id: product.id,
              name: product.name,
              quantity: product.quantity,
              selling_price: product.unitPrice,
              category_id: product.category,
              description: product.description,
              user_id: user.id
            });
            
          if (error) throw error;
          product.synced = true;
          
          toast({
            title: "Success",
            description: "Product added successfully",
            variant: "default",
          });
        } catch (err) {
          console.error('Error saving product to Supabase:', err);
          toast({
            title: "Sync Error",
            description: "Product saved locally but failed to sync",
            variant: "destructive",
          });
        }
      }

      // Also save to local storage as backup
      addItem<Product>(STORAGE_KEYS.INVENTORY, product);

      // Update state
      setProducts([...products, product]);

      // Reset form and close dialog
      setNewProduct({
        name: '',
        quantity: 0,
        unitPrice: 0,
      });
      setProductDialogOpen(false);
    } catch (err) {
      console.error('Error adding product:', err);
      setError(err instanceof Error ? err : new Error('Unknown error adding product'));
      
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshProducts = () => {
    fetchProducts();
  };

  return {
    products,
    setProducts,
    productDialogOpen,
    setProductDialogOpen,
    newProduct,
    setNewProduct,
    handleAddProduct,
    loading,
    error,
    refreshProducts,
  };
};
