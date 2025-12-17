
import { useState } from 'react';
import { useProducts } from './useProducts';
import { useCategories } from './useCategories';
import { useSearchQuery } from './useSearchQuery';

/**
 * Composite hook for inventory management that combines products and categories.
 * This hook only composes useProducts and useCategories without any direct storage operations.
 * 
 * @returns Combined state and operations for inventory management
 */
export const useInventory = () => {
  const [activeTab, setActiveTab] = useState('products');
  
  // Compose products hook - no direct storage operations
  const { 
    products,
    productDialogOpen, 
    setProductDialogOpen, 
    newProduct, 
    setNewProduct, 
    handleAddProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    loading: productsLoading,
    error: productsError,
    refreshProducts
  } = useProducts();
  
  // Compose categories hook - no direct storage operations
  const { 
    categories,
    categoryDialogOpen, 
    setCategoryDialogOpen, 
    newCategory, 
    setNewCategory, 
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    loading: categoriesLoading,
    error: categoriesError,
    refreshCategories
  } = useCategories();
  
  // Compose search query hook
  const { 
    searchQuery, 
    setSearchQuery,
    isSearching,
    handleSearch 
  } = useSearchQuery();

  // Combined loading state
  const loading = productsLoading || categoriesLoading;
  
  // Combined error handling - return the first error encountered
  const error = productsError || categoriesError;

  // Refresh all inventory data
  const refreshInventory = () => {
    refreshProducts();
    refreshCategories();
  };

  return {
    // Data
    products,
    categories,
    
    // UI State
    activeTab,
    setActiveTab,
    productDialogOpen,
    setProductDialogOpen,
    categoryDialogOpen,
    setCategoryDialogOpen,
    searchQuery,
    setSearchQuery,
    isSearching,
    
    // Form State
    newProduct,
    setNewProduct,
    newCategory,
    setNewCategory,
    
    // Product Operations
    handleAddProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    
    // Category Operations
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    
    // Search Operations
    handleSearch,
    
    // Combined State
    loading,
    error,
    refreshInventory,
  };
};
