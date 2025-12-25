
import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3Icon,
  BoxIcon,
  CreditCardIcon,
  SettingsIcon,
  ReceiptIcon,
  LineChartIcon,
  ShoppingCartIcon,
  PackageIcon,
  Users,
  TrendingUp,
  MessageSquare,
  Clock,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { usePermissions, Permission } from '@/hooks/usePermissions'; // Import Permission type
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Shield } from 'lucide-react';
import { 
  isWithinFreeTierTrial, 
  getTrialDaysRemaining,
  isTrialFeature 
} from '@/config/subscriptionPlans';

interface SidebarNavigationItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
  permission?: Permission; // Use the imported Permission type
  trialFeature?: string; // Feature name for trial badge
}

interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar = ({ isSidebarOpen, toggleSidebar }: SidebarProps) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { organization } = useOrganization();
  const { hasPermission, loading } = usePermissions();
  const { isAdmin } = useAdminAuth();

  // Calculate trial status
  const trialStatus = useMemo(() => {
    if (!organization || organization.subscription_tier !== 'free') {
      return { isInTrial: false, daysRemaining: 0 };
    }
    const isInTrial = isWithinFreeTierTrial(organization.created_at);
    const daysRemaining = getTrialDaysRemaining(organization.created_at);
    return { isInTrial, daysRemaining };
  }, [organization]);

  const isActive = (path: string) => {
    // Special case for dashboard/root path
    if (path === '/dashboard' && (location.pathname === '/' || location.pathname === '/dashboard')) {
      return true;
    }
    
    return location.pathname.startsWith(path);
  };

  const navigationItems: SidebarNavigationItem[] = useMemo(() => [
    {
      label: 'Dashboard',
      icon: <BarChart3Icon className="h-4 w-4" />,
      href: '/',
      active: isActive('/'),
      permission: 'dashboard_view'
    },
    {
      label: 'Transactions',
      icon: <ReceiptIcon className="h-4 w-4" />,
      href: '/transactions',
      active: isActive('/transactions'),
      permission: 'transactions_view'
    },
    {
      label: 'Cash Desk',
      icon: <ShoppingCartIcon className="h-4 w-4" />,
      href: '/cashdesk',
      active: isActive('/cashdesk'),
      permission: 'cash_desk_access'
    },
    {
      label: 'Manager Overview',
      icon: <Users className="h-4 w-4" />,
      href: '/manager-overview',
      active: isActive('/manager-overview'),
      permission: 'reports_view'
    },
    {
      label: 'Inventory',
      icon: <BoxIcon className="h-4 w-4" />,
      href: '/inventory',
      active: isActive('/inventory'),
      permission: 'inventory_view'
    },
    {
      label: 'Stock',
      icon: <PackageIcon className="h-4 w-4" />,
      href: '/stock',
      active: isActive('/stock'),
      permission: 'inventory_view'
    },
    {
      label: 'Reports',
      icon: <LineChartIcon className="h-4 w-4" />,
      href: '/reports',
      active: isActive('/reports'),
      permission: 'reports_view',
      trialFeature: 'advanced_reports'
    },
    {
      label: 'Stock Predictions',
      icon: <TrendingUp className="h-4 w-4" />,
      href: '/stock-predictions',
      active: isActive('/stock-predictions'),
      permission: 'reports_view',
      trialFeature: 'stock_predictions'
    },
    {
      label: 'Quist',
      icon: <MessageSquare className="h-4 w-4" />,
      href: '/quist',
      active: isActive('/quist'),
      permission: 'reports_view',
      trialFeature: 'quist'
    },
    {
      label: 'Team Members',
      icon: <Users className="h-4 w-4" />,
      href: '/team-members',
      active: isActive('/team-members'),
      permission: 'user_management'
    },
    {
      label: 'Settings',
      icon: <SettingsIcon className="h-4 w-4" />,
      href: '/settings',
      active: isActive('/settings'),
      permission: 'settings_view'
    },
  ], [location.pathname]);

  // Memoize visible items to prevent recalculation on every render
  const visibleItems = useMemo(() => {
    if (loading) return [];
    
    return navigationItems.filter(item => {
      // If no permission required, always show
      if (!item.permission) return true;
      
      // Show item if user has permission
      return hasPermission(item.permission); // Remove 'as any'
    });
  }, [navigationItems, hasPermission, loading]);

  if (loading) {
    return (
      <aside className={cn(
        'fixed inset-y-0 z-20 hidden h-full flex-col border-r bg-background transition-all sm:flex print:hidden',
        isSidebarOpen ? 'w-[240px]' : 'w-[70px]'
      )}>
        <div className="flex h-14 items-center border-b px-3">
          <CreditCardIcon className="h-6 w-6 text-primary" />
          {isSidebarOpen && (
            <span className="ml-2 font-semibold">Business Manager</span>
          )}
        </div>
        <div className="flex-1 p-4">
          <div className="animate-pulse space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded" />
            ))}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 z-20 hidden h-full flex-col border-r bg-background transition-all sm:flex print:hidden',
        isSidebarOpen ? 'w-[240px]' : 'w-[70px]'
      )}
    >
      <div className="flex h-14 items-center border-b px-3">
        <Link to="/" className="flex items-center">
          <CreditCardIcon className="h-6 w-6 text-primary" />
          {isSidebarOpen && (
            <span className="ml-2 font-semibold">Business Manager</span>
          )}
        </Link>
      </div>

      <ScrollArea className="flex-1 overflow-hidden">
        <nav className="flex flex-col gap-1 px-2 py-4">
          {visibleItems.map((item) => {
            // Check if this item has a trial feature and user is on free tier in trial
            const showTrialBadge = item.trialFeature && 
              organization?.subscription_tier === 'free' && 
              trialStatus.isInTrial &&
              isTrialFeature(item.trialFeature);
            
            // Check if trial expired for this feature
            const trialExpired = item.trialFeature && 
              organization?.subscription_tier === 'free' && 
              !trialStatus.isInTrial &&
              isTrialFeature(item.trialFeature);

            return (
              <Button
                key={item.href}
                variant={item.active ? 'default' : 'ghost'}
                asChild
                size={isSidebarOpen ? 'default' : 'icon'}
                className={cn(
                  'justify-start relative',
                  isSidebarOpen ? 'h-10 w-full px-4' : 'h-10 w-10',
                  trialExpired && 'opacity-60'
                )}
              >
                <Link to={item.href}>
                  {item.icon}
                  {isSidebarOpen && (
                    <span className="ml-2 flex items-center gap-2">
                      {item.label}
                      {showTrialBadge && (
                        <Badge 
                          variant="outline" 
                          className="text-[10px] px-1 py-0 h-4 bg-amber-50 text-amber-700 border-amber-200"
                        >
                          <Clock className="h-2.5 w-2.5 mr-0.5" />
                          Trial
                        </Badge>
                      )}
                      {trialExpired && (
                        <Badge 
                          variant="outline" 
                          className="text-[10px] px-1 py-0 h-4 bg-gray-50 text-gray-500 border-gray-200"
                        >
                          Pro
                        </Badge>
                      )}
                    </span>
                  )}
                </Link>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      {user && (
        <div className="border-t px-2 py-2 space-y-1">
          {isAdmin && (
            <Button
              variant="ghost"
              asChild
              className={cn(
                'h-10 justify-start',
                isSidebarOpen ? 'h-10 w-full px-4' : 'h-10 w-10'
              )}
            >
              <Link to="/admin">
                <Shield className="h-4 w-4" />
                {isSidebarOpen && <span className="ml-2">Admin Panel</span>}
              </Link>
            </Button>
          )}
          <Button
            variant="ghost"
            className={cn(
              'h-10 justify-start',
              isSidebarOpen ? 'h-10 w-full px-4' : 'h-10 w-10'
            )}
            onClick={() => signOut()}
          >
            <SettingsIcon className="h-4 w-4" />
            {isSidebarOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
