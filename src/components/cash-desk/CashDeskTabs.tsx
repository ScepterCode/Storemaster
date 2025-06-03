
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, CreditCard } from 'lucide-react';
import SaleTab from './SaleTab';
import CheckoutTab from './CheckoutTab';
import ReceiptView from './ReceiptView';
import { useCashDesk } from '@/hooks/useCashDesk';

const CashDeskTabs = () => {
  const [activeTab, setActiveTab] = useState<string>('sale');
  const [receiptMode, setReceiptMode] = useState<boolean>(false);
  
  const {
    products,
    customers,
    cart,
    cartTotal,
    searchTerm,
    setSearchTerm,
    selectedCustomer,
    currentInvoice,
    
    addToCart,
    handleCustomerSelect,
    createNewCustomer,
    showNewCustomerForm,
    setShowNewCustomerForm,
    createNewInvoice,
    processPayment,
    paymentDetails,
    setPaymentDetails,
    clearCart,
  } = useCashDesk();

  const handleCheckout = () => {
    console.log('Attempting checkout with cart:', cart, 'customer:', selectedCustomer);
    if (createNewInvoice()) {
      setActiveTab('checkout');
    }
  };

  const handleCompletePayment = async () => {
    const success = await processPayment();
    if (success) {
      setReceiptMode(true);
    }
  };

  const handleNewSale = () => {
    clearCart();
    setReceiptMode(false);
    setActiveTab('sale');
  };

  const canProceedToCheckout = cart.length > 0 && selectedCustomer !== null;

  if (receiptMode && currentInvoice) {
    return (
      <ReceiptView
        invoice={currentInvoice}
        paymentDetails={paymentDetails}
        onNewSale={handleNewSale}
      />
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fade-in">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="sale" className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Sale
        </TabsTrigger>
        <TabsTrigger value="checkout" disabled={!canProceedToCheckout} className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Checkout
        </TabsTrigger>
      </TabsList>

      <TabsContent value="sale">
        <SaleTab
          customers={customers}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={handleCustomerSelect}
          showNewCustomerForm={showNewCustomerForm}
          setShowNewCustomerForm={setShowNewCustomerForm}
          onCreateCustomer={createNewCustomer}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          products={products}
          onAddToCart={addToCart}
          cart={cart}
          cartTotal={cartTotal}
          canProceedToCheckout={canProceedToCheckout}
          onCheckout={handleCheckout}
        />
      </TabsContent>

      <TabsContent value="checkout">
        <CheckoutTab
          cart={cart}
          cartTotal={cartTotal}
          paymentDetails={paymentDetails}
          setPaymentDetails={setPaymentDetails}
          onBackToSale={() => setActiveTab('sale')}
          onCompletePayment={handleCompletePayment}
        />
      </TabsContent>
    </Tabs>
  );
};

export default CashDeskTabs;
