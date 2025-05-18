
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { Product } from '@/types';
import { Category } from '@/lib/categoryUtils';
import ProductsTable from './ProductsTable';
import ProductDialog from './ProductDialog';

interface ProductsTabProps {
  products: Product[];
  categories: Category[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  productDialogOpen: boolean;
  setProductDialogOpen: (open: boolean) => void;
  newProduct: Partial<Product>;
  setNewProduct: React.Dispatch<React.SetStateAction<Partial<Product>>>;
  handleAddProduct: () => void;
}

const ProductsTab = ({
  products,
  categories,
  searchQuery,
  setSearchQuery,
  productDialogOpen,
  setProductDialogOpen,
  newProduct,
  setNewProduct,
  handleAddProduct,
}: ProductsTabProps) => {
  return (
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
          <Button 
            className="bg-primary text-white hover:bg-primary/90"
            onClick={() => setProductDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ProductsTable 
          products={products} 
          searchQuery={searchQuery}
          setProductDialogOpen={setProductDialogOpen}
        />
      </CardContent>

      <ProductDialog
        open={productDialogOpen}
        setOpen={setProductDialogOpen}
        newProduct={newProduct}
        setNewProduct={setNewProduct}
        handleAddProduct={handleAddProduct}
        categories={categories}
      />
    </Card>
  );
};

export default ProductsTab;
