
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Tag } from 'lucide-react';
import { formatNaira } from '@/lib/formatter';
import { Product } from '@/types';
import { getCategoryName } from '@/lib/categoryUtils';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ProductsTableProps {
  products: Product[];
  searchQuery: string;
  setProductDialogOpen: (open: boolean) => void;
}

const ProductsTable = ({ products, searchQuery, setProductDialogOpen }: ProductsTableProps) => {
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (filteredProducts.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground mb-4">No products found. Add your first product.</p>
        <Button variant="outline" onClick={() => setProductDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>
    );
  }

  return (
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
  );
};

export default ProductsTable;
