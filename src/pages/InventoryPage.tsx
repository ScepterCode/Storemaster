
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, RefreshCw, AlertCircle } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import ProductsTab from '@/components/inventory/ProductsTab';
import CategoriesTab from '@/components/inventory/CategoriesTab';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

const InventoryPage = () => {
  const {
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
    handleUpdateProduct,
    handleDeleteProduct,
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    loading,
    error,
    refreshInventory,
  } = useInventory();

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Inventory Management</h1>
            <p className="text-muted-foreground">Manage your product inventory and categories</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="bg-white/60 hover:bg-white/80"
              onClick={refreshInventory}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
            <Button
              variant="outline"
              className="bg-white/60 hover:bg-white/80"
              onClick={() => window.location.href = '/inventory/view'}
            >
              <Eye className="mr-2 h-4 w-4" /> View Inventory
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error.message || 'There was a problem loading your inventory data. Please try again.'}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>
          
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <>
              <TabsContent value="products" className="mt-0">
                <ProductsTab 
                  products={products}
                  categories={categories}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  productDialogOpen={productDialogOpen}
                  setProductDialogOpen={setProductDialogOpen}
                  newProduct={newProduct}
                  setNewProduct={setNewProduct}
                  handleAddProduct={handleAddProduct}
                  handleUpdateProduct={handleUpdateProduct}
                  handleDeleteProduct={handleDeleteProduct}
                />
              </TabsContent>
              
              <TabsContent value="categories" className="mt-0">
                <CategoriesTab 
                  categories={categories}
                  products={products}
                  categoryDialogOpen={categoryDialogOpen}
                  setCategoryDialogOpen={setCategoryDialogOpen}
                  newCategory={newCategory}
                  setNewCategory={setNewCategory}
                  handleAddCategory={handleAddCategory}
                  handleUpdateCategory={handleUpdateCategory}
                  handleDeleteCategory={handleDeleteCategory}
                />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default InventoryPage;
