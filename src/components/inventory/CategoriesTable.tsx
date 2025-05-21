
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Folder, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Category } from '@/lib/categoryUtils';
import { Product } from '@/types';
import EditCategoryDialog from './EditCategoryDialog';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

interface CategoriesTableProps {
  categories: Category[];
  products: Product[];
  setCategoryDialogOpen: (open: boolean) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string, productsCount: number) => void;
}

const CategoriesTable = ({ 
  categories, 
  products, 
  setCategoryDialogOpen,
  onUpdateCategory,
  onDeleteCategory 
}: CategoriesTableProps) => {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{id: string, productsCount: number} | null>(null);

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
  };

  const handleDeleteClick = (categoryId: string, productsCount: number) => {
    setCategoryToDelete({ id: categoryId, productsCount });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      onDeleteCategory(categoryToDelete.id, categoryToDelete.productsCount);
    }
  };

  if (categories.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground mb-4">No categories found. Add your first category.</p>
        <Button variant="outline" onClick={() => setCategoryDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Category
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
            <TableHead>Description</TableHead>
            <TableHead>Products</TableHead>
            <TableHead className="text-right">Actions</TableHead>
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
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(category)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteClick(category.id, productCount)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {editingCategory && (
        <EditCategoryDialog 
          open={!!editingCategory}
          setOpen={() => setEditingCategory(null)}
          category={editingCategory}
          onUpdate={onUpdateCategory}
        />
      )}

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        onDelete={handleConfirmDelete}
        title="Delete Category"
        description={
          categoryToDelete?.productsCount ? 
          `This category is being used by ${categoryToDelete.productsCount} product${categoryToDelete.productsCount === 1 ? '' : 's'}. Please reassign or delete these products first.` : 
          "Are you sure you want to delete this category? This action cannot be undone."
        }
      />
    </div>
  );
};

export default CategoriesTable;
