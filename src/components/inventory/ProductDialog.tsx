
import React from 'react';
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

interface ProductDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  newProduct: Partial<Product>;
  setNewProduct: React.Dispatch<React.SetStateAction<Partial<Product>>>;
  handleAddProduct: () => void;
  categories: Category[];
}

const ProductDialog = ({
  open,
  setOpen,
  newProduct,
  setNewProduct,
  handleAddProduct,
  categories,
}: ProductDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAddProduct}>Save Product</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDialog;
