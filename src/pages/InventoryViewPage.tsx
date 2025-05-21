
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Filter, Database } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useInventory } from '@/hooks/useInventory';
import DeleteConfirmationDialog from '@/components/inventory/DeleteConfirmationDialog';
import EditProductDialog from '@/components/inventory/EditProductDialog';
import CategorySidebar from '@/components/inventory/CategorySidebar';
import InventoryProductTable from '@/components/inventory/InventoryProductTable';
import InventoryHeader from '@/components/inventory/InventoryHeader';

const InventoryViewPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  
  const { 
    products, 
    categories,
    searchQuery,
    setSearchQuery,
    handleUpdateProduct,
    handleDeleteProduct,
    loading,
    error,
    refreshInventory
  } = useInventory();
  
  // Format categories for the sidebar
  const [formattedCategories, setFormattedCategories] = useState<{ id: string; name: string; count: number }[]>([]);
  
  // Get category from URL or default to 'all'
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory('all');
    }
  }, [searchParams]);

  // Recalculate formatted categories whenever products or categories change
  useEffect(() => {
    if (products && categories) {
      // Calculate categories with product counts
      const categoryCounts = categories.map(category => {
        const count = products.filter(product => product.category === category.id).length;
        return { id: category.id, name: category.name, count };
      });
      
      // Add "All" category with total count
      categoryCounts.unshift({ id: 'all', name: 'All Products', count: products.length });
      
      // Add "Uncategorized" if there are any
      const uncategorizedCount = products.filter(product => !product.category).length;
      if (uncategorizedCount > 0) {
        categoryCounts.push({ id: 'uncategorized', name: 'Uncategorized', count: uncategorizedCount });
      }
      
      setFormattedCategories(categoryCounts);
    }
  }, [products, categories]);

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', categoryId);
    }
    setSearchParams(searchParams);
  };

  // Edit and delete handlers
  const handleEditClick = (product) => {
    setEditingProduct(product);
  };
  
  const handleDeleteClick = (productId) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (productToDelete) {
      handleDeleteProduct(productToDelete);
      toast({
        title: "Product Deleted",
        description: "The product has been successfully removed from inventory",
      });
    }
  };

  // Filter products based on search query and selected category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (!selectedCategory || selectedCategory === 'all') return true;
    
    if (selectedCategory === 'uncategorized') {
      return !product.category;
    }
    
    return product.category === selectedCategory;
  });

  const navigateToInventoryManage = () => {
    window.location.href = '/inventory';
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <InventoryHeader 
          title="Inventory Overview"
          subtitle="View and manage your complete inventory"
          onRefresh={refreshInventory}
          loading={loading}
          navigateToInventoryManage={navigateToInventoryManage}
        />

        {error && (
          <div className="bg-destructive/15 border border-destructive text-destructive px-4 py-3 rounded-md">
            <p>Error loading inventory data. Please try refreshing.</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-[240px_1fr]">
          <div className="space-y-4">
            <CategorySidebar 
              categories={formattedCategories}
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
              loading={loading}
            />
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle>Product Inventory</CardTitle>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-[240px]"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <InventoryProductTable 
                  products={filteredProducts}
                  categories={categories}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  loading={loading}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {editingProduct && (
        <EditProductDialog
          open={!!editingProduct}
          setOpen={() => setEditingProduct(null)}
          product={editingProduct}
          onUpdate={handleUpdateProduct}
          categories={categories}
        />
      )}
      
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        onDelete={handleConfirmDelete}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
      />
    </AppLayout>
  );
};

export default InventoryViewPage;
