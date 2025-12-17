
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { formatNaira } from '@/lib/formatter';
import { Product, DashboardStats } from '@/types';
import { Plus, ArrowUp, ArrowDown, Calendar } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useProducts } from '@/hooks/useProducts';
import { useInvoices } from '@/hooks/useInvoices';
import { useOrganization } from '@/contexts/OrganizationContext';
import AnalyticsPreview from '@/components/dashboard/AnalyticsPreview';

const DashboardPage = () => {
  const { transactions } = useTransactions();
  const { products } = useProducts();
  const { invoices } = useInvoices();
  const { organization } = useOrganization();
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    profit: 0,
    lowStockItems: 0,
    pendingInvoices: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  
  useEffect(() => {
    console.log('Dashboard: products array:', products);
    console.log('Dashboard: products length:', products.length);
    
    // Calculate dashboard stats from hooks data
    const sales = transactions.filter(t => t.type === 'sale');
    const expenses = transactions.filter(t => t.type === 'expense' || t.type === 'purchase');
    
    const totalRevenue = sales.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const lowStockItems = products.filter(p => p.quantity <= 5).length;
    const pendingInvoices = invoices.filter(i => i.status === 'issued' || i.status === 'overdue').length;

    console.log('Dashboard: lowStockItems count:', lowStockItems);

    setStats({
      totalRevenue,
      totalExpenses,
      profit: totalRevenue - totalExpenses,
      lowStockItems,
      pendingInvoices,
    });

    // Get low stock products
    const lowStock = products
      .filter(p => p.quantity <= 5)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5);
    console.log('Dashboard: lowStock products:', lowStock);
    setLowStockProducts(lowStock);
  }, [transactions, products, invoices]);

  // Get recent transactions (derived from transactions state)
  const recentTransactions = React.useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  const renderTransactionIcon = (type: string) => {
    if (type === 'sale') {
      return <ArrowUp className="h-4 w-4 text-green-500" />;
    } else {
      return <ArrowDown className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back to your business overview</p>
          </div>
          <Button className="bg-primary text-white hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> New Transaction
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNaira(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNaira(stats.totalExpenses)}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNaira(stats.profit)}</div>
              <div className="mt-2">
                <Progress value={stats.profit > 0 ? (stats.profit / stats.totalRevenue) * 100 : 0} className="h-2" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
              <p className="text-xs text-muted-foreground mt-1">Unpaid invoices</p>
            </CardContent>
          </Card>
        </div>

        {/* Show analytics preview for free users */}
        {organization?.subscription_tier === 'free' && (
          <AnalyticsPreview />
        )}

        <Tabs defaultValue="recent">
          <TabsList className="grid w-full grid-cols-2 h-12 mb-4">
            <TabsTrigger value="recent">Recent Transactions</TabsTrigger>
            <TabsTrigger value="inventory">Low Stock Items</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent" className="mt-0 border rounded-lg">
            {recentTransactions.length > 0 ? (
              <div className="divide-y">
                {recentTransactions.map(transaction => (
                  <div key={transaction.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center">
                      <div className="mr-4 rounded-full p-2 bg-muted">
                        {renderTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {new Date(transaction.date).toLocaleDateString('en-NG')}
                        </p>
                      </div>
                    </div>
                    <div className={`text-right ${transaction.type === 'sale' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'sale' ? '+' : '-'} {formatNaira(transaction.amount)}
                      <p className="text-xs text-muted-foreground capitalize">{transaction.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No transactions yet.</p>
                <Button variant="outline" className="mt-4">
                  <Plus className="mr-2 h-4 w-4" /> Add Transaction
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="inventory" className="mt-0 border rounded-lg">
            {lowStockProducts.length > 0 ? (
              <div className="divide-y">
                {lowStockProducts.map(product => (
                  <div key={product.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Unit Price: {formatNaira(product.unitPrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${product.quantity === 0 ? 'text-red-600' : product.quantity < 5 ? 'text-amber-600' : ''}`}>
                        {product.quantity} units left
                      </div>
                      <Progress 
                        value={product.quantity * 20} 
                        className="h-1 w-24 mt-1"
                        indicatorClassName={product.quantity === 0 ? 'bg-red-600' : product.quantity < 5 ? 'bg-amber-600' : ''}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No low stock items.</p>
                <Button variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" /> Add Inventory
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
