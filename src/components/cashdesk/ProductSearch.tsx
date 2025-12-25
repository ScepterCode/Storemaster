
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Camera, Plus } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/types'; // Import Product type
import { BarcodeProduct, SaleItem } from '@/types/cashdesk';
import { useToast } from '@/components/ui/use-toast';
import BarcodeScanner from './BarcodeScanner';

interface ProductSearchProps {
  onAddItem: (item: Omit<SaleItem, 'id'>) => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ onAddItem }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const { products } = useProducts();
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.id && product.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleBarcodeInput = (value: string) => {
    // Check if input looks like a barcode (typically numeric and longer)
    if (/^\d{8,}$/.test(value)) {
      // First try to find by barcode field
      let product = products.find(p => p.barcode === value);
      
      // Fallback to ID if no barcode match
      if (!product) {
        product = products.find(p => p.id === value);
      }
      
      if (product) {
        handleAddProduct(product);
        setSearchTerm('');
        return;
      } else {
        toast({
          title: "Product Not Found",
          description: `No product found with barcode: ${value}`,
          variant: "destructive",
        });
        setSearchTerm('');
        return;
      }
    }
    setSearchTerm(value);
  };

  const handleBarcodeScanned = (barcode: string) => {
    console.log('Barcode scanned:', barcode);
    
    // Find product by barcode
    let product = products.find(p => p.barcode === barcode);
    
    // Fallback to ID match
    if (!product) {
      product = products.find(p => p.id === barcode);
    }
    
    if (product) {
      handleAddProduct(product);
    } else {
      toast({
        title: "Product Not Found",
        description: `No product found with barcode: ${barcode}`,
        variant: "destructive",
      });
    }
  };

  const handleAddProduct = (product: Product) => { // Use Product type
    if (product.quantity <= 0) {
      toast({
        title: "Out of Stock",
        description: `${product.name} is currently out of stock`,
        variant: "destructive",
      });
      return;
    }

    const saleItem: Omit<SaleItem, 'id'> = {
      productId: product.id,
      productName: product.name,
      sku: product.id,
      unitPrice: product.unitPrice || 0,
      quantity: 1,
      subtotal: product.unitPrice || 0,
      taxRate: 0.075, // 7.5% VAT
      taxAmount: (product.unitPrice || 0) * 0.075,
      total: (product.unitPrice || 0) * 1.075
    };

    onAddItem(saleItem);
    
    toast({
      title: "Item Added",
      description: `${product.name} added to cart`,
    });

    // Clear search and focus back on input
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredProducts.length > 0) {
      handleAddProduct(filteredProducts[0]);
    }
  };

  useEffect(() => {
    // Auto-focus search input
    searchInputRef.current?.focus();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Product Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search by name, SKU, or scan barcode..."
              value={searchTerm}
              onChange={(e) => handleBarcodeInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setIsScanning(!isScanning)}
            className="flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            {isScanning ? 'Stop Scan' : 'Scan'}
          </Button>
        </div>

        {isScanning && (
          <BarcodeScanner
            isActive={isScanning}
            onScan={handleBarcodeScanned}
            onClose={() => setIsScanning(false)}
          />
        )}

        <div className="max-h-96 overflow-y-auto space-y-2">
          {filteredProducts.length === 0 && searchTerm ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2" />
              <p>No products found for "{searchTerm}"</p>
            </div>
          ) : (
            filteredProducts.slice(0, 10).map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => handleAddProduct(product)}
              >
                <div className="flex-1">
                  <h4 className="font-medium">{product.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      SKU: {product.id}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Stock: {product.quantity}
                    </span>
                  </div>
                  {product.category && (
                    <span className="text-xs text-muted-foreground">
                      {product.category}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    ₦{(product.unitPrice || 0).toFixed(2)}
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductSearch;
