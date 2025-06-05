
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, DollarSign, Smartphone, ArrowLeft, Receipt } from 'lucide-react';
import { Sale, PaymentMethod } from '@/types/cashdesk';
import { useToast } from '@/components/ui/use-toast';

interface PaymentProcessorProps {
  sale: Sale;
  onProcessSale: (payments: PaymentMethod[]) => Promise<void>;
  onBackToSale: () => void;
}

const PaymentProcessor: React.FC<PaymentProcessorProps> = ({ 
  sale, 
  onProcessSale, 
  onBackToSale 
}) => {
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [currentPayment, setCurrentPayment] = useState<Partial<PaymentMethod>>({
    type: 'cash',
    amount: sale.total
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = sale.total - totalPaid;
  const change = totalPaid > sale.total ? totalPaid - sale.total : 0;

  const handleAddPayment = () => {
    if (!currentPayment.amount || currentPayment.amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    if (currentPayment.amount > remainingAmount) {
      // For cash payments, allow overpayment (gives change)
      if (currentPayment.type !== 'cash' && currentPayment.amount > remainingAmount) {
        toast({
          title: "Overpayment",
          description: "Payment amount exceeds remaining balance",
          variant: "destructive",
        });
        return;
      }
    }

    const payment: PaymentMethod = {
      type: currentPayment.type as PaymentMethod['type'],
      amount: currentPayment.amount,
      reference: currentPayment.reference,
      cardLastFour: currentPayment.cardLastFour,
      walletProvider: currentPayment.walletProvider
    };

    setPayments([...payments, payment]);
    setCurrentPayment({
      type: 'cash',
      amount: Math.max(0, remainingAmount - currentPayment.amount)
    });
  };

  const handleRemovePayment = (index: number) => {
    const newPayments = payments.filter((_, i) => i !== index);
    setPayments(newPayments);
    
    const newRemaining = sale.total - newPayments.reduce((sum, p) => sum + p.amount, 0);
    setCurrentPayment({
      ...currentPayment,
      amount: newRemaining > 0 ? newRemaining : 0
    });
  };

  const handleProcessSale = async () => {
    if (remainingAmount > 0) {
      toast({
        title: "Incomplete Payment",
        description: `₦${remainingAmount.toFixed(2)} remaining to be paid`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await onProcessSale(payments);
      toast({
        title: "Sale Completed",
        description: "Transaction processed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process sale. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBackToSale}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sale
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Payment Processing</h2>
          <p className="text-muted-foreground">Total: ₦{sale.total.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Input */}
        <Card>
          <CardHeader>
            <CardTitle>Add Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={currentPayment.type} onValueChange={(value) => 
              setCurrentPayment({ ...currentPayment, type: value as PaymentMethod['type'] })
            }>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="cash">
                  <DollarSign className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="card">
                  <CreditCard className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="transfer">Bank</TabsTrigger>
                <TabsTrigger value="wallet">
                  <Smartphone className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cash" className="space-y-4">
                <div>
                  <Label htmlFor="cash-amount">Cash Amount (₦)</Label>
                  <Input
                    id="cash-amount"
                    type="number"
                    step="0.01"
                    value={currentPayment.amount || ''}
                    onChange={(e) => setCurrentPayment({ 
                      ...currentPayment, 
                      amount: parseFloat(e.target.value) || 0 
                    })}
                  />
                </div>
              </TabsContent>

              <TabsContent value="card" className="space-y-4">
                <div>
                  <Label htmlFor="card-amount">Card Amount (₦)</Label>
                  <Input
                    id="card-amount"
                    type="number"
                    step="0.01"
                    value={currentPayment.amount || ''}
                    onChange={(e) => setCurrentPayment({ 
                      ...currentPayment, 
                      amount: parseFloat(e.target.value) || 0 
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="card-last-four">Last 4 Digits</Label>
                  <Input
                    id="card-last-four"
                    placeholder="1234"
                    maxLength={4}
                    value={currentPayment.cardLastFour || ''}
                    onChange={(e) => setCurrentPayment({ 
                      ...currentPayment, 
                      cardLastFour: e.target.value 
                    })}
                  />
                </div>
              </TabsContent>

              <TabsContent value="transfer" className="space-y-4">
                <div>
                  <Label htmlFor="transfer-amount">Transfer Amount (₦)</Label>
                  <Input
                    id="transfer-amount"
                    type="number"
                    step="0.01"
                    value={currentPayment.amount || ''}
                    onChange={(e) => setCurrentPayment({ 
                      ...currentPayment, 
                      amount: parseFloat(e.target.value) || 0 
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="transfer-ref">Reference Number</Label>
                  <Input
                    id="transfer-ref"
                    placeholder="Transfer reference"
                    value={currentPayment.reference || ''}
                    onChange={(e) => setCurrentPayment({ 
                      ...currentPayment, 
                      reference: e.target.value 
                    })}
                  />
                </div>
              </TabsContent>

              <TabsContent value="wallet" className="space-y-4">
                <div>
                  <Label htmlFor="wallet-amount">Wallet Amount (₦)</Label>
                  <Input
                    id="wallet-amount"
                    type="number"
                    step="0.01"
                    value={currentPayment.amount || ''}
                    onChange={(e) => setCurrentPayment({ 
                      ...currentPayment, 
                      amount: parseFloat(e.target.value) || 0 
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="wallet-provider">Wallet Provider</Label>
                  <Input
                    id="wallet-provider"
                    placeholder="e.g., PalmPay, OPay"
                    value={currentPayment.walletProvider || ''}
                    onChange={(e) => setCurrentPayment({ 
                      ...currentPayment, 
                      walletProvider: e.target.value 
                    })}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <Button 
              onClick={handleAddPayment}
              disabled={!currentPayment.amount || currentPayment.amount <= 0}
              className="w-full mt-4"
            >
              Add Payment
            </Button>
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Sale Total:</span>
                <span className="font-medium">₦{sale.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Paid:</span>
                <span className="font-medium">₦{totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining:</span>
                <span className={`font-medium ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₦{remainingAmount.toFixed(2)}
                </span>
              </div>
              {change > 0 && (
                <div className="flex justify-between">
                  <span>Change:</span>
                  <span className="font-medium text-blue-600">₦{change.toFixed(2)}</span>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">Payment Methods:</h4>
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments added yet</p>
              ) : (
                payments.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {payment.type.toUpperCase()}
                      </Badge>
                      <span className="text-sm">₦{payment.amount.toFixed(2)}</span>
                      {payment.reference && (
                        <span className="text-xs text-muted-foreground">
                          {payment.reference}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePayment(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))
              )}
            </div>

            <Button
              onClick={handleProcessSale}
              disabled={remainingAmount > 0 || isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                "Processing..."
              ) : (
                <>
                  <Receipt className="mr-2 h-4 w-4" />
                  Complete Sale
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentProcessor;
