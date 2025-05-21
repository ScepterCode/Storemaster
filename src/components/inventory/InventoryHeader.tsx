
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, PackageOpen } from 'lucide-react';

interface InventoryHeaderProps {
  title: string;
  subtitle: string;
  onRefresh: () => void;
  loading: boolean;
  navigateToInventoryManage?: () => void;
}

const InventoryHeader = ({
  title,
  subtitle,
  onRefresh,
  loading,
  navigateToInventoryManage
}: InventoryHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        {navigateToInventoryManage && (
          <Button 
            variant="outline" 
            onClick={navigateToInventoryManage}
          >
            <PackageOpen className="mr-2 h-4 w-4" /> Manage Inventory
          </Button>
        )}
      </div>
    </div>
  );
};

export default InventoryHeader;
