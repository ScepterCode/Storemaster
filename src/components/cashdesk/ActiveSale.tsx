
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Search, CreditCard } from 'lucide-react';
import ProductSearch from './ProductSearch';
import SaleCart from './SaleCart';
import PaymentProcessor from './PaymentProcessor';
import { useSale } from '@/hooks/useSale';

interface ActiveSaleProps {
  sessionId: string;
}

const ActiveSale: React.FC<ActiveSaleProps> = ({ sessionId }) => {
  const [activeTab, setActiveTab] = useState('search');
  const {
    currentSale,
    addItem,
    removeItem,
    updateQuantity,
    applyDiscount,
    setCustomer,
    processSale,
    clearSale
  } = useSale(sessionId);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const canProceedToPayment = currentSale.items.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger 
              value="payment" 
              disabled={!canProceedToPayment}
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Payment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-4">
            <ProductSearch onAddItem={addItem} />
          </TabsContent>

          <TabsContent value="payment" className="mt-4">
            <PaymentProcessor
              sale={currentSale}
              onProcessSale={processSale}
              onBackToSale={() => setActiveTab('search')}
            />
          </TabsContent>
        </Tabs>
      </div>

      <div className="lg:col-span-1">
        <SaleCart
          sale={currentSale}
          onRemoveItem={removeItem}
          onUpdateQuantity={updateQuantity}
          onApplyDiscount={applyDiscount}
          onSetCustomer={setCustomer}
          onClearSale={clearSale}
          onProceedToPayment={() => setActiveTab('payment')}
          canProceedToPayment={canProceedToPayment}
        />
      </div>
    </div>
  );
};

export default ActiveSale;
