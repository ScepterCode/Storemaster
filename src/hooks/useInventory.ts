
import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { Category, getCategories, addCategory } from '@/lib/categoryUtils';
import { getStoredItems, addItem, STORAGE_KEYS } from '@/lib/offlineStorage';
import { generateId } from '@/lib/formatter';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export const useInventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState('products');
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    quantity: 0,
    unitPrice: 0,
  });
  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: '',
    description: '',
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Load products from offline storage
    const storedProducts = getStoredItems<Product>(STORAGE_KEYS.INVENTORY);
    setProducts(storedProducts);

    // Load categories
    const storedCategories = getCategories();
    setCategories(storedCategories);
    
    // If user is authenticated, fetch data from Supabase
    if (user) {
      fetchProductsAndCategories();
    }
  }, [user]);
  
  const fetchProductsAndCategories = async () => {
    if (!user) return;
    
    try {
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');
        
      if (productsError) throw productsError;
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');
        
      if (categoriesError) throw categoriesError;
      
      // Update state with fetched data
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
      
      if (categoriesData) {
        const mappedCategories: Category[] = categoriesData.map(category => ({
          id: category.id,
          name: category.name,
          description: category.description || undefined,
          synced: true,
        }));
        setCategories(mappedCategories);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toast({
        title: "Error",
        description: "Failed to load inventory data",
        variant: "destructive",
      });
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
      } catch (err) {
        console.error('Error saving product to Supabase:', err);
        toast({
          title: "Sync Error",
          description: "Product saved locally but failed to sync",
          variant: "warning",
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
  };

  const handleAddCategory = async () => {
    if (!newCategory.name) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }

    const category: Category = {
      id: generateId(),
      name: newCategory.name,
      description: newCategory.description,
      synced: false,
    };

    // If user is authenticated, store in Supabase
    if (user) {
      try {
        const { error } = await supabase
          .from('categories')
          .insert({
            id: category.id,
            name: category.name,
            description: category.description,
            user_id: user.id
          });
          
        if (error) throw error;
        category.synced = true;
      } catch (err) {
        console.error('Error saving category to Supabase:', err);
        toast({
          title: "Sync Error",
          description: "Category saved locally but failed to sync",
          variant: "warning",
        });
      }
    }

    // Add to local storage
    addCategory(category);

    // Update state
    setCategories([...categories, category]);

    // Reset form and close dialog
    setNewCategory({
      name: '',
      description: '',
    });
    setCategoryDialogOpen(false);
  };

  return {
    products,
    categories,
    activeTab,
    setActiveTab,
    productDialogOpen,
    setProductDialogOpen,
    categoryDialogOpen,
    setCategoryDialogOpen,
    searchQuery,
    setSearchQuery,
    newProduct,
    setNewProduct,
    newCategory,
    setNewCategory,
    handleAddProduct,
    handleAddCategory,
  };
};
