/**
 * Platform Analytics Page
 * 
 * Display platform statistics, revenue charts, and growth metrics
 * Requirements: 7.1, 7.2, 7.3
 */

import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '@/services/adminService';
import { PlatformStats } from '@/types/admin';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Loader2,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// Mock data for revenue trend (last 6 months)
const generateRevenueData = (mrr: number) => {
  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map((month, index) => ({
    month,
    revenue: Math.round(mrr * (0.7 + (index * 0.05)) * 100) / 100,
    subscriptions: Math.round(10 + (index * 2)),
  }));
};

// Mock data for organization growth
const generateGrowthData = (total: number) => {
  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map((month, index) => ({
    month,
    organizations: Math.round(total * (0.5 + (index * 0.08))),
    active: Math.round(total * (0.45 + (index * 0.08))),
  }));
};

const AnalyticsPage = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPlatformStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getPlatformStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading platform stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load platform statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlatformStats();
  }, [loadPlatformStats]);

  // Set up real-time subscription for stats updates
  useEffect(() => {
    const channel = supabase
      .channel('analytics-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'organizations' },
        () => {
          console.log('Organizations changed, refreshing analytics...');
          loadPlatformStats();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions' },
        () => {
          console.log('Subscriptions changed, refreshing analytics...');
          loadPlatformStats();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'organization_members' },
        () => {
          console.log('Members changed, refreshing analytics...');
          loadPlatformStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadPlatformStats]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadPlatformStats();
    }, 60000);

    return () => clearInterval(interval);
  }, [loadPlatformStats]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const calculateGrowthRate = () => {
    if (!stats || stats.total_organizations === 0) return 0;
    return (stats.new_signups_this_month / stats.total_organizations) * 100;
  };

  const revenueData = stats ? generateRevenueData(stats.mrr) : [];
  const growthData = stats ? generateGrowthData(stats.total_organizations) : [];
  const growthRate = calculateGrowthRate();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Platform Analytics</h2>
        <p className="text-muted-foreground">
          Monitor platform performance, revenue, and growth metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_organizations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active_organizations} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users}</div>
            <p className="text-xs text-muted-foreground">
              Across all organizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.mrr)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.total_revenue)} annual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            {growthRate >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(growthRate)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.new_signups_this_month} new this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>
            Monthly recurring revenue over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              revenue: {
                label: 'Revenue',
                color: 'hsl(var(--chart-1))',
              },
            }}
            className="h-[300px]"
          >
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-revenue)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-revenue)' }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Growth Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Organization Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Growth</CardTitle>
            <CardDescription>
              Total and active organizations over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                organizations: {
                  label: 'Total',
                  color: 'hsl(var(--chart-1))',
                },
                active: {
                  label: 'Active',
                  color: 'hsl(var(--chart-2))',
                },
              }}
              className="h-[250px]"
            >
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="organizations"
                  fill="var(--color-organizations)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="active"
                  fill="var(--color-active)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Subscription Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Metrics</CardTitle>
            <CardDescription>
              Key subscription performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Active Subscriptions</span>
                </div>
                <span className="text-sm font-bold">{stats.active_organizations}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">New This Month</span>
                </div>
                <span className="text-sm font-bold">{stats.new_signups_this_month}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Churn Rate</span>
                </div>
                <span className="text-sm font-bold">{formatPercentage(stats.churn_rate)}</span>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Average Revenue Per User</span>
                </div>
                <span className="text-sm font-bold">
                  {stats.total_users > 0
                    ? formatCurrency(stats.mrr / stats.total_users)
                    : formatCurrency(0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Activation Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total_organizations > 0
                ? formatPercentage(
                    (stats.active_organizations / stats.total_organizations) * 100
                  )
                : '0%'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Organizations with active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Average Team Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.active_organizations > 0
                ? Math.round(stats.total_users / stats.active_organizations)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Users per active organization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Annual Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.total_revenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Projected annual recurring revenue
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
