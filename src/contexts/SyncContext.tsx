import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import syncCoordinator, { SyncReport, SyncStatus } from '@/services/syncCoordinator';
import { useAuth } from './AuthContext';
import { useOrganization } from './OrganizationContext';
import { useToast } from '@/components/ui/use-toast';

interface SyncContextType {
  syncStatus: SyncStatus;
  syncAll: () => Promise<SyncReport | null>;
  syncEntity: (entityType: string) => Promise<SyncReport | null>;
  isSyncing: boolean;
  lastSyncReport: SyncReport | null;
  refreshStatus: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const { toast } = useToast();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncCoordinator.getSyncStatus(organization?.id));
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncReport, setLastSyncReport] = useState<SyncReport | null>(null);

  // Refresh sync status
  const refreshStatus = useCallback(() => {
    const status = syncCoordinator.getSyncStatus(organization?.id);
    setSyncStatus(status);
  }, [organization?.id]);

  // Sync all pending operations
  const syncAll = useCallback(async (): Promise<SyncReport | null> => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to sync data',
        variant: 'destructive',
      });
      return null;
    }

    if (isSyncing) {
      toast({
        title: 'Sync in progress',
        description: 'Please wait for the current sync to complete',
      });
      return null;
    }

    setIsSyncing(true);
    try {
      const report = await syncCoordinator.syncAll(user.id, organization?.id);
      setLastSyncReport(report);
      refreshStatus();

      if (report.failed > 0) {
        toast({
          title: 'Sync completed with errors',
          description: `${report.successful} succeeded, ${report.failed} failed`,
          variant: 'destructive',
        });
      } else if (report.totalOperations > 0) {
        toast({
          title: 'Sync completed',
          description: `Successfully synced ${report.successful} operations`,
        });
      }

      return report;
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'An error occurred during sync',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [user, organization?.id, isSyncing, toast, refreshStatus]);

  // Sync specific entity type
  const syncEntity = useCallback(async (entityType: string): Promise<SyncReport | null> => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to sync data',
        variant: 'destructive',
      });
      return null;
    }

    if (isSyncing) {
      toast({
        title: 'Sync in progress',
        description: 'Please wait for the current sync to complete',
      });
      return null;
    }

    setIsSyncing(true);
    try {
      const report = await syncCoordinator.syncEntity(entityType, user.id, organization?.id);
      setLastSyncReport(report);
      refreshStatus();

      if (report.failed > 0) {
        toast({
          title: `${entityType} sync completed with errors`,
          description: `${report.successful} succeeded, ${report.failed} failed`,
          variant: 'destructive',
        });
      } else if (report.totalOperations > 0) {
        toast({
          title: `${entityType} sync completed`,
          description: `Successfully synced ${report.successful} operations`,
        });
      }

      return report;
    } catch (error) {
      console.error(`${entityType} sync error:`, error);
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'An error occurred during sync',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [user, organization?.id, isSyncing, toast, refreshStatus]);

  // Perform initial sync on app startup when user is authenticated
  useEffect(() => {
    if (user && syncCoordinator.hasPendingSync(organization?.id)) {
      // Delay initial sync slightly to allow app to fully initialize
      const timer = setTimeout(() => {
        syncAll();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [user, organization?.id, syncAll]);

  // Refresh status periodically
  useEffect(() => {
    const interval = setInterval(refreshStatus, 5000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  return (
    <SyncContext.Provider
      value={{
        syncStatus,
        syncAll,
        syncEntity,
        isSyncing,
        lastSyncReport,
        refreshStatus,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = (): SyncContextType => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
