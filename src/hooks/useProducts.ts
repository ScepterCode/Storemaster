
import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { generateId } from '@/lib/formatter';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  fetchProductsFromAPI,
  addProductToAPI,
  updateProductInAPI,
  deleteProductFromAPI,
  getProductsFromStorage,
  addProductToStorage,
  updateProductInStorage,
  deleteProductFromStorage
} from '@/services/productService';

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
    const storedProducts = getProductsFromStorage();
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
      
      const fetchedProducts = await fetchProductsFromAPI(user.id);
      setProducts(fetchedProducts);
      
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
          const syncedProduct = await addProductToAPI(product, user.id);
          product.synced = syncedProduct.synced;
          
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
      addProductToStorage(product);

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

  const handleUpdateProduct = async (updatedProduct: Product) => {
    if (!updatedProduct.id) {
      toast({
        title: "Error",
        description: "Cannot update product without an ID",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const productToUpdate = {
        ...updatedProduct,
        synced: false,
      };

      // If user is authenticated, update in Supabase
      if (user) {
        try {
          const syncedProduct = await updateProductInAPI(productToUpdate);
          productToUpdate.synced = syncedProduct.synced;
          
          toast({
            title: "Success",
            description: "Product updated successfully",
            variant: "default",
          });
        } catch (err) {
          console.error('Error updating product in Supabase:', err);
          toast({
            title: "Sync Error",
            description: "Product updated locally but failed to sync",
            variant: "destructive",
          });
        }
      }

      // Update in local storage
      updateProductInStorage(productToUpdate);

      // Update state
      setProducts(products.map(p => p.id === productToUpdate.id ? productToUpdate : p));

    } catch (err) {
      console.error('Error updating product:', err);
      setError(err instanceof Error ? err : new Error('Unknown error updating product'));
      
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      setLoading(true);

      // If user is authenticated, delete from Supabase
      if (user) {
        try {
          await deleteProductFromAPI(productId);
          
          toast({
            title: "Success",
            description: "Product deleted successfully",
            variant: "default",
          });
        } catch (err) {
          console.error('Error deleting product from Supabase:', err);
          toast({
            title: "Sync Error",
            description: "Product deleted locally but failed to sync",
            variant: "destructive",
          });
        }
      }

      // Delete from local storage
      deleteProductFromStorage(productId);

      // Update state
      setProducts(products.filter(product => product.id !== productId));

    } catch (err) {
      console.error('Error deleting product:', err);
      setError(err instanceof Error ? err : new Error('Unknown error deleting product'));
      
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
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
    handleUpdateProduct,
    handleDeleteProduct,
    loading,
    error,
    refreshProducts,
  };
};
