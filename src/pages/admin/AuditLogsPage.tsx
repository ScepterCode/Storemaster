/**
 * Audit Logs Page
 * 
 * Display and search audit logs for platform operations
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '@/services/adminService';
import { AuditLog } from '@/types/admin';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Eye,
  Loader2,
  FileText,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const AuditLogsPage = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all');
  
  // Dialog state
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Load audit logs
  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getAuditLogs({ limit: 500 });
      setAuditLogs(data);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load audit logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  // Set up real-time subscription for audit logs
  useEffect(() => {
    const channel = supabase
      .channel('audit-logs-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        (payload) => {
          console.log('New audit log:', payload);
          // Add new log to the beginning of the list
          setAuditLogs(prev => [payload.new as AuditLog, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter audit logs
  useEffect(() => {
    let filtered = auditLogs;

    // Search filter - search across action, target_type, and target_id
    if (searchQuery) {
      filtered = filtered.filter(
        (log) =>
          log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.target_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.target_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.admin_user_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.user_id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter((log) => log.action === actionFilter);
    }

    // Target type filter
    if (targetTypeFilter !== 'all') {
      filtered = filtered.filter((log) => log.target_type === targetTypeFilter);
    }

    setFilteredLogs(filtered);
  }, [auditLogs, searchQuery, actionFilter, targetTypeFilter]);

  const openDetailsDialog = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsDialogOpen(true);
  };

  const getActionBadge = (action: string) => {
    // Determine badge variant based on action type
    if (action.includes('created')) {
      return <Badge className="bg-green-100 text-green-800">Create</Badge>;
    } else if (action.includes('updated')) {
      return <Badge className="bg-blue-100 text-blue-800">Update</Badge>;
    } else if (action.includes('deleted') || action.includes('removed')) {
      return <Badge className="bg-red-100 text-red-800">Delete</Badge>;
    } else if (action.includes('suspended') || action.includes('cancelled')) {
      return <Badge className="bg-orange-100 text-orange-800">Suspend</Badge>;
    } else if (action.includes('activated')) {
      return <Badge className="bg-green-100 text-green-800">Activate</Badge>;
    } else {
      return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getTargetTypeBadge = (targetType?: string) => {
    if (!targetType) return <span className="text-muted-foreground">-</span>;
    
    const colors: Record<string, string> = {
      organization: 'bg-purple-100 text-purple-800',
      organization_member: 'bg-blue-100 text-blue-800',
      subscription: 'bg-amber-100 text-amber-800',
      user: 'bg-cyan-100 text-cyan-800',
    };

    return (
      <Badge className={colors[targetType] || 'bg-gray-100 text-gray-800'}>
        {targetType.replace('_', ' ')}
      </Badge>
    );
  };

  // Get unique actions for filter
  const uniqueActions = Array.from(new Set(auditLogs.map(log => log.action))).sort();
  
  // Get unique target types for filter
  const uniqueTargetTypes = Array.from(
    new Set(auditLogs.map(log => log.target_type).filter(Boolean))
  ).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-muted-foreground">
            Track all administrative actions and system events
          </p>
        </div>
        <Button onClick={loadAuditLogs} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={targetTypeFilter} onValueChange={setTargetTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by target type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Target Types</SelectItem>
                {uniqueTargetTypes.map((type) => (
                  <SelectItem key={type} value={type!}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No audit logs found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target Type</TableHead>
                  <TableHead>Target ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>{getTargetTypeBadge(log.target_type)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.target_id ? (
                        <span className="truncate block max-w-[150px]" title={log.target_id}>
                          {log.target_id.substring(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.admin_user_id || log.user_id ? (
                        <span className="truncate block max-w-[150px]" 
                          title={log.admin_user_id || log.user_id}>
                          {(log.admin_user_id || log.user_id)?.substring(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-muted-foreground">System</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDetailsDialog(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Complete information about this audit log entry
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
                  <p className="text-sm font-mono">
                    {new Date(selectedLog.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Action</p>
                  <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Target Type</p>
                  <div className="mt-1">{getTargetTypeBadge(selectedLog.target_type)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Target ID</p>
                  <p className="text-sm font-mono break-all">
                    {selectedLog.target_id || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Admin User ID</p>
                  <p className="text-sm font-mono break-all">
                    {selectedLog.admin_user_id || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User ID</p>
                  <p className="text-sm font-mono break-all">
                    {selectedLog.user_id || '-'}
                  </p>
                </div>
                {selectedLog.organization_id && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Organization ID</p>
                    <p className="text-sm font-mono break-all">
                      {selectedLog.organization_id}
                    </p>
                  </div>
                )}
                {selectedLog.ip_address && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">IP Address</p>
                    <p className="text-sm font-mono">
                      {selectedLog.ip_address}
                    </p>
                  </div>
                )}
              </div>
              
              {selectedLog.user_agent && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">User Agent</p>
                  <p className="text-sm font-mono bg-muted p-2 rounded break-all">
                    {selectedLog.user_agent}
                  </p>
                </div>
              )}

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Details</p>
                  <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-[300px]">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLogsPage;
