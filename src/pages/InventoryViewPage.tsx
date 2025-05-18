
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Product } from '@/types';
import { getStoredItems, STORAGE_KEYS } from '@/lib/offlineStorage';
import { Tag, Database, PackageOpen, Filter } from 'lucide-react';
import { formatNaira } from '@/lib/formatter';
import { Progress } from '@/components/ui/progress';
import { getCategories, getCategoryName } from '@/lib/categoryUtils';

const InventoryViewPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<{ id: string; name: string; count: number }[]>([]);
  
  // Get category from URL or default to 'all'
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    // Load products from offline storage
    const storedProducts = getStoredItems<Product>(STORAGE_KEYS.INVENTORY);
    setProducts(storedProducts);
    
    // Load categories and count products in each category
    const allCategories = getCategories();
    const categoryCounts = allCategories.map(category => {
      const count = storedProducts.filter(product => product.category === category.id).length;
      return { id: category.id, name: category.name, count };
    });
    
    // Add "All" category with total count
    categoryCounts.unshift({ id: 'all', name: 'All Products', count: storedProducts.length });
    
    // Add "Uncategorized" if there are any
    const uncategorizedCount = storedProducts.filter(product => !product.category).length;
    if (uncategorizedCount > 0) {
      categoryCounts.push({ id: 'uncategorized', name: 'Uncategorized', count: uncategorizedCount });
    }
    
    setCategories(categoryCounts);
  }, []);

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', categoryId);
    }
    setSearchParams(searchParams);
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
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/inventory'}
          >
            <PackageOpen className="mr-2 h-4 w-4" /> Manage Inventory
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-[240px_1fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 p-3">
                {categories.map(category => (
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
                ))}
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
                {filteredProducts.length > 0 ? (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead className="text-right">Stock Status</TableHead>
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
                                    {getCategoryName(product.category)}
                                  </div>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell>{formatNaira(product.unitPrice)}</TableCell>
                              <TableCell>{product.quantity}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end">
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
    </AppLayout>
  );
};

export default InventoryViewPage;
