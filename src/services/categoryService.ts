
import { Category } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { 
  getCategories, 
  addCategory, 
  updateCategory, 
  deleteCategory 
} from '@/lib/categoryUtils';

/**
 * Fetches categories from Supabase
 */
export const fetchCategoriesFromAPI = async (userId?: string) => {
  if (!userId) return [];
  
  try {
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('name');
      
    if (categoriesError) throw categoriesError;
    
    if (categoriesData) {
      return categoriesData.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description || undefined,
        synced: true,
      }));
    }
  } catch (error) {
    console.error('Error fetching categories from API:', error);
    throw error;
  }
  
  return [];
};

/**
 * Adds a category to Supabase
 */
export const addCategoryToAPI = async (category: Category, userId: string) => {
  try {
    const { error } = await supabase
      .from('categories')
      .insert({
        id: category.id,
        name: category.name,
        description: category.description,
        user_id: userId
      });
      
    if (error) throw error;
    return { ...category, synced: true };
  } catch (error) {
    console.error('Error adding category to API:', error);
    throw error;
  }
};

/**
 * Updates a category in Supabase
 */
export const updateCategoryInAPI = async (category: Category) => {
  try {
    const { error } = await supabase
      .from('categories')
      .update({
        name: category.name,
        description: category.description,
      })
      .eq('id', category.id);
      
    if (error) throw error;
    return { ...category, synced: true };
  } catch (error) {
    console.error('Error updating category in API:', error);
    throw error;
  }
};

/**
 * Deletes a category from Supabase
 */
export const deleteCategoryFromAPI = async (categoryId: string) => {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting category from API:', error);
    throw error;
  }
};

/**
 * Gets categories from local storage
 */
export const getCategoriesFromStorage = (): Category[] => {
  return getCategories();
};

/**
 * Adds a category to local storage
 */
export const addCategoryToStorage = (category: Category): void => {
  addCategory(category);
};

/**
 * Updates a category in local storage
 */
export const updateCategoryToStorage = (category: Category): void => {
  updateCategory(category);
};

/**
 * Deletes a category from local storage
 */
export const deleteCategoryFromStorage = (categoryId: string): void => {
  deleteCategory(categoryId);
};
