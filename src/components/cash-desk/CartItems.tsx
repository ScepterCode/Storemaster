
import React from 'react';
import { useCashDesk } from '@/hooks/useCashDesk';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';

const CartItems = () => {
  const { cart, updateCartItemQuantity, removeFromCart } = useCashDesk();
  
  if (cart.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        Your cart is empty. Add products to get started.
      </div>
    );
  }
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Total</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cart.map((item) => (
          <TableRow key={item.productId}>
            <TableCell>{item.productName}</TableCell>
            <TableCell>₦{item.unitPrice.toFixed(2)}</TableCell>
            <TableCell className="w-24">
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => updateCartItemQuantity(item.productId, item.quantity - 1)}
                >
                  -
                </Button>
                <Input
                  type="number"
                  min="1"
                  max={item.available}
                  value={item.quantity}
                  onChange={(e) => updateCartItemQuantity(item.productId, parseInt(e.target.value) || 0)}
                  className="h-8 w-12 text-center mx-2"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => updateCartItemQuantity(item.productId, item.quantity + 1)}
                  disabled={item.quantity >= item.available}
                >
                  +
                </Button>
              </div>
            </TableCell>
            <TableCell>₦{item.totalPrice.toFixed(2)}</TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFromCart(item.productId)}
                className="h-8 w-8 p-0 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default CartItems;
