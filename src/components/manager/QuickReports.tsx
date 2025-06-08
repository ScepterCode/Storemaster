
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Table, Calendar } from 'lucide-react';

const QuickReports = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-auto p-4 flex-col">
            <FileText className="h-6 w-6 mb-2" />
            <span className="font-medium">Today's Summary</span>
            <span className="text-xs text-muted-foreground">All transactions today</span>
          </Button>
          
          <Button variant="outline" className="h-auto p-4 flex-col">
            <Table className="h-6 w-6 mb-2" />
            <span className="font-medium">Staff Performance</span>
            <span className="text-xs text-muted-foreground">This week's performance</span>
          </Button>
          
          <Button variant="outline" className="h-auto p-4 flex-col">
            <Calendar className="h-6 w-6 mb-2" />
            <span className="font-medium">Monthly Report</span>
            <span className="text-xs text-muted-foreground">Complete month overview</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickReports;
