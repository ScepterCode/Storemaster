
import { useInvoices } from './useInvoices';
import { useToast } from '@/components/ui/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { Customer, CartItem, Invoice, PaymentDetails } from '@/types';

export const useCashDeskInvoices = () => {
  const {
    currentInvoice,
    setCurrentInvoice,
    createInvoice,
    saveInvoice,
    finalizeInvoice,
    markAsPaid
  } = useInvoices();
  
  const { canEditCashDesk } = usePermissions();
  const { toast } = useToast();
  
  const createNewInvoice = (selectedCustomer: Customer | null, cart: CartItem[]) => {
    if (!canEditCashDesk) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to create invoices",
        variant: "destructive",
      });
      return false;
    }
    
    console.log('Creating new invoice with customer:', selectedCustomer, 'and cart:', cart);
    
    if (!selectedCustomer) {
      toast({
        title: "Customer Required",
        description: "Please select a customer or create a new one",
        variant: "destructive",
      });
      return false;
    }
    
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add at least one product to the cart",
        variant: "destructive",
      });
      return false;
    }
    
    const invoice = createInvoice(selectedCustomer.name, selectedCustomer.id);
    invoice.items = cart.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    }));
    
    setCurrentInvoice(invoice);
    console.log('Created invoice:', invoice);
    return true;
  };
  
  const saveCurrentInvoice = async (): Promise<boolean> => {
    if (!canEditCashDesk) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to save invoices",
        variant: "destructive",
      });
      return false;
    }
    
    if (!currentInvoice) {
      toast({
        title: "No Invoice",
        description: "No active invoice to save",
        variant: "destructive",
      });
      return false;
    }
    
    return saveInvoice(currentInvoice);
  };
  
  const finalizeCurrentInvoice = async (): Promise<boolean> => {
    if (!canEditCashDesk) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to finalize invoices",
        variant: "destructive",
      });
      return false;
    }
    
    if (!currentInvoice) {
      toast({
        title: "No Invoice",
        description: "No active invoice to finalize",
        variant: "destructive",
      });
      return false;
    }
    
    return finalizeInvoice(currentInvoice);
  };

  const generateReceipt = (invoice: Invoice, paymentDetails: PaymentDetails) => {
    // In a real application, this could return HTML or generate a PDF
    // For now, we'll return a simple object that can be used to display a receipt
    return {
      receiptNumber: invoice.id.substring(0, 8),
      date: invoice.date,
      customerName: invoice.customerName,
      items: invoice.items,
      total: invoice.totalAmount,
      payment: paymentDetails,
    };
  };

  return {
    currentInvoice,
    createNewInvoice,
    saveCurrentInvoice,
    finalizeCurrentInvoice,
    markAsPaid,
    generateReceipt,
  };
};
