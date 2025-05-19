
import React from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EmptyTransactionStateProps {
  onAddClick: () => void;
  title?: string;
  description?: string;
  buttonText?: string;
}

const EmptyTransactionState: React.FC<EmptyTransactionStateProps> = ({ 
  onAddClick,
  title = "No Transactions Yet",
  description = "Add your first transaction to get started with tracking your business finances",
  buttonText = "Add First Transaction"
}) => {
  return (
    <Card className="text-center p-8 glass-card">
      <CardContent className="space-y-4 pt-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Plus className="h-8 w-8 text-muted-foreground" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
        <Button className="mt-4" onClick={onAddClick}>
          <Plus className="mr-2 h-4 w-4" /> {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmptyTransactionState;
