
import { useState, useEffect } from 'react';
import { Category } from '@/types';
import { generateId } from '@/lib/formatter';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  fetchCategoriesFromAPI,
  addCategoryToAPI,
  updateCategoryInAPI,
  deleteCategoryFromAPI,
  getCategoriesFromStorage,
  addCategoryToStorage,
  updateCategoryToStorage,
  deleteCategoryFromStorage
} from '@/services/categoryService';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Load categories
    const storedCategories = getCategoriesFromStorage();
    setCategories(storedCategories);
    
    // If user is authenticated, fetch data from Supabase
    if (user) {
      fetchCategories();
    } else {
      setLoading(false);
    }
  }, [user]);
  
  const fetchCategories = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const fetchedCategories = await fetchCategoriesFromAPI(user.id);
      setCategories(fetchedCategories);
      
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching categories'));
      
      toast({
        title: "Error",
        description: "Failed to load category data. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

    try {
      setLoading(true);
      
      const category: Category = {
        id: generateId(),
        name: newCategory.name,
        description: newCategory.description,
        synced: false,
      };

      // If user is authenticated, store in Supabase
      if (user) {
        try {
          const syncedCategory = await addCategoryToAPI(category, user.id);
          category.synced = syncedCategory.synced;
          
          toast({
            title: "Success",
            description: "Category added successfully",
            variant: "default",
          });
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
      addCategoryToStorage(category);

      // Update state
      setCategories([...categories, category]);

      // Reset form and close dialog
      setNewCategory({
        name: '',
        description: '',
      });
      setCategoryDialogOpen(false);
    } catch (err) {
      console.error('Error adding category:', err);
      setError(err instanceof Error ? err : new Error('Unknown error adding category'));
      
      toast({
        title: "Error",
        description: "Failed to add category. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async (updatedCategory: Category) => {
    if (!updatedCategory.name) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const categoryToUpdate = {
        ...updatedCategory,
        synced: false,
      };

      // If user is authenticated, update in Supabase
      if (user) {
        try {
          const syncedCategory = await updateCategoryInAPI(categoryToUpdate);
          categoryToUpdate.synced = syncedCategory.synced;
          
          toast({
            title: "Success",
            description: "Category updated successfully",
            variant: "default",
          });
        } catch (err) {
          console.error('Error updating category in Supabase:', err);
          toast({
            title: "Sync Error",
            description: "Category updated locally but failed to sync",
            variant: "destructive",
          });
        }
      }

      // Update in local storage
      updateCategoryToStorage(categoryToUpdate);

      // Update state
      setCategories(categories.map(c => c.id === categoryToUpdate.id ? categoryToUpdate : c));

    } catch (err) {
      console.error('Error updating category:', err);
      setError(err instanceof Error ? err : new Error('Unknown error updating category'));
      
      toast({
        title: "Error",
        description: "Failed to update category. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string, productsUsingCategory: number) => {
    // Prevent deletion if there are products using this category
    if (productsUsingCategory > 0) {
      toast({
        title: "Cannot Delete Category",
        description: `This category is being used by ${productsUsingCategory} product${productsUsingCategory === 1 ? '' : 's'}. Please reassign or delete these products first.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // If user is authenticated, delete from Supabase
      if (user) {
        try {
          await deleteCategoryFromAPI(categoryId);
          
          toast({
            title: "Success",
            description: "Category deleted successfully",
            variant: "default",
          });
        } catch (err) {
          console.error('Error deleting category from Supabase:', err);
          toast({
            title: "Sync Error",
            description: "Category deleted locally but failed to sync",
            variant: "destructive",
          });
        }
      }

      // Delete from local storage
      deleteCategoryFromStorage(categoryId);

      // Update state
      setCategories(categories.filter(category => category.id !== categoryId));

    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err instanceof Error ? err : new Error('Unknown error deleting category'));
      
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshCategories = () => {
    fetchCategories();
  };

  return {
    categories,
    setCategories,
    categoryDialogOpen,
    setCategoryDialogOpen,
    newCategory,
    setNewCategory,
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    loading,
    error,
    refreshCategories,
  };
};
