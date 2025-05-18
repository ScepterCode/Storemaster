
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatNaira, generateId } from '@/lib/formatter';
import { Product } from '@/types';
import { getStoredItems, addItem, STORAGE_KEYS } from '@/lib/offlineStorage';
import { Plus, Tag, Folder, Eye, PlusCircle, Database } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Category, getCategories, addCategory, getCategoryName } from '@/lib/categoryUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const InventoryPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState('products');
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    quantity: 0,
    unitPrice: 0,
  });
  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: '',
    description: '',
  });
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
              onClick={() => window.location.href = '/inventory/view'}
            >
              <Eye className="mr-2 h-4 w-4" /> View Inventory
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>
          
          <TabsContent value="products" className="mt-0">
            <Card className="border shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <CardTitle>Products</CardTitle>
                  <CardDescription>Manage your product inventory</CardDescription>
                </div>
                <div className="flex gap-2 mt-4 sm:mt-0">
                  <Input 
                    placeholder="Search products..." 
                    className="max-w-xs" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary text-white hover:bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" /> Add Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add New Product</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Product Name</Label>
                          <Input
                            id="name"
                            value={newProduct.name || ''}
                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="quantity">Initial Quantity</Label>
                          <Input
                            id="quantity"
                            type="number"
                            value={newProduct.quantity || ''}
                            onChange={(e) => setNewProduct({ ...newProduct, quantity: Number(e.target.value) })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="unitPrice">Unit Price (₦)</Label>
                          <Input
                            id="unitPrice"
                            type="number"
                            value={newProduct.unitPrice || ''}
                            onChange={(e) => setNewProduct({ ...newProduct, unitPrice: Number(e.target.value) })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="category">Category</Label>
                          <Select 
                            value={newProduct.category || ''} 
                            onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description">Description (Optional)</Label>
                          <Input
                            id="description"
                            value={newProduct.description || ''}
                            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setProductDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddProduct}>Save Product</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {filteredProducts.length > 0 ? (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead className="text-right">Stock Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => (
                          <TableRow key={product.id}>
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
                                  {product.quantity === 0
                                    ? 'Out of Stock'
                                    : product.quantity <= 5
                                    ? 'Low Stock'
                                    : 'In Stock'}
                                </span>
                                <Progress 
                                  value={Math.min(product.quantity * 10, 100)} 
                                  className="h-2 w-20"
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground mb-4">No products found. Add your first product.</p>
                    <Button variant="outline" onClick={() => setProductDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" /> Add Product
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="categories" className="mt-0">
            <Card className="border shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-3 flex flex-row justify-between items-center">
                <div>
                  <CardTitle>Categories</CardTitle>
                  <CardDescription>Manage product categories</CardDescription>
                </div>
                <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary text-white hover:bg-primary/90">
                      <PlusCircle className="mr-2 h-4 w-4" /> New Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add New Category</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="categoryName">Category Name</Label>
                        <Input
                          id="categoryName"
                          value={newCategory.name || ''}
                          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="categoryDescription">Description (Optional)</Label>
                        <Input
                          id="categoryDescription"
                          value={newCategory.description || ''}
                          onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddCategory}>Save Category</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {categories.length > 0 ? (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Products</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categories.map((category) => {
                          const productCount = products.filter(p => p.category === category.id).length;
                          return (
                            <TableRow key={category.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center">
                                  <Folder className="h-4 w-4 mr-2 text-primary" />
                                  {category.name}
                                </div>
                              </TableCell>
                              <TableCell>{category.description || "-"}</TableCell>
                              <TableCell>
                                <span className="px-2 py-0.5 bg-muted rounded-full text-xs font-medium">
                                  {productCount} {productCount === 1 ? 'product' : 'products'}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground mb-4">No categories found. Add your first category.</p>
                    <Button variant="outline" onClick={() => setCategoryDialogOpen(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Category
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default InventoryPage;
