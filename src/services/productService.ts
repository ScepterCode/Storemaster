
import { Product } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { addItem, updateItem, deleteItem, getStoredItems, STORAGE_KEYS } from '@/lib/offlineStorage';

/**
 * Fetches products from Supabase
 */
export const fetchProductsFromAPI = async (userId?: string) => {
  if (!userId) return [];
  
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('*')
    .order('name');
    
  if (productsError) throw productsError;
  
  if (productsData) {
    return productsData.map(product => ({
      id: product.id,
      name: product.name,
      quantity: product.quantity,
      unitPrice: product.selling_price,
      category: product.category_id,
      description: product.description || undefined,
      synced: true,
    }));
  }
  
  return [];
};

/**
 * Adds a product to Supabase
 */
export const addProductToAPI = async (product: Product, userId: string) => {
  const { error } = await supabase
    .from('products')
    .insert({
      id: product.id,
      name: product.name,
      quantity: product.quantity,
      selling_price: product.unitPrice,
      category_id: product.category,
      description: product.description,
      user_id: userId
    });
    
  if (error) throw error;
  return { ...product, synced: true };
};

/**
 * Updates a product in Supabase
 */
export const updateProductInAPI = async (product: Product) => {
  const { error } = await supabase
    .from('products')
    .update({
      name: product.name,
      quantity: product.quantity,
      selling_price: product.unitPrice,
      category_id: product.category,
      description: product.description,
    })
    .eq('id', product.id);
    
  if (error) throw error;
  return { ...product, synced: true };
};

/**
 * Deletes a product from Supabase
 */
export const deleteProductFromAPI = async (productId: string) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);
    
  if (error) throw error;
};

/**
 * Gets products from local storage
 */
export const getProductsFromStorage = (): Product[] => {
  return getStoredItems<Product>(STORAGE_KEYS.INVENTORY);
};

/**
 * Adds a product to local storage
 */
export const addProductToStorage = (product: Product): void => {
  addItem<Product>(STORAGE_KEYS.INVENTORY, product);
};

/**
 * Updates a product in local storage
 */
export const updateProductInStorage = (product: Product): void => {
  updateItem<Product>(STORAGE_KEYS.INVENTORY, product);
};

/**
 * Deletes a product from local storage
 */
export const deleteProductFromStorage = (productId: string): void => {
  deleteItem<Product>(STORAGE_KEYS.INVENTORY, productId);
};
