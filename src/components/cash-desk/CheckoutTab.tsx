
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import PaymentForm from '@/components/cash-desk/PaymentForm';
import { CartItem, PaymentDetails } from '@/types';

interface CheckoutTabProps {
  cart: CartItem[];
  cartTotal: number;
  paymentDetails: PaymentDetails;
  setPaymentDetails: (details: PaymentDetails) => void;
  onBackToSale: () => void;
  onCompletePayment: () => void;
}

const CheckoutTab: React.FC<CheckoutTabProps> = ({
  cart,
  cartTotal,
  paymentDetails,
  setPaymentDetails,
  onBackToSale,
  onCompletePayment,
}) => {
  return (
    <div className="space-y-4 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment</CardTitle>
          <CardDescription>Complete the transaction</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Order Summary</h3>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">₦{item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right">₦{item.totalPrice.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-4 border-t bg-muted/50">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total Amount:</span>
                    <span>₦{cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <PaymentForm 
              totalAmount={cartTotal} 
              paymentDetails={paymentDetails}
              setPaymentDetails={setPaymentDetails}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onBackToSale}>
            Back to Sale
          </Button>
          <Button onClick={onCompletePayment} disabled={paymentDetails.amount < cartTotal}>
            Complete Payment
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CheckoutTab;
