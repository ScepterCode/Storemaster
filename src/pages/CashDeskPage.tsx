
import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useCashDesk } from '@/hooks/useCashDesk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CustomerSelection from '@/components/cash-desk/CustomerSelection';
import CartItems from '@/components/cash-desk/CartItems';
import ProductsList from '@/components/cash-desk/ProductsList';
import PaymentForm from '@/components/cash-desk/PaymentForm';
import Receipt from '@/components/cash-desk/Receipt';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, CreditCard, Printer } from 'lucide-react';

const CashDeskPage = () => {
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
    finalizeCurrentInvoice,
    processPayment,
    paymentDetails,
    setPaymentDetails,
    clearCart,
  } = useCashDesk();

  console.log('Current state:', {
    cart: cart.length,
    selectedCustomer,
    activeTab,
    products: products.length,
    customers: customers.length
  });

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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Cash Desk</h1>
          <p className="text-muted-foreground">Process sales and manage customer transactions</p>
        </div>

        {receiptMode && currentInvoice ? (
          <div className="animate-fade-in">
            <Receipt invoice={currentInvoice} paymentDetails={paymentDetails} />
            <div className="mt-4 flex gap-4 justify-end">
              <Button variant="outline" onClick={handleNewSale}>
                New Sale
              </Button>
              <Button>
                <Printer className="mr-2 h-4 w-4" /> Print Receipt
              </Button>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fade-in">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sale">
                <ShoppingCart className="mr-2 h-4 w-4" /> Sale
              </TabsTrigger>
              <TabsTrigger value="checkout" disabled={!canProceedToCheckout}>
                <CreditCard className="mr-2 h-4 w-4" /> Checkout
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sale" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Left column - Customer selection */}
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle>Customer</CardTitle>
                    <CardDescription>Select or add a customer</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CustomerSelection
                      customers={customers}
                      selectedCustomer={selectedCustomer}
                      onSelectCustomer={handleCustomerSelect}
                      showNewCustomerForm={showNewCustomerForm}
                      setShowNewCustomerForm={setShowNewCustomerForm}
                      onCreateCustomer={createNewCustomer}
                    />
                  </CardContent>
                </Card>
                
                {/* Right column - Product grid and Cart */}
                <div className="md:col-span-2 space-y-4">
                  {/* Search bar */}
                  <Card>
                    <CardContent className="pt-4">
                      <div>
                        <Label htmlFor="search-products" className="sr-only">Search Products</Label>
                        <Input
                          id="search-products"
                          placeholder="Search products by name or category"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Product list */}
                  <ProductsList products={products} onAddToCart={addToCart} />
                  
                  {/* Cart */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Shopping Cart ({cart.length} items)</CardTitle>
                      <CardDescription>Items to be purchased</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CartItems />
                    </CardContent>
                    <CardFooter className="flex-col border-t pt-4">
                      <div className="flex justify-between items-center w-full mb-4">
                        <span className="text-lg font-medium">Total:</span>
                        <span className="text-lg font-bold">₦{cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-end w-full">
                        <Button
                          onClick={handleCheckout}
                          disabled={!canProceedToCheckout}
                          className="w-full sm:w-auto"
                        >
                          Proceed to Checkout
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="checkout" className="space-y-4">
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
                  <Button variant="outline" onClick={() => setActiveTab('sale')}>
                    Back to Sale
                  </Button>
                  <Button onClick={handleCompletePayment} disabled={paymentDetails.amount < cartTotal}>
                    Complete Payment
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
};

export default CashDeskPage;
