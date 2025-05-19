
import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import TransactionsList from '@/components/transactions/TransactionsList';
import TransactionDialog from '@/components/transactions/TransactionDialog';
import EmptyTransactionState from '@/components/transactions/EmptyTransactionState';
import { useTransactions } from '@/hooks/useTransactions';

const TransactionsPage = () => {
  const [open, setOpen] = useState(false);
  const { transactions, loading, addTransaction } = useTransactions();

  const handleAddTransaction = (transaction: any) => {
    if (addTransaction(transaction)) {
      setOpen(false);
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
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Transaction
          </Button>
          
          <TransactionDialog 
            open={open} 
            setOpen={setOpen} 
            addTransaction={handleAddTransaction} 
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <TransactionsList transactions={transactions} />
        ) : (
          <EmptyTransactionState onAddClick={() => setOpen(true)} />
        )}
      </div>
    </AppLayout>
  );
};

export default TransactionsPage;
