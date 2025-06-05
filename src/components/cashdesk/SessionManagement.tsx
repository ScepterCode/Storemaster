
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { DollarSign, Play } from 'lucide-react';

interface SessionManagementProps {
  onStartSession: (openingFloat: number) => Promise<void>;
}

const SessionManagement: React.FC<SessionManagementProps> = ({ onStartSession }) => {
  const [openingFloat, setOpeningFloat] = useState<number>(0);
  const [isStarting, setIsStarting] = useState(false);
  const { toast } = useToast();

  const handleStartSession = async () => {
    if (openingFloat < 0) {
      toast({
        title: "Invalid Amount",
        description: "Opening float cannot be negative",
        variant: "destructive",
      });
      return;
    }

    setIsStarting(true);
    try {
      await onStartSession(openingFloat);
      toast({
        title: "Session Started",
        description: `Cashier session started with ₦${openingFloat.toFixed(2)} opening float`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <DollarSign className="h-5 w-5" />
          Start Cashier Session
        </CardTitle>
        <CardDescription>
          Enter your opening cash float to begin processing sales
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="opening-float">Opening Float (₦)</Label>
          <Input
            id="opening-float"
            type="number"
            step="0.01"
            min="0"
            value={openingFloat}
            onChange={(e) => setOpeningFloat(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
          />
        </div>
        
        <Button 
          onClick={handleStartSession} 
          disabled={isStarting}
          className="w-full"
        >
          {isStarting ? (
            "Starting Session..."
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Start Session
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SessionManagement;
