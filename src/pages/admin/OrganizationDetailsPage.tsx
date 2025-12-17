/**
 * Organization Details Page
 * 
 * Display detailed information about a specific organization
 * Requirements: 1.2, 2.2, 7.1, 7.3
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '@/services/adminService';
import { Organization, OrganizationMember, Subscription } from '@/types/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  CreditCard, 
  BarChart3,
  Loader2,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { formatNaira } from '@/lib/formatter';

const OrganizationDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadOrganizationDetails();
    }
  }, [id]);

  const loadOrganizationDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      
      // Load organization details
      const orgData = await adminService.getOrganization(id);
      setOrganization(orgData);

      // Load members
      const membersData = await adminService.getOrganizationMembers(id);
      setMembers(membersData);

      // Load subscription
      const subData = await adminService.getOrganizationSubscription(id);
      setSubscription(subData);

      // Load stats
      const statsData = await adminService.getOrganizationStats(id);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading organization details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load organization details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/admin/organizations')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Organizations
        </Button>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Organization not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      trial: 'secondary',
      suspended: 'destructive',
      cancelled: 'outline',
      expired: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      owner: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      member: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={colors[role] || ''}>
        {role}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/organizations')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{organization.name}</h2>
            <p className="text-muted-foreground">Organization Details</p>
          </div>
        </div>
        {getStatusBadge(organization.subscription_status)}
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">
              of {organization.max_users} max
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_products || 0}</div>
            <p className="text-xs text-muted-foreground">
              of {organization.max_products === -1 ? '∞' : organization.max_products} max
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoices</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_invoices || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.storage_used_mb || 0} MB</div>
            <p className="text-xs text-muted-foreground">
              of {organization.max_storage_mb} MB
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="usage">Usage Metrics</TabsTrigger>
        </TabsList>

        {/* Information Tab */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-lg">{organization.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Slug</p>
                  <p className="text-lg">{organization.slug}</p>
                </div>
                {organization.email && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-lg flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {organization.email}
                    </p>
                  </div>
                )}
                {organization.phone && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p className="text-lg flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {organization.phone}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-lg flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(organization.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-lg">
                    {organization.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plan Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Max Users</p>
                  <p className="text-lg">{organization.max_users}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Max Products</p>
                  <p className="text-lg">{organization.max_products}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Max Invoices/Month
                  </p>
                  <p className="text-lg">{organization.max_invoices_per_month}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Max Storage</p>
                  <p className="text-lg">{organization.max_storage_mb} MB</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Team Members ({members.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No members found
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-mono text-sm">
                          {member.user_id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>{getRoleBadge(member.role)}</TableCell>
                        <TableCell>
                          <Badge variant={member.is_active ? 'default' : 'secondary'}>
                            {member.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(member.joined_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Plan</p>
                      <p className="text-lg font-semibold">{subscription.plan_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Amount</p>
                      <p className="text-lg font-semibold">
                        {formatNaira(subscription.amount)}/{subscription.interval}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <p className="text-lg">
                        <Badge
                          variant={
                            subscription.status === 'active' ? 'default' : 'secondary'
                          }
                        >
                          {subscription.status}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Current Period
                      </p>
                      <p className="text-sm">
                        {subscription.current_period_start &&
                          new Date(subscription.current_period_start).toLocaleDateString()}{' '}
                        -{' '}
                        {subscription.current_period_end &&
                          new Date(subscription.current_period_end).toLocaleDateString()}
                      </p>
                    </div>
                    {subscription.next_payment_date && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Next Payment
                        </p>
                        <p className="text-lg">
                          {new Date(subscription.next_payment_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {subscription.flutterwave_subscription_id && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Flutterwave ID
                        </p>
                        <p className="text-sm font-mono">
                          {subscription.flutterwave_subscription_id}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No active subscription
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Metrics Tab */}
        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Usage Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Products
                    </p>
                    <p className="text-2xl font-bold">{stats?.total_products || 0}</p>
                    <p className="text-xs text-muted-foreground">
                      {organization.max_products === -1 
                        ? 'Unlimited' 
                        : `${organization.max_products - (stats?.total_products || 0)} remaining`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Invoices
                    </p>
                    <p className="text-2xl font-bold">{stats?.total_invoices || 0}</p>
                    <p className="text-xs text-muted-foreground">
                      {organization.max_invoices_per_month === -1 
                        ? 'Unlimited' 
                        : `${organization.max_invoices_per_month - (stats?.total_invoices || 0)} remaining this month`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Revenue
                    </p>
                    <p className="text-2xl font-bold">{formatNaira(stats?.total_revenue || 0)}</p>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Storage Used
                    </p>
                    <p className="text-2xl font-bold">{stats?.storage_used_mb || 0} MB</p>
                    <p className="text-xs text-muted-foreground">
                      {organization.max_storage_mb - (stats?.storage_used_mb || 0)} MB remaining
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrganizationDetailsPage;
