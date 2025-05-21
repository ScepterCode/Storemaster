
import { useState } from 'react';
import { useProducts } from './useProducts';
import { useCategories } from './useCategories';
import { useSearchQuery } from './useSearchQuery';

export const useInventory = () => {
  const [activeTab, setActiveTab] = useState('products');
  
  const { 
    products, 
    setProducts,
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
  
  const { 
    categories, 
    setCategories,
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
  
  const { 
    searchQuery, 
    setSearchQuery,
    isSearching,
    handleSearch 
  } = useSearchQuery();

  // Combined loading state
  const loading = productsLoading || categoriesLoading;
  
  // Combined error handling
  const error = productsError || categoriesError;

  // Refresh all data
  const refreshInventory = () => {
    refreshProducts();
    refreshCategories();
  };

  return {
    products,
    categories,
    activeTab,
    setActiveTab,
    productDialogOpen,
    setProductDialogOpen,
    categoryDialogOpen,
    setCategoryDialogOpen,
    searchQuery,
    setSearchQuery,
    isSearching,
    handleSearch,
    newProduct,
    setNewProduct,
    newCategory,
    setNewCategory,
    handleAddProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    loading,
    error,
    refreshInventory,
  };
};
