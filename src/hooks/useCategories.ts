/**
 * useCategories Hook
 * 
 * React hook for managing category state and operations in the application.
 * Handles category CRUD operations, offline-first sync, and product reference validation.
 * 
 * @module useCategories
 * 
 * State Management Pattern:
 * - Loads categories from local storage immediately on mount
 * - Fetches from API when user is authenticated
 * - Clears state on logout
 * 
 * Error Handling Pattern:
 * - Catches all errors from service layer
 * - Displays user-friendly toast notifications
 * - Handles authentication errors with redirect
 * 
 * Special Features:
 * - Prevents deletion of categories in use by products
 * - Validates category references before operations
 * 
 * @returns {Object} Category state and operations
 * @property {Category[]} categories - Array of all categories
 * @property {boolean} loading - Loading state indicator
 * @property {Error | null} error - Current error state
 * @property {Function} handleAddCategory - Creates a new category
 * @property {Function} handleUpdateCategory - Updates an existing category
 * @property {Function} handleDeleteCategory - Deletes a category (with validation)
 * @property {Function} refreshCategories - Refreshes categories from API
 */

import { useState, useEffect } from 'react';
import { Category } from '@/types';
import { generateId } from '@/lib/formatter';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/components/ui/use-toast';
import {
  fetchCategoriesFromAPI,
  getFromStorage,
  deleteFromAPI,
  syncEntity,
  SyncResult
} from '@/services/categoryService';
import { AppError } from '@/lib/errorHandler';
import { useAuthErrorHandler } from './useAuthErrorHandler';

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
  const { organization } = useOrganization();
  const { toast } = useToast();
  const { handleError: handleAuthError } = useAuthErrorHandler();

  useEffect(() => {
    // Load categories from storage
    try {
      const storedCategories = getFromStorage();
      setCategories(storedCategories);
    } catch (err) {
      console.error('Error loading categories from storage:', err);
    }
    
    // If user is authenticated, fetch data from Supabase
    if (user) {
      fetchCategories();
    } else {
      // Clear state when user logs out
      setCategories([]);
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
      handleAuthError(err, 'Failed to load category data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (): Promise<boolean> => {
    if (!newCategory.name) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return false;
    }

    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to add categories",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      
      const category: Category = {
        id: generateId(),
        name: newCategory.name,
        description: newCategory.description,
        synced: false,
        lastModified: new Date().toISOString(),
      };

      // Use syncEntity to handle both API and storage
      const result: SyncResult = await syncEntity(category, user.id, 'create', organization?.id);

      if (result.success && result.data) {
        // Update state with the synced category
        setCategories([...categories, result.data]);

        // Show appropriate message based on sync status
        if (result.synced) {
          toast({
            title: "Success",
            description: "Category added successfully",
            variant: "default",
          });
        } else {
          toast({
            title: "Saved Locally",
            description: "Category saved. Will sync when online.",
            variant: "default",
          });
        }

        // Reset form and close dialog
        setNewCategory({
          name: '',
          description: '',
        });
        setCategoryDialogOpen(false);
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error adding category:', err);
      setError(err instanceof Error ? err : new Error('Unknown error adding category'));
      handleAuthError(err, 'Failed to add category. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async (updatedCategory: Category): Promise<boolean> => {
    if (!updatedCategory.name) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return false;
    }

    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to update categories",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      // Use syncEntity to handle both API and storage
      const result: SyncResult = await syncEntity(updatedCategory, user.id, 'update', organization?.id);

      if (result.success && result.data) {
        // Update state with the synced category
        setCategories(categories.map(c => c.id === result.data!.id ? result.data! : c));

        // Show appropriate message based on sync status
        if (result.synced) {
          toast({
            title: "Success",
            description: "Category updated successfully",
            variant: "default",
          });
        } else {
          toast({
            title: "Saved Locally",
            description: "Category updated. Will sync when online.",
            variant: "default",
          });
        }
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err instanceof Error ? err : new Error('Unknown error updating category'));
      handleAuthError(err, 'Failed to update category. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string, productsUsingCategory: number): Promise<boolean> => {
    // Prevent deletion if there are products using this category
    if (productsUsingCategory > 0) {
      toast({
        title: "Cannot Delete Category",
        description: `This category is being used by ${productsUsingCategory} product${productsUsingCategory === 1 ? '' : 's'}. Please reassign or delete these products first.`,
        variant: "destructive",
      });
      return false;
    }

    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to delete categories",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to delete from API
      try {
        await deleteFromAPI(categoryId);
        
        toast({
          title: "Success",
          description: "Category deleted successfully",
          variant: "default",
        });
      } catch (apiError) {
        console.warn('Failed to delete category from API:', apiError);
        
        toast({
          title: "Sync Error",
          description: "Category deleted locally but failed to sync",
          variant: "destructive",
        });
      }

      // Update state
      setCategories(categories.filter(category => category.id !== categoryId));
      
      return true;
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err instanceof Error ? err : new Error('Unknown error deleting category'));
      handleAuthError(err, 'Failed to delete category. Please try again.');
      return false;
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
