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
import { Button } from '@/components/ui/button';
import { formatNaira } from '@/lib/formatter';
import { Tag, Edit as EditIcon, Trash2 } from 'lucide-react';
import { Product, Category } from '@/types';
import { Database } from 'lucide-react';

interface ProductTableProps {
  products: Product[];
  categories: Category[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  loading: boolean;
}

const InventoryProductTable = ({ 
  products, 
  categories, 
  onEdit, 
  onDelete,
  loading 
}: ProductTableProps) => {
  const stockStatus = (quantity: number) => {
    if (quantity === 0) return { text: 'Out of Stock', color: 'bg-red-600' };
    if (quantity <= 5) return { text: 'Low Stock', color: 'bg-amber-600' };
    return { text: 'In Stock', color: 'bg-green-600' };
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground mb-4">No products found.</p>
        <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      </div>
    );
  }

  return (
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
          {products.map((product) => {
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
                  {product.categoryName || product.category_id ? (
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 mr-1" />
                      {product.categoryName || categories.find(c => c.id === product.category_id)?.name || "Unknown"}
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
                    <Button variant="ghost" size="sm" onClick={() => onEdit(product)}>
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(product.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default InventoryProductTable;
