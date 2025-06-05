
import { useState } from 'react';
import { PaymentDetails, Invoice } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

export const useCashDeskPayment = () => {
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    method: 'cash',
    amount: 0,
  });
  
  const { canEditCashDesk } = usePermissions();
  const { toast } = useToast();
  
  const processPayment = async (
    currentInvoice: Invoice | null,
    markAsPaid: (invoice: Invoice) => Promise<boolean>
  ): Promise<boolean> => {
    if (!canEditCashDesk) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to process payments",
        variant: "destructive",
      });
      return false;
    }
    
    if (!currentInvoice) {
      toast({
        title: "No Invoice",
        description: "No active invoice to process payment",
        variant: "destructive",
      });
      return false;
    }
    
    if (paymentDetails.amount < currentInvoice.totalAmount) {
      toast({
        title: "Insufficient Payment",
        description: "Payment amount is less than the invoice total",
        variant: "destructive",
      });
      return false;
    }
    
    const change = paymentDetails.amount - currentInvoice.totalAmount;
    setPaymentDetails({
      ...paymentDetails,
      change,
    });
    
    const success = await markAsPaid(currentInvoice);
    
    if (success) {
      toast({
        title: "Payment Processed",
        description: `Receipt #${currentInvoice.id.substring(0, 8)} has been created`,
        variant: "default",
      });
    }
    
    return success;
  };

  return {
    paymentDetails,
    setPaymentDetails,
    processPayment,
  };
};
