
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Product } from '@/types';
import { Category } from '@/lib/categoryUtils';
import CategoriesTable from './CategoriesTable';
import CategoryDialog from './CategoryDialog';

interface CategoriesTabProps {
  categories: Category[];
  products: Product[];
  categoryDialogOpen: boolean;
  setCategoryDialogOpen: (open: boolean) => void;
  newCategory: Partial<Category>;
  setNewCategory: React.Dispatch<React.SetStateAction<Partial<Category>>>;
  handleAddCategory: () => void;
  handleUpdateCategory: (category: Category) => void;
  handleDeleteCategory: (categoryId: string, productsCount: number) => void;
}

const CategoriesTab = ({
  categories,
  products,
  categoryDialogOpen,
  setCategoryDialogOpen,
  newCategory,
  setNewCategory,
  handleAddCategory,
  handleUpdateCategory,
  handleDeleteCategory,
}: CategoriesTabProps) => {
  return (
    <Card className="border shadow-lg bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-3 flex flex-row justify-between items-center">
        <div>
          <CardTitle>Categories</CardTitle>
          <CardDescription>Manage product categories</CardDescription>
        </div>
        <Button 
          className="bg-primary text-white hover:bg-primary/90"
          onClick={() => setCategoryDialogOpen(true)}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> New Category
        </Button>
      </CardHeader>
      <CardContent>
        <CategoriesTable 
          categories={categories} 
          products={products}
          setCategoryDialogOpen={setCategoryDialogOpen}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      </CardContent>

      <CategoryDialog
        open={categoryDialogOpen}
        setOpen={setCategoryDialogOpen}
        newCategory={newCategory}
        setNewCategory={setNewCategory}
        handleAddCategory={handleAddCategory}
      />
    </Card>
  );
};

export default CategoriesTab;
