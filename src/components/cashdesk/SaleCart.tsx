
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2, User, Percent, CreditCard } from 'lucide-react';
import { Sale, SaleItem, SaleCustomer } from '@/types/cashdesk';
import CustomerSelector from './CustomerSelector';

interface SaleCartProps {
  sale: Sale;
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onApplyDiscount: (itemId?: string, discount?: number, type?: 'percentage' | 'fixed') => void;
  onSetCustomer: (customer: SaleCustomer) => void;
  onClearSale: () => void;
  onProceedToPayment: () => void;
  canProceedToPayment: boolean;
}

const SaleCart: React.FC<SaleCartProps> = ({
  sale,
  onRemoveItem,
  onUpdateQuantity,
  onApplyDiscount,
  onSetCustomer,
  onClearSale,
  onProceedToPayment,
  canProceedToPayment
}) => {
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [discountInput, setDiscountInput] = useState('');

  const handleApplyOverallDiscount = () => {
    const discount = parseFloat(discountInput);
    if (discount > 0) {
      onApplyDiscount(undefined, discount, 'percentage');
      setDiscountInput('');
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart ({sale.items.length})
          </div>
          {sale.items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearSale}>
              Clear All
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Customer Selection */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">Customer</span>
          </div>
          {sale.customer.isWalkIn ? (
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">Walk-in Customer</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowCustomerSelector(true)}
              >
                Change
              </Button>
            </div>
          ) : sale.customer.name ? (
            <div className="flex items-center justify-between p-2 border rounded">
              <div>
                <div className="text-sm font-medium">{sale.customer.name}</div>
                {sale.customer.tier && (
                  <Badge variant="outline" className="text-xs">
                    {sale.customer.tier}
                  </Badge>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowCustomerSelector(true)}
              >
                Change
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => setShowCustomerSelector(true)}
              className="w-full"
            >
              Select Customer
            </Button>
          )}
        </div>

        <Separator />

        {/* Cart Items */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sale.items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-8 w-8 mx-auto mb-2" />
              <p>No items in cart</p>
            </div>
          ) : (
            sale.items.map((item) => (
              <div key={item.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{item.productName}</h4>
                    <p className="text-xs text-muted-foreground">
                      ₦{item.unitPrice.toFixed(2)} each
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(item.id)}
                    className="h-8 w-8 p-0 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    className="h-8 w-8 p-0"
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                    className="h-8 w-16 text-center"
                    min="1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="h-8 w-8 p-0"
                  >
                    +
                  </Button>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span>Subtotal:</span>
                  <span className="font-medium">₦{item.total.toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Overall Discount */}
        {sale.items.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                <span className="text-sm font-medium">Apply Discount</span>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Discount %"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  className="h-8"
                />
                <Button size="sm" onClick={handleApplyOverallDiscount}>
                  Apply
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      {/* Cart Summary */}
      {sale.items.length > 0 && (
        <CardFooter className="flex-col space-y-4 border-t">
          <div className="w-full space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₦{sale.subtotal.toFixed(2)}</span>
            </div>
            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-₦{sale.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax (7.5%):</span>
              <span>₦{sale.taxAmount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>₦{sale.total.toFixed(2)}</span>
            </div>
          </div>

          <Button
            onClick={onProceedToPayment}
            disabled={!canProceedToPayment}
            className="w-full"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Proceed to Payment
          </Button>
        </CardFooter>
      )}

      {showCustomerSelector && (
        <CustomerSelector
          onSelectCustomer={(customer) => {
            onSetCustomer(customer);
            setShowCustomerSelector(false);
          }}
          onClose={() => setShowCustomerSelector(false)}
        />
      )}
    </Card>
  );
};

export default SaleCart;
