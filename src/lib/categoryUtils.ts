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

export const updateCategory = (category: Category): void => {
  const categories = getCategories();
  const index = categories.findIndex(c => c.id === category.id);
  
  if (index !== -1) {
    categories[index] = category;
    localStorage.setItem('categories', JSON.stringify(categories));
  }
};

export const deleteCategory = (categoryId: string): void => {
  const categories = getCategories().filter(category => category.id !== categoryId);
  localStorage.setItem('categories', JSON.stringify(categories));
};
