
import { STORAGE_KEYS, addItem, getStoredItems } from './offlineStorage';

export interface Category {
  id: string;
  name: string;
  description?: string;
  synced: boolean;
}

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
