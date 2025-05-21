
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Tag, Edit, Trash2 } from 'lucide-react';
import { formatNaira } from '@/lib/formatter';
import { Product } from '@/types';
import { Category, getCategoryName } from '@/lib/categoryUtils';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import EditProductDialog from './EditProductDialog';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

interface ProductsTableProps {
  products: Product[];
  categories: Category[];
  searchQuery: string;
  setProductDialogOpen: (open: boolean) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

const ProductsTable = ({ 
  products, 
  categories,
  searchQuery, 
  setProductDialogOpen,
  onUpdateProduct,
  onDeleteProduct
}: ProductsTableProps) => {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
  };

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      onDeleteProduct(productToDelete);
    }
  };

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
            <TableHead>Stock Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
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
              <TableCell>
                <div className="flex items-center">
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
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditClick(product)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(product.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingProduct && (
        <EditProductDialog 
          open={!!editingProduct}
          setOpen={() => setEditingProduct(null)}
          product={editingProduct}
          onUpdate={onUpdateProduct}
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
    </div>
  );
};

export default ProductsTable;
