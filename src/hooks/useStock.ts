
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types';
import { Category } from '@/lib/categoryUtils';
import { useToast } from '@/components/ui/use-toast';

export const useStock = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

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

      const mappedCategories: Category[] = categoriesData.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description || undefined,
        synced: true,
      }));

      setProducts(mappedProducts);
      setCategories(mappedCategories);
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
