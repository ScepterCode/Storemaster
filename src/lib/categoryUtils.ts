
import { Category } from '@/types';
import { STORAGE_KEYS, addItem, getStoredItems, storeItems } from './offlineStorage';

export const getCategories = (): Category[] => {
  return getStoredItems<Category>(STORAGE_KEYS.CATEGORIES) || [];
};

export const addCategory = (category: Category): void => {
  const categories = getCategories();
  categories.push(category);
  storeItems(STORAGE_KEYS.CATEGORIES, categories);
};

export const updateCategory = (updatedCategory: Category): void => {
  const categories = getCategories();
  const index = categories.findIndex(c => c.id === updatedCategory.id);
  if (index !== -1) {
    categories[index] = updatedCategory;
    storeItems(STORAGE_KEYS.CATEGORIES, categories);
  }
};

export const deleteCategory = (categoryId: string): void => {
  const categories = getCategories().filter(c => c.id !== categoryId);
  storeItems(STORAGE_KEYS.CATEGORIES, categories);
};
