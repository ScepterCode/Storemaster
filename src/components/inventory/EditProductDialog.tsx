
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product } from '@/types';
import { Category } from '@/lib/categoryUtils';

interface EditProductDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  product: Product;
  onUpdate: (product: Product) => void;
  categories: Category[];
}

const EditProductDialog = ({
  open,
  setOpen,
  product,
  onUpdate,
  categories,
}: EditProductDialogProps) => {
  const [editedProduct, setEditedProduct] = useState<Product>({ ...product });

  const handleSubmit = () => {
    onUpdate(editedProduct);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={editedProduct.name || ''}
              onChange={(e) => setEditedProduct({ ...editedProduct, name: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={editedProduct.quantity || 0}
              onChange={(e) => setEditedProduct({ ...editedProduct, quantity: Number(e.target.value) })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="unitPrice">Unit Price (₦)</Label>
            <Input
              id="unitPrice"
              type="number"
              value={editedProduct.unitPrice || 0}
              onChange={(e) => setEditedProduct({ ...editedProduct, unitPrice: Number(e.target.value) })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              value={editedProduct.category || ''} 
              onValueChange={(value) => setEditedProduct({ ...editedProduct, category: value })}
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
              value={editedProduct.description || ''}
              onChange={(e) => setEditedProduct({ ...editedProduct, description: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Update Product</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductDialog;
