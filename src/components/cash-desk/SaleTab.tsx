
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import CustomerSelection from '@/components/cash-desk/CustomerSelection';
import CartItems from '@/components/cash-desk/CartItems';
import ProductsList from '@/components/cash-desk/ProductsList';
import { Customer, Product } from '@/types';

interface SaleTabProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  showNewCustomerForm: boolean;
  setShowNewCustomerForm: (show: boolean) => void;
  onCreateCustomer: (customer: Partial<Customer>) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  products: Product[];
  onAddToCart: (product: Product) => void;
  cart: any[];
  cartTotal: number;
  canProceedToCheckout: boolean;
  onCheckout: () => void;
}

const SaleTab: React.FC<SaleTabProps> = ({
  customers,
  selectedCustomer,
  onSelectCustomer,
  showNewCustomerForm,
  setShowNewCustomerForm,
  onCreateCustomer,
  searchTerm,
  setSearchTerm,
  products,
  onAddToCart,
  cart,
  cartTotal,
  canProceedToCheckout,
  onCheckout,
}) => {
  return (
    <div className="space-y-4 mt-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left column - Customer selection */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Customer</CardTitle>
            <CardDescription>Select or add a customer</CardDescription>
          </CardHeader>
          <CardContent>
            <CustomerSelection
              customers={customers}
              selectedCustomer={selectedCustomer}
              onSelectCustomer={onSelectCustomer}
              showNewCustomerForm={showNewCustomerForm}
              setShowNewCustomerForm={setShowNewCustomerForm}
              onCreateCustomer={onCreateCustomer}
            />
          </CardContent>
        </Card>
        
        {/* Right column - Product grid and Cart */}
        <div className="md:col-span-2 space-y-4">
          {/* Search bar */}
          <Card>
            <CardContent className="pt-4">
              <div>
                <Label htmlFor="search-products" className="sr-only">Search Products</Label>
                <Input
                  id="search-products"
                  placeholder="Search products by name or category"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Product list */}
          <ProductsList products={products} onAddToCart={onAddToCart} />
          
          {/* Cart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Shopping Cart ({cart.length} items)</CardTitle>
              <CardDescription>Items to be purchased</CardDescription>
            </CardHeader>
            <CardContent>
              <CartItems />
            </CardContent>
            <CardFooter className="flex-col border-t pt-4">
              <div className="flex justify-between items-center w-full mb-4">
                <span className="text-lg font-medium">Total:</span>
                <span className="text-lg font-bold">₦{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-end w-full">
                <Button
                  onClick={onCheckout}
                  disabled={!canProceedToCheckout}
                  className="w-full sm:w-auto"
                >
                  Proceed to Checkout
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SaleTab;
