/**
 * Stock Predictions Page
 * 
 * Dashboard for viewing all stock predictions and reorder recommendations
 */

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/hooks/useProducts';
import { useStockPredictions } from '@/hooks/useStockPredictions';
import { ReorderRecommendations } from '@/components/ai/ReorderRecommendations';
import { StockPredictionCard } from '@/components/ai/StockPredictionCard';
import { AlertTriangle, TrendingUp, Package, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import FeatureGuard from '@/components/auth/FeatureGuard';

const StockPredictionsPage: React.FC = () => {
  const { products, loading: productsLoading } = useProducts();
  const { predictions, reorderNeeded, criticalProducts, loading, error } =
    useStockPredictions(products);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Trigger re-fetch by updating products
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (productsLoading || loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <FeatureGuard feature="advanced_reports">
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Stock Predictions
              </h1>
              <p className="text-muted-foreground">
                AI-powered reorder recommendations
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Total Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{predictions.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Being monitored
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Reorder Needed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {reorderNeeded.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Within 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Critical Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 flex items-center gap-2">
                  {criticalProducts.length}
                  {criticalProducts.length > 0 && (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Less than 7 days
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Error Message */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs defaultValue="reorder" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="reorder">
                Reorder Needed ({reorderNeeded.length})
              </TabsTrigger>
              <TabsTrigger value="critical">
                Critical ({criticalProducts.length})
              </TabsTrigger>
              <TabsTrigger value="all">
                All Products ({predictions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reorder" className="mt-6">
              <ReorderRecommendations
                predictions={reorderNeeded}
                onReorder={(productId, quantity) => {
                  console.log(`Reorder ${quantity} units of ${productId}`);
                  // TODO: Implement reorder functionality
                }}
              />
            </TabsContent>

            <TabsContent value="critical" className="mt-6">
              {criticalProducts.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No critical stock issues!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {criticalProducts.map((prediction) => (
                    <StockPredictionCard
                      key={prediction.product_id}
                      prediction={prediction}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="all" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {predictions.map((prediction) => (
                  <StockPredictionCard
                    key={prediction.product_id}
                    prediction={prediction}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </FeatureGuard>
    </AppLayout>
  );
};

export default StockPredictionsPage;
