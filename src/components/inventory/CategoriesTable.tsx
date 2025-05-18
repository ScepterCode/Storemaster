
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Folder, PlusCircle } from 'lucide-react';
import { Category } from '@/lib/categoryUtils';
import { Product } from '@/types';

interface CategoriesTableProps {
  categories: Category[];
  products: Product[];
  setCategoryDialogOpen: (open: boolean) => void;
}

const CategoriesTable = ({ categories, products, setCategoryDialogOpen }: CategoriesTableProps) => {
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
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default CategoriesTable;
