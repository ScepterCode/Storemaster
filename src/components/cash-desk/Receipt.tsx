
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Invoice, PaymentDetails } from '@/types';
import { formatDate, formatNaira } from '@/lib/formatter';

interface ReceiptProps {
  invoice: Invoice;
  paymentDetails: PaymentDetails;
}

const Receipt: React.FC<ReceiptProps> = ({ invoice, paymentDetails }) => {
  return (
    <Card className="border-dashed border-2 print:border-0">
      <CardHeader className="text-center border-b pb-4 print:pb-2">
        <div className="mb-2">
          <h2 className="text-xl font-bold">Receipt</h2>
          <p className="text-muted-foreground">Thank you for your purchase</p>
        </div>
        <div className="text-sm">
          <p>Invoice #{invoice.id.substring(0, 8)}</p>
          <p>Date: {formatDate(invoice.date)}</p>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div>
          <h3 className="font-medium mb-1">Customer</h3>
          <p>{invoice.customerName}</p>
        </div>
        
        <div>
          <h3 className="font-medium mb-1">Items</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatNaira(item.unitPrice)}</TableCell>
                  <TableCell className="text-right">{formatNaira(item.totalPrice)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="space-y-1 pt-2 border-t">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatNaira(invoice.totalAmount)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>{formatNaira(invoice.totalAmount)}</span>
          </div>
        </div>
        
        <div className="space-y-1 pt-2 border-t">
          <div className="flex justify-between">
            <span>Payment Method:</span>
            <span className="capitalize">{paymentDetails.method.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount Paid:</span>
            <span>{formatNaira(paymentDetails.amount)}</span>
          </div>
          {paymentDetails.change > 0 && (
            <div className="flex justify-between">
              <span>Change:</span>
              <span>{formatNaira(paymentDetails.change)}</span>
            </div>
          )}
          {paymentDetails.reference && (
            <div className="flex justify-between">
              <span>Reference:</span>
              <span>{paymentDetails.reference}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex-col text-center text-sm text-muted-foreground border-t">
        <p>Thank you for your business!</p>
      </CardFooter>
    </Card>
  );
};

export default Receipt;
