
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface CategoryItem {
  id: string;
  name: string;
  count: number;
}

interface CategorySidebarProps {
  categories: CategoryItem[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string) => void;
  loading: boolean;
}

const CategorySidebar = ({
  categories,
  selectedCategory,
  onSelectCategory,
  loading
}: CategorySidebarProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 p-3">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded mb-1" />
          ))
        ) : (
          categories.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "ghost"}
              className="w-full justify-start mb-1"
              onClick={() => onSelectCategory(category.id)}
            >
              {category.name}
              <span className="ml-auto bg-muted px-2 py-0.5 rounded-full text-xs">
                {category.count}
              </span>
            </Button>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default CategorySidebar;
