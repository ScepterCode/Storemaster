
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatNaira, generateId, formatDate } from '@/lib/formatter';
import { getStoredItems, addItem, STORAGE_KEYS } from '@/lib/offlineStorage';
import { Transaction } from '@/types';
import { Plus, ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react';

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [open, setOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    type: 'sale',
    amount: 0,
    description: '',
    date: new Date().toISOString().substring(0, 10),
  });
  const { toast } = useToast();

  useEffect(() => {
    // Load transactions from offline storage
    const storedTransactions = getStoredItems<Transaction>(STORAGE_KEYS.TRANSACTIONS);
    setTransactions(storedTransactions);
  }, []);

  const handleAddTransaction = () => {
    if (!newTransaction.amount || !newTransaction.description || !newTransaction.date || !newTransaction.type) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // TypeScript type assertion for transaction.type
    const transactionType = newTransaction.type as 'sale' | 'purchase' | 'expense';

    const transaction: Transaction = {
      id: generateId(),
      amount: Number(newTransaction.amount),
      description: newTransaction.description,
      date: newTransaction.date,
      type: transactionType,
      category: newTransaction.category,
      reference: newTransaction.reference,
      synced: false,
    };

    // Add to local storage
    addItem<Transaction>(STORAGE_KEYS.TRANSACTIONS, transaction);

    // Update state
    setTransactions([...transactions, transaction]);

    // Notify user
    toast({
      title: "Transaction Added",
      description: "Your transaction has been recorded successfully",
    });

    // Reset form
    setNewTransaction({
      type: 'sale',
      amount: 0,
      description: '',
      date: new Date().toISOString().substring(0, 10),
    });
    setOpen(false);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <ArrowUpRight className="text-green-500" />;
      case 'purchase':
        return <ArrowDownRight className="text-amber-500" />;
      case 'expense':
        return <CreditCard className="text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Transactions</h1>
            <p className="text-muted-foreground">Record and view your business transactions</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Transaction</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Transaction Type</Label>
                  <Select 
                    value={newTransaction.type as string || 'sale'} 
                    onValueChange={(value: string) => {
                      // Ensuring type safety
                      if (value === 'sale' || value === 'purchase' || value === 'expense') {
                        setNewTransaction({ ...newTransaction, type: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Transaction Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">Sale</SelectItem>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount (₦)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newTransaction.amount || ''}
                    onChange={(e) => setNewTransaction({ ...newTransaction, amount: Number(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newTransaction.description || ''}
                    onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newTransaction.date || ''}
                    onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category (Optional)</Label>
                  <Input
                    id="category"
                    value={newTransaction.category || ''}
                    onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reference">Reference (Optional)</Label>
                  <Input
                    id="reference"
                    value={newTransaction.reference || ''}
                    onChange={(e) => setNewTransaction({ ...newTransaction, reference: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleAddTransaction}>Save Transaction</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {transactions.length > 0 ? (
            transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((transaction) => (
              <Card key={transaction.id} className="hover-lift glass-card overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{transaction.description}</CardTitle>
                      <CardDescription>
                        {formatDate(transaction.date)}
                        {transaction.category && ` • ${transaction.category}`}
                        {transaction.reference && ` • Ref: ${transaction.reference}`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(transaction.type)}
                      <span className={`font-semibold ${
                        transaction.type === 'sale' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {formatNaira(transaction.amount)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardFooter className="pt-1 pb-2 border-t">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span className="capitalize">
                      {transaction.type}
                    </span>
                    {!transaction.synced && (
                      <span className="ml-auto bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full">
                        Not synced
                      </span>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))
          ) : (
            <Card className="text-center p-8 glass-card">
              <CardContent className="space-y-4 pt-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl">No Transactions Yet</CardTitle>
                <CardDescription>
                  Add your first transaction to get started with tracking your business finances
                </CardDescription>
                <Button className="mt-4" onClick={() => setOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add First Transaction
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default TransactionsPage;
