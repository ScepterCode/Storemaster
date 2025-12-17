import React from 'react';
import { useSync } from '@/contexts/SyncContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SyncStatusProps {
  showDetails?: boolean;
  compact?: boolean;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ showDetails = true, compact = false }) => {
  const { syncStatus, syncAll, isSyncing, lastSyncReport } = useSync();

  const formatLastSyncTime = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  const handleSync = async () => {
    await syncAll();
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {syncStatus.pendingOperations > 0 && (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {syncStatus.pendingOperations} pending
          </Badge>
        )}
        {isSyncing && (
          <Badge variant="secondary" className="gap-1">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Syncing...
          </Badge>
        )}
        {!isSyncing && syncStatus.pendingOperations === 0 && syncStatus.lastSyncTime && (
          <Badge variant="outline" className="gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            Synced
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sync Status</CardTitle>
            <CardDescription>
              Monitor and manage data synchronization
            </CardDescription>
          </div>
          <Button
            onClick={handleSync}
            disabled={isSyncing || syncStatus.pendingOperations === 0}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sync Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pending Operations */}
          <div className="flex items-center gap-3 p-3 rounded-lg border">
            <div className={`p-2 rounded-full ${
              syncStatus.pendingOperations > 0 ? 'bg-yellow-100' : 'bg-green-100'
            }`}>
              {syncStatus.pendingOperations > 0 ? (
                <Clock className="h-5 w-5 text-yellow-600" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">Pending Operations</p>
              <p className="text-2xl font-bold">{syncStatus.pendingOperations}</p>
            </div>
          </div>

          {/* Last Sync Time */}
          <div className="flex items-center gap-3 p-3 rounded-lg border">
            <div className="p-2 rounded-full bg-blue-100">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Last Sync</p>
              <p className="text-sm text-muted-foreground">
                {formatLastSyncTime(syncStatus.lastSyncTime)}
              </p>
            </div>
          </div>

          {/* Sync Status */}
          <div className="flex items-center gap-3 p-3 rounded-lg border">
            <div className={`p-2 rounded-full ${
              isSyncing ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <RefreshCw className={`h-5 w-5 ${
                isSyncing ? 'text-blue-600 animate-spin' : 'text-gray-600'
              }`} />
            </div>
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-sm font-semibold">
                {isSyncing ? 'Syncing...' : 'Idle'}
              </p>
            </div>
          </div>
        </div>

        {/* Last Sync Report */}
        {showDetails && lastSyncReport && lastSyncReport.totalOperations > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Last Sync Report</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded border text-center">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold">{lastSyncReport.totalOperations}</p>
              </div>
              <div className="p-2 rounded border text-center bg-green-50">
                <p className="text-xs text-muted-foreground">Successful</p>
                <p className="text-lg font-bold text-green-600">{lastSyncReport.successful}</p>
              </div>
              <div className="p-2 rounded border text-center bg-red-50">
                <p className="text-xs text-muted-foreground">Failed</p>
                <p className="text-lg font-bold text-red-600">{lastSyncReport.failed}</p>
              </div>
            </div>

            {/* Error Details */}
            {lastSyncReport.errors.length > 0 && (
              <div className="mt-3 space-y-2">
                <h5 className="text-sm font-semibold text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Sync Errors
                </h5>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {lastSyncReport.errors.map((err, idx) => (
                    <div key={idx} className="p-2 rounded bg-red-50 border border-red-200">
                      <p className="text-xs font-medium">
                        {err.operation.entityType} - {err.operation.operation}
                      </p>
                      <p className="text-xs text-red-600">{err.error.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Message */}
        {syncStatus.pendingOperations === 0 && !isSyncing && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-700">
              All data is synchronized with the server
            </p>
          </div>
        )}

        {syncStatus.pendingOperations > 0 && !isSyncing && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-700">
              You have {syncStatus.pendingOperations} operation(s) waiting to be synchronized
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SyncStatus;
