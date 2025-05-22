
import { Category } from '@/types';
import { STORAGE_KEYS, addItem, getStoredItems, storeItems } from './offlineStorage';

export const getCategories = (): Category[] => {
  return getStoredItems<Category>(STORAGE_KEYS.CATEGORIES) || [];
};

export const addCategory = (category: Category): void => {
  addItem<Category>(STORAGE_KEYS.CATEGORIES, category);
};

export const getCategoryById = (id: string): Category | undefined => {
  const categories = getCategories();
  return categories.find(category => category.id === id);
};

export const getCategoryName = (id: string): string => {
  const category = getCategoryById(id);
  return category ? category.name : 'Uncategorized';
};

export const updateCategory = (category: Category): void => {
  const categories = getCategories();
  const index = categories.findIndex(c => c.id === category.id);
  
  if (index !== -1) {
    categories[index] = category;
    storeItems(STORAGE_KEYS.CATEGORIES, categories);
  }
};

export const deleteCategory = (categoryId: string): void => {
  const categories = getCategories().filter(category => category.id !== categoryId);
  storeItems(STORAGE_KEYS.CATEGORIES, categories);
};
