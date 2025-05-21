
import { useState, useEffect } from 'react';
import { Category, getCategories, addCategory } from '@/lib/categoryUtils';
import { generateId } from '@/lib/formatter';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: '',
    description: '',
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Load categories
    const storedCategories = getCategories();
    setCategories(storedCategories);
    
    // If user is authenticated, fetch data from Supabase
    if (user) {
      fetchCategories();
    }
  }, [user]);
  
  const fetchCategories = async () => {
    if (!user) return;
    
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');
        
      if (categoriesError) throw categoriesError;
      
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
      console.error('Error fetching categories:', err);
      toast({
        title: "Error",
        description: "Failed to load category data",
        variant: "destructive",
      });
    }
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
          variant: "destructive",
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
    categories,
    setCategories,
    categoryDialogOpen,
    setCategoryDialogOpen,
    newCategory,
    setNewCategory,
    handleAddCategory,
  };
};
