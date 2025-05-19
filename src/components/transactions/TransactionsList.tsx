
import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { formatNaira, formatDate } from '@/lib/formatter';
import { Transaction } from '@/types';
import { ArrowUpRight, ArrowDownRight, CreditCard, Plus } from 'lucide-react';
import EmptyTransactionState from './EmptyTransactionState';

interface TransactionsListProps {
  transactions: Transaction[];
}

const TransactionsList: React.FC<TransactionsListProps> = ({ transactions }) => {
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

  if (transactions.length === 0) {
    return <EmptyTransactionState onAddClick={() => {}} />;
  }

  return (
    <div className="space-y-4">
      {transactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((transaction) => (
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
                  <span
                    className={`font-semibold ${
                      transaction.type === 'sale' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatNaira(transaction.amount)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardFooter className="pt-1 pb-2 border-t">
              <div className="flex items-center text-xs text-muted-foreground">
                <span className="capitalize">{transaction.type}</span>
                {!transaction.synced && (
                  <span className="ml-auto bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full">
                    Not synced
                  </span>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
    </div>
  );
};

export default TransactionsList;
