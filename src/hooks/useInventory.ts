
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
    handleAddProduct 
  } = useProducts();
  
  const { 
    categories, 
    setCategories,
    categoryDialogOpen, 
    setCategoryDialogOpen, 
    newCategory, 
    setNewCategory, 
    handleAddCategory 
  } = useCategories();
  
  const { searchQuery, setSearchQuery } = useSearchQuery();

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
    newProduct,
    setNewProduct,
    newCategory,
    setNewCategory,
    handleAddProduct,
    handleAddCategory,
  };
};
