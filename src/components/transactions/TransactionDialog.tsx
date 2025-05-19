
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Transaction } from '@/types';

interface TransactionDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  addTransaction: (transaction: Partial<Transaction>) => void;
}

const TransactionDialog: React.FC<TransactionDialogProps> = ({ open, setOpen, addTransaction }) => {
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    type: 'sale',
    amount: 0,
    description: '',
    date: new Date().toISOString().substring(0, 10),
  });
  const { toast } = useToast();

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

    addTransaction({
      ...newTransaction,
      type: transactionType,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddTransaction}>Save Transaction</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDialog;
