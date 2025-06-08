
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Clock, CreditCard, Package } from 'lucide-react';
import { useManagerData } from '@/hooks/useManagerData';
import { formatCurrency } from '@/lib/formatter';

const SalesAnalytics = () => {
  const [dateRange, setDateRange] = useState('today');
  const { salesAnalytics, loading } = useManagerData();

  console.log('SalesAnalytics render - dateRange:', dateRange, 'loading:', loading, 'analytics:', salesAnalytics);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const hourlyData = React.useMemo(() => {
    return salesAnalytics?.peakHours?.map(hour => ({
      hour: `${hour.hour}:00`,
      transactions: hour.transactionCount,
      revenue: hour.revenue
    })) || [];
  }, [salesAnalytics]);

  const paymentData = React.useMemo(() => {
    if (!salesAnalytics?.paymentMethodBreakdown) return [];
    
    return Object.entries(salesAnalytics.paymentMethodBreakdown).map(([method, amount]) => ({
      name: method.charAt(0).toUpperCase() + method.slice(1),
      value: amount,
      percentage: ((amount / (salesAnalytics?.totalRevenue || 1)) * 100).toFixed(1)
    }));
  }, [salesAnalytics]);

  // Ultra-safe date range options with guaranteed non-empty values
  const safeDateRangeOptions = React.useMemo(() => {
    const baseOptions = [
      { value: 'today', label: 'Today' },
      { value: 'yesterday', label: 'Yesterday' },
      { value: 'week', label: 'This Week' },
      { value: 'month', label: 'This Month' }
    ];

    // Double-check each option
    return baseOptions.filter(option => {
      const isValid = option.value && 
                     typeof option.value === 'string' && 
                     option.value.trim().length > 0 && 
                     option.value !== 'undefined' && 
                     option.value !== 'null';
      console.log('SalesAnalytics - Option validation:', option.value, 'isValid:', isValid);
      return isValid;
    });
  }, []);

  // Ensure safe date range value
  const safeDateRange = React.useMemo(() => {
    if (!dateRange || 
        typeof dateRange !== 'string' || 
        dateRange.trim() === '' || 
        dateRange === 'undefined' || 
        dateRange === 'null') {
      console.log('SalesAnalytics - Invalid dateRange, using default:', dateRange);
      return 'today';
    }
    console.log('SalesAnalytics - Valid dateRange:', dateRange);
    return dateRange;
  }, [dateRange]);

  console.log('SalesAnalytics - Final safeDateRange:', safeDateRange);
  console.log('SalesAnalytics - Final safeDateRangeOptions:', safeDateRangeOptions);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-lg">Loading sales analytics...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={safeDateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              {safeDateRangeOptions.length > 0 ? safeDateRangeOptions.map((option, index) => {
                // Ultra-strict validation before rendering
                const finalValue = option.value && 
                                 typeof option.value === 'string' && 
                                 option.value.trim().length > 0 
                  ? option.value.trim() 
                  : `fallback-range-${index}-${Date.now()}`;
                
                console.log('SalesAnalytics - About to render SelectItem with value:', finalValue, 'original:', option.value);
                
                // Additional validation - throw error if somehow still empty
                if (!finalValue || finalValue.trim() === '') {
                  console.error('SalesAnalytics - CRITICAL: Empty value detected for SelectItem:', finalValue, option);
                  return null;
                }
                
                return (
                  <SelectItem key={`range-option-${index}-${finalValue}`} value={finalValue}>
                    {option.label || `Option ${index + 1}`}
                  </SelectItem>
                );
              }).filter(Boolean) : (
                <SelectItem key="no-options" value="today">
                  Today
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(salesAnalytics?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {salesAnalytics?.totalTransactions || 0} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(salesAnalytics?.averageTransactionValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesAnalytics?.peakHours?.[0]?.hour || 0}:00
            </div>
            <p className="text-xs text-muted-foreground">
              {salesAnalytics?.peakHours?.[0]?.transactionCount || 0} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Payment</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {paymentData[0]?.name || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {paymentData[0]?.percentage || 0}% of sales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Hourly Sales Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(value as number) : value,
                    name === 'revenue' ? 'Revenue' : 'Transactions'
                  ]}
                />
                <Bar dataKey="transactions" fill="#8884d8" name="transactions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {salesAnalytics?.topSellingProducts?.slice(0, 10).map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {product.quantitySold} units sold
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(product.revenue)}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(product.revenue / product.quantitySold)} avg
                  </div>
                </div>
              </div>
            )) || (
              <div className="text-center py-8 text-muted-foreground">
                No product data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesAnalytics;
