
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
import { Category } from '@/lib/categoryUtils';

interface CategoryDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  newCategory: Partial<Category>;
  setNewCategory: React.Dispatch<React.SetStateAction<Partial<Category>>>;
  handleAddCategory: () => void;
}

const CategoryDialog = ({
  open,
  setOpen,
  newCategory,
  setNewCategory,
  handleAddCategory,
}: CategoryDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAddCategory}>Save Category</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDialog;
