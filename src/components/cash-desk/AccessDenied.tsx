
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';

const AccessDenied = () => {
  return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to edit cash desk transactions.</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default AccessDenied;
