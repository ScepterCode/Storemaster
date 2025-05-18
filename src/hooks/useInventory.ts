
import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { Category, getCategories, addCategory } from '@/lib/categoryUtils';
import { getStoredItems, addItem, STORAGE_KEYS } from '@/lib/offlineStorage';
import { generateId } from '@/lib/formatter';

export const useInventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState('products');
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    quantity: 0,
    unitPrice: 0,
  });
  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: '',
    description: '',
  });

  useEffect(() => {
    // Load products from offline storage
    const storedProducts = getStoredItems<Product>(STORAGE_KEYS.INVENTORY);
    setProducts(storedProducts);

    // Load categories
    const storedCategories = getCategories();
    setCategories(storedCategories);
  }, []);

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.unitPrice) {
      alert('Please fill in all required fields');
      return;
    }

    const product: Product = {
      id: generateId(),
      name: newProduct.name,
      quantity: Number(newProduct.quantity) || 0,
      unitPrice: Number(newProduct.unitPrice),
      category: newProduct.category,
      description: newProduct.description,
      synced: false,
    };

    // Add to local storage
    addItem<Product>(STORAGE_KEYS.INVENTORY, product);

    // Update state
    setProducts([...products, product]);

    // Reset form and close dialog
    setNewProduct({
      name: '',
      quantity: 0,
      unitPrice: 0,
    });
    setProductDialogOpen(false);
  };

  const handleAddCategory = () => {
    if (!newCategory.name) {
      alert('Please enter a category name');
      return;
    }

    const category: Category = {
      id: generateId(),
      name: newCategory.name,
      description: newCategory.description,
      synced: false,
    };

    // Add to local storage
    addCategory(category);

    // Update state
    setCategories([...categories, category]);

    // Reset form and close dialog
    setNewCategory({
      name: '',
      description: '',
    });
    setCategoryDialogOpen(false);
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
    newProduct,
    setNewProduct,
    newCategory,
    setNewCategory,
    handleAddProduct,
    handleAddCategory,
  };
};
