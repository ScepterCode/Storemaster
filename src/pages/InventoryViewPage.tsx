
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Tag, Database, PackageOpen, Filter, RefreshCw } from 'lucide-react';
import { formatNaira } from '@/lib/formatter';
import { Progress } from '@/components/ui/progress';
import { useInventory } from '@/hooks/useInventory';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import DeleteConfirmationDialog from '@/components/inventory/DeleteConfirmationDialog';
import EditProductDialog from '@/components/inventory/EditProductDialog';

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

  const stockStatus = (quantity: number) => {
    if (quantity === 0) return { text: 'Out of Stock', color: 'bg-red-600' };
    if (quantity <= 5) return { text: 'Low Stock', color: 'bg-amber-600' };
    return { text: 'In Stock', color: 'bg-green-600' };
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Inventory Overview</h1>
            <p className="text-muted-foreground">View and manage your complete inventory</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={refreshInventory}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/inventory'}
            >
              <PackageOpen className="mr-2 h-4 w-4" /> Manage Inventory
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/15 border border-destructive text-destructive px-4 py-3 rounded-md">
            <p>Error loading inventory data. Please try refreshing.</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-[240px_1fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 p-3">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="h-10 bg-muted animate-pulse rounded mb-1" />
                  ))
                ) : (
                  formattedCategories.map(category => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "ghost"}
                      className="w-full justify-start mb-1"
                      onClick={() => handleSelectCategory(category.id)}
                    >
                      {category.name}
                      <span className="ml-auto bg-muted px-2 py-0.5 rounded-full text-xs">
                        {category.count}
                      </span>
                    </Button>
                  ))
                )}
              </CardContent>
            </Card>
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
                {loading ? (
                  <div className="space-y-2">
                    {Array(5).fill(0).map((_, i) => (
                      <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Stock Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => {
                          const status = stockStatus(product.quantity);
                          return (
                            <TableRow key={product.id} className="hover:bg-muted/40 transition-colors">
                              <TableCell className="font-medium">
                                {product.name}
                                {product.description && (
                                  <span className="text-xs text-muted-foreground block">
                                    {product.description}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                {product.category ? (
                                  <div className="flex items-center">
                                    <Tag className="h-4 w-4 mr-1" />
                                    {categories.find(c => c.id === product.category)?.name || "Unknown"}
                                  </div>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell>{formatNaira(product.unitPrice)}</TableCell>
                              <TableCell>{product.quantity}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <span className={`text-sm mr-2 ${
                                    product.quantity === 0
                                      ? 'text-red-600'
                                      : product.quantity <= 5
                                      ? 'text-amber-600'
                                      : 'text-green-600'
                                  }`}>
                                    {status.text}
                                  </span>
                                  <Progress 
                                    value={Math.min(product.quantity * 10, 100)} 
                                    className="h-2 w-20"
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => handleEditClick(product)}>
                                    <Tag className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(product.id)}>
                                    <Filter className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground mb-4">No products found.</p>
                    <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  </div>
                )}
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
