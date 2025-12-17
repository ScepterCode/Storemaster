import React, { useMemo } from "react";
import { Navigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStock } from "@/hooks/useStock";
import { useAuth } from "@/contexts/AuthContext";
import { Search, RefreshCw, Package } from "lucide-react";

const StockPage: React.FC = () => {
  const {
    products,
    categories,
    loading,
    refreshStock,
    calculateCategoryTotal,
    calculateTotalInventoryValue,
  } = useStock();
  const [searchQuery, setSearchQuery] = React.useState("");
  const { user } = useAuth(); // Hook call

  // Group products by category - HOOK CALL (useMemo)
  const productsByCategory = useMemo(() => {
    const grouped: Record<string, typeof products> = {};

    // Initialize with empty arrays for all categories
    categories.forEach((category) => {
      grouped[category.id] = [];
    });

    // Group products
    products.forEach((product) => {
      if (product.category) {
        if (!grouped[product.category]) {
          grouped[product.category] = [];
        }

        // Filter by search query if present
        if (
          !searchQuery ||
          product.name.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          grouped[product.category].push(product);
        }
      }
    });

    return grouped;
  }, [products, categories, searchQuery]);

  // All other hook calls should be above this line.

  // Redirect to login if not authenticated - CONDITIONAL RETURN MOVED HERE
  if (!user) {
    return <Navigate to="/" />;
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const totalInventoryValue = calculateTotalInventoryValue();

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Stock Overview</h1>
            <p className="text-muted-foreground">
              View inventory levels and values by category
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="w-[200px] pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refreshStock()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Total Inventory Value */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardHeader className="pb-2">
            <CardDescription>Total Inventory Value</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                formatCurrency(totalInventoryValue)
              )}
            </CardTitle>
          </CardHeader>
        </Card>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[1, 2, 3].map((j) => (
                      <div
                        key={j}
                        className="flex justify-between items-center"
                      >
                        <Skeleton className="h-4 w-1/4" />
                        <div className="flex space-x-4">
                          <Skeleton className="h-4 w-12" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map((category) => {
              const categoryProducts = productsByCategory[category.id] || [];
              const categoryTotal = calculateCategoryTotal(category.id);

              // Skip empty categories when filtering
              if (searchQuery && categoryProducts.length === 0) {
                return null;
              }

              return (
                <Card key={category.id}>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle>{category.name}</CardTitle>
                      {category.description && (
                        <CardDescription>
                          {category.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground text-sm">
                        Category Value
                      </span>
                      <p className="text-xl font-semibold">
                        {formatCurrency(categoryTotal)}
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {categoryProducts.length > 0 ? (
                      <div className="rounded-md border">
                        <table className="w-full caption-bottom text-sm">
                          <thead>
                            <tr className="border-b bg-muted/50 hover:bg-muted/70">
                              <th className="h-10 px-4 text-left align-middle font-medium">
                                Product Name
                              </th>
                              <th className="h-10 px-4 text-right align-middle font-medium">
                                Quantity
                              </th>
                              <th className="h-10 px-4 text-right align-middle font-medium">
                                Unit Price
                              </th>
                              <th className="h-10 px-4 text-right align-middle font-medium">
                                Total Value
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {categoryProducts.map((product) => (
                              <tr
                                key={product.id}
                                className="border-b hover:bg-muted/50"
                              >
                                <td className="px-4 py-2 align-middle">
                                  {product.name}
                                </td>
                                <td className="px-4 py-2 align-middle text-right">
                                  {product.quantity}
                                </td>
                                <td className="px-4 py-2 align-middle text-right">
                                  {formatCurrency(product.unitPrice)}
                                </td>
                                <td className="px-4 py-2 align-middle text-right font-medium">
                                  {formatCurrency(
                                    product.quantity * product.unitPrice
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <Package className="h-8 w-8 text-muted-foreground mb-2" />
                        <h3 className="text-lg font-medium">
                          No products in this category
                        </h3>
                        {searchQuery ? (
                          <p className="text-sm text-muted-foreground">
                            No products match your search
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Add products to this category to see them here
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default StockPage;
