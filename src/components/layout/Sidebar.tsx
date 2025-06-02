
import React from 'react';
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
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

interface SidebarNavigationItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
  permission?: string;
}

interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar = ({ isSidebarOpen, toggleSidebar }: SidebarProps) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { hasPermission, loading } = usePermissions();

  const isActive = (path: string) => {
    // Special case for dashboard/root path
    if (path === '/dashboard' && (location.pathname === '/' || location.pathname === '/dashboard')) {
      return true;
    }
    
    return location.pathname.startsWith(path);
  };

  const navigationItems: SidebarNavigationItem[] = [
    {
      label: 'Dashboard',
      icon: <BarChart3Icon className="h-4 w-4" />,
      href: '/dashboard',
      active: isActive('/dashboard'),
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
      href: '/cash-desk',
      active: isActive('/cash-desk'),
      permission: 'cash_desk_access'
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
      permission: 'reports_view'
    },
    {
      label: 'Settings',
      icon: <SettingsIcon className="h-4 w-4" />,
      href: '/settings',
      active: isActive('/settings'),
      permission: 'settings_view'
    },
  ];

  // Filter items based on permissions - show all items when loading or when user has permission
  const visibleItems = navigationItems.filter(item => {
    // If no permission required, always show
    if (!item.permission) return true;
    
    // If still loading permissions, show all items (will be filtered once loaded)
    if (loading) return true;
    
    // Check if user has the required permission
    return hasPermission(item.permission as any);
  });

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
          {visibleItems.map((item) => (
            <Button
              key={item.href}
              variant={item.active ? 'default' : 'ghost'}
              asChild
              size={isSidebarOpen ? 'default' : 'icon'}
              className={cn(
                'justify-start',
                isSidebarOpen ? 'h-10 w-full px-4' : 'h-10 w-10'
              )}
            >
              <Link to={item.href}>
                {item.icon}
                {isSidebarOpen && <span className="ml-2">{item.label}</span>}
              </Link>
            </Button>
          ))}
        </nav>
      </ScrollArea>

      {user && (
        <div className="h-14 border-t px-2 py-2">
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
