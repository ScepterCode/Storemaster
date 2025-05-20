
import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface TransactionsByType {
  date: string;
  sales: number;
  purchases: number;
  expenses: number;
}

interface CategoryStats {
  name: string;
  value: number;
  count: number;
}

interface ProductStats {
  name: string;
  quantity: number;
  value: number;
}

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Data states
  const [transactionsByDate, setTransactionsByDate] = useState<TransactionsByType[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [topSellingProducts, setTopSellingProducts] = useState<ProductStats[]>([]);
  
  // Formatting helpers
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch transactions for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateString = thirtyDaysAgo.toISOString().split('T')[0];

      // Get transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', dateString)
        .order('date', { ascending: true });

      if (transactionsError) {
        throw new Error(`Failed to fetch transactions: ${transactionsError.message}`);
      }

      // Get products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (productsError) {
        throw new Error(`Failed to fetch products: ${productsError.message}`);
      }

      // Get categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');

      if (categoriesError) {
        throw new Error(`Failed to fetch categories: ${categoriesError.message}`);
      }

      // Process transactions by date
      const transactionsByDateMap: Record<string, TransactionsByType> = {};
      transactionsData.forEach(transaction => {
        if (!transactionsByDateMap[transaction.date]) {
          transactionsByDateMap[transaction.date] = {
            date: transaction.date,
            sales: 0,
            purchases: 0,
            expenses: 0,
          };
        }

        switch (transaction.type) {
          case 'sale':
            transactionsByDateMap[transaction.date].sales += Number(transaction.amount);
            break;
          case 'purchase':
            transactionsByDateMap[transaction.date].purchases += Number(transaction.amount);
            break;
          case 'expense':
            transactionsByDateMap[transaction.date].expenses += Number(transaction.amount);
            break;
        }
      });

      // Convert to array and sort by date
      const transactionsByDateArray = Object.values(transactionsByDateMap);
      transactionsByDateArray.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Process category stats
      const categoryMap: Record<string, { name: string, value: number, count: number }> = {};
      
      // Initialize with categories from the database
      categoriesData.forEach(category => {
        categoryMap[category.id] = {
          name: category.name,
          value: 0,
          count: 0,
        };
      });

      // Map products to their categories and sum values
      productsData.forEach(product => {
        if (product.category_id && categoryMap[product.category_id]) {
          categoryMap[product.category_id].value += product.quantity * product.selling_price;
          categoryMap[product.category_id].count += product.quantity;
        }
      });

      // Convert to array and filter out empty categories
      const categoryStatsArray = Object.values(categoryMap)
        .filter(category => category.value > 0);

      // Process top selling products
      const productStats: ProductStats[] = productsData
        .map(product => ({
          name: product.name,
          quantity: product.quantity,
          value: product.quantity * product.selling_price,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5 products by value

      setTransactionsByDate(transactionsByDateArray);
      setCategoryStats(categoryStatsArray);
      setTopSellingProducts(productStats);

    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load report data');
      
      toast({
        title: 'Error Loading Reports',
        description: err instanceof Error ? err.message : 'Failed to load report data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Business Reports</h1>
          <p className="text-muted-foreground">
            Analyze your business performance with visual reports
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Sales Analysis</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Trends (Last 30 Days)</CardTitle>
                <CardDescription>
                  Compare sales, purchases, and expenses over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {loading ? (
                  <Skeleton className="w-full h-full" />
                ) : transactionsByDate.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={transactionsByDate}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Line type="monotone" dataKey="sales" stroke="#0088FE" name="Sales" />
                      <Line type="monotone" dataKey="purchases" stroke="#00C49F" name="Purchases" />
                      <Line type="monotone" dataKey="expenses" stroke="#FF8042" name="Expenses" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No transaction data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Inventory by Category</CardTitle>
                  <CardDescription>
                    Percentage of inventory value by category
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-64">
                  {loading ? (
                    <Skeleton className="w-full h-full" />
                  ) : categoryStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryStats}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {categoryStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">No category data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Products by Value</CardTitle>
                  <CardDescription>
                    Products with the highest inventory value
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-64">
                  {loading ? (
                    <Skeleton className="w-full h-full" />
                  ) : topSellingProducts.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topSellingProducts} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Bar dataKey="value" name="Inventory Value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">No product data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Performance</CardTitle>
                <CardDescription>
                  Monthly sales trend and analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {loading ? (
                  <Skeleton className="w-full h-full" />
                ) : transactionsByDate.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={transactionsByDate}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar dataKey="sales" name="Sales" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No sales data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Distribution</CardTitle>
                <CardDescription>
                  Inventory quantity by category
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {loading ? (
                  <Skeleton className="w-full h-full" />
                ) : categoryStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => {
                        if (name === 'value') return formatCurrency(Number(value));
                        return value;
                      }} />
                      <Legend />
                      <Bar dataKey="count" name="Quantity" fill="#00C49F" />
                      <Bar dataKey="value" name="Value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No inventory data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ReportsPage;
