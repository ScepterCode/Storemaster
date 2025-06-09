import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product, Category } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getProductsFromStorage } from '@/services/productService'; // Import for local storage

export const useStock = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProductsAndCategories();
    } else {
      // Clear data when no user is authenticated
      setProducts([]);
      setCategories([]);
    }
  }, [user]);

  const fetchProductsAndCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (productsError) {
        throw new Error(`Error fetching products: ${productsError.message}`);
      }

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) {
        throw new Error(`Error fetching categories: ${categoriesError.message}`);
      }

      // Map fetched data to our models
      const mappedProducts: Product[] = productsData.map(product => ({
        id: product.id,
        name: product.name,
        quantity: product.quantity,
        unitPrice: product.selling_price,
        category: product.category_id,
        description: product.description || undefined,
        synced: true,
      }));

      // This is the correct mappedCategories
      const mappedCategories: Category[] = categoriesData.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description || undefined,
        synced: true,
      }));

      // Get products from local storage
      const localProducts: Product[] = getProductsFromStorage();

      const productMap = new Map<string, Product>();

      // Add local products to the map first
      if (Array.isArray(localProducts)) {
          localProducts.forEach(product => {
              productMap.set(product.id, { ...product, synced: product.synced || false }); // Ensure synced status, default to false
          });
      }

      // Add API products to the map, overwriting local ones if IDs match,
      // as API data is the source of truth for synced items.
      if (Array.isArray(mappedProducts)) { // mappedProducts is from the API call (renamed from mappedApiProducts for consistency)
          mappedProducts.forEach(product => {
              productMap.set(product.id, { ...product, synced: true }); // API products are synced
          });
      }

      const mergedProducts = Array.from(productMap.values());

      // Sort the merged products by name
      mergedProducts.sort((a, b) => a.name.localeCompare(b.name));

      // Ensure the correct mappedCategories is used here
      setProducts(mergedProducts); // Use merged products
      setCategories(mappedCategories); // This should refer to the correctly defined mappedCategories
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching inventory'));
      
      toast({
        title: "Error",
        description: "Failed to load inventory. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate total value for a category
  const calculateCategoryTotal = (categoryId: string): number => {
    return products
      .filter(product => product.category === categoryId)
      .reduce((total, product) => total + (product.quantity * product.unitPrice), 0);
  };

  // Calculate total inventory value
  const calculateTotalInventoryValue = (): number => {
    return products.reduce((total, product) => total + (product.quantity * product.unitPrice), 0);
  };

  return {
    products,
    categories,
    loading,
    error,
    refreshStock: fetchProductsAndCategories,
    calculateCategoryTotal,
    calculateTotalInventoryValue,
  };
};
