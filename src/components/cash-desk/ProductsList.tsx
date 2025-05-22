
import React from 'react';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';

interface ProductsListProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

const ProductsList: React.FC<ProductsListProps> = ({ products, onAddToCart }) => {
  return (
    <Card>
      <CardContent className="pt-4">
        {products.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No products found. Try a different search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <h3 className="font-medium truncate">{product.name}</h3>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-muted-foreground">
                      In stock: {product.quantity}
                    </span>
                    <span className="font-semibold">
                      ₦{product.unitPrice.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="p-2 bg-muted/30 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => onAddToCart(product)}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductsList;
