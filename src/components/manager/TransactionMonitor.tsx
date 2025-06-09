import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Filter, Download, RefreshCw } from "lucide-react";
import { StaffTransaction, ManagerOverviewFilters } from "@/types/manager";
import { useManagerData } from "@/hooks/useManagerData";
import { formatCurrency } from "@/lib/formatter";

const TransactionMonitor = () => {
  const [filters, setFilters] = useState<ManagerOverviewFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const { transactions, loading, refreshTransactions } = useManagerData();

  const filteredTransactions = transactions.filter((transaction) => {
    if (
      searchTerm &&
      !transaction.transactionId
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) &&
      !transaction.cashierName.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    if (filters.cashierId && transaction.cashierId !== filters.cashierId)
      return false;
    if (
      filters.paymentMethod &&
      transaction.paymentMethod !== filters.paymentMethod
    )
      return false;
    if (filters.minAmount && transaction.total < filters.minAmount)
      return false;
    if (filters.maxAmount && transaction.total > filters.maxAmount)
      return false;
    if (!filters.includeRefunded && transaction.refunded) return false;
    if (!filters.includeVoided && transaction.voided) return false;

    return true;
  });

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case "cash":
        return "bg-green-100 text-green-800";
      case "card":
        return "bg-blue-100 text-blue-800";
      case "transfer":
        return "bg-purple-100 text-purple-800";
      case "wallet":
        return "bg-orange-100 text-orange-800";
      case "split":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Transaction Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  cashierId: value === "all" ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Cashiers" />
              </SelectTrigger>
              <SelectContent>
                {/* TODO: Add cashier options */}
                <SelectItem value="all">All Cashiers</SelectItem>
              </SelectContent>
            </Select>

            <Select
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  paymentMethod: value === "all" ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="wallet">Wallet</SelectItem>
                <SelectItem value="split">Split</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              onChange={(e) =>
                setFilters({ ...filters, dateFrom: e.target.value })
              }
            />

            <Input
              type="date"
              onChange={(e) =>
                setFilters({ ...filters, dateTo: e.target.value })
              }
            />

            <Button onClick={refreshTransactions} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Real-time Transactions</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Cashier</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading transactions...
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.slice(0, 50).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-sm">
                        {transaction.transactionId.substring(0, 8)}
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.timestamp).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>{transaction.cashierName}</TableCell>
                      <TableCell>{transaction.items.length} items</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(transaction.total)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getPaymentMethodColor(
                            transaction.paymentMethod
                          )}
                        >
                          {transaction.paymentMethod.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transaction.customer?.name || "Walk-in"}
                      </TableCell>
                      <TableCell>
                        {transaction.refunded && (
                          <Badge variant="destructive">Refunded</Badge>
                        )}
                        {transaction.voided && (
                          <Badge variant="outline">Voided</Badge>
                        )}
                        {!transaction.refunded && !transaction.voided && (
                          <Badge variant="default">Complete</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionMonitor;
