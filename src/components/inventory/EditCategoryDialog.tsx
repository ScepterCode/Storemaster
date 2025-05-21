
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
import { Category } from '@/lib/categoryUtils';

interface EditCategoryDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  category: Category;
  onUpdate: (category: Category) => void;
}

const EditCategoryDialog = ({
  open,
  setOpen,
  category,
  onUpdate,
}: EditCategoryDialogProps) => {
  const [editedCategory, setEditedCategory] = useState<Category>({ ...category });

  const handleSubmit = () => {
    onUpdate(editedCategory);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="categoryName">Category Name</Label>
            <Input
              id="categoryName"
              value={editedCategory.name || ''}
              onChange={(e) => setEditedCategory({ ...editedCategory, name: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="categoryDescription">Description (Optional)</Label>
            <Input
              id="categoryDescription"
              value={editedCategory.description || ''}
              onChange={(e) => setEditedCategory({ ...editedCategory, description: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Update Category</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryDialog;
