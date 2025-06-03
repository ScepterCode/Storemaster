
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { usePermissions } from '@/hooks/usePermissions';
import AccessDenied from '@/components/cash-desk/AccessDenied';
import CashDeskTabs from '@/components/cash-desk/CashDeskTabs';

const CashDeskPage = () => {
  const { canEditCashDesk } = usePermissions();

  console.log('CashDesk state:', {
    canEditCashDesk
  });

  // Check if user can edit cash desk
  if (!canEditCashDesk) {
    return <AccessDenied />;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Cash Desk</h1>
          <p className="text-muted-foreground">Process sales and manage customer transactions</p>
        </div>

        <CashDeskTabs />
      </div>
    </AppLayout>
  );
};

export default CashDeskPage;
