
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PaymentDetails } from '@/types';
import { formatNaira } from '@/lib/formatter';

interface PaymentFormProps {
  totalAmount: number;
  paymentDetails: PaymentDetails;
  setPaymentDetails: (details: PaymentDetails) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ 
  totalAmount, 
  paymentDetails, 
  setPaymentDetails 
}) => {
  const handleAmountChange = (value: number) => {
    setPaymentDetails({
      ...paymentDetails,
      amount: value,
      change: value - totalAmount > 0 ? value - totalAmount : 0,
    });
  };
  
  const handleReferenceChange = (reference: string) => {
    setPaymentDetails({
      ...paymentDetails,
      reference,
    });
  };
  
  const handleMethodChange = (method: 'cash' | 'card' | 'bank_transfer') => {
    setPaymentDetails({
      ...paymentDetails,
      method,
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Payment Method</h3>
        <RadioGroup 
          value={paymentDetails.method} 
          onValueChange={(value) => handleMethodChange(value as 'cash' | 'card' | 'bank_transfer')}
          className="grid grid-cols-3 gap-4"
        >
          <div>
            <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
            <Label
              htmlFor="cash"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <span className="text-sm font-medium">Cash</span>
            </Label>
          </div>
          
          <div>
            <RadioGroupItem value="card" id="card" className="peer sr-only" />
            <Label
              htmlFor="card"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <span className="text-sm font-medium">Card</span>
            </Label>
          </div>
          
          <div>
            <RadioGroupItem value="bank_transfer" id="bank_transfer" className="peer sr-only" />
            <Label
              htmlFor="bank_transfer"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <span className="text-sm font-medium">Bank Transfer</span>
            </Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Amount</h3>
        <div>
          <Label htmlFor="amount">Payment Amount</Label>
          <div className="flex items-center gap-2">
            <span>₦</span>
            <Input
              id="amount"
              type="number"
              value={paymentDetails.amount}
              onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
              min={totalAmount}
              step="0.01"
              className="flex-1"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Minimum amount: {formatNaira(totalAmount)}
          </p>
        </div>
        
        {paymentDetails.method !== 'cash' && (
          <div>
            <Label htmlFor="reference">Payment Reference</Label>
            <Input
              id="reference"
              placeholder="Transaction reference or confirmation code"
              value={paymentDetails.reference || ''}
              onChange={(e) => handleReferenceChange(e.target.value)}
            />
          </div>
        )}
        
        {paymentDetails.change > 0 && (
          <Card className="bg-muted mt-4">
            <CardContent className="pt-6 pb-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Change to return:</span>
                <span className="text-lg font-bold">{formatNaira(paymentDetails.change)}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PaymentForm;
