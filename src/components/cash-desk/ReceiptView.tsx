
import React from 'react';
import { Button } from '@/components/ui/button';
import Receipt from '@/components/cash-desk/Receipt';
import { Printer } from 'lucide-react';
import { Invoice, PaymentDetails } from '@/types';

interface ReceiptViewProps {
  invoice: Invoice;
  paymentDetails: PaymentDetails;
  onNewSale: () => void;
}

const ReceiptView: React.FC<ReceiptViewProps> = ({
  invoice,
  paymentDetails,
  onNewSale,
}) => {
  return (
    <div className="animate-fade-in">
      <Receipt invoice={invoice} paymentDetails={paymentDetails} />
      <div className="mt-4 flex gap-4 justify-end">
        <Button variant="outline" onClick={onNewSale}>
          New Sale
        </Button>
        <Button>
          <Printer className="mr-2 h-4 w-4" /> Print Receipt
        </Button>
      </div>
    </div>
  );
};

export default ReceiptView;
