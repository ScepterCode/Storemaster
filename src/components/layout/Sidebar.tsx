
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3Icon,
  BoxIcon,
  CreditCardIcon,
  SettingsIcon,
  ReceiptIcon,
  LineChartIcon,
  ShoppingCartIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarNavigationItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
}

const Sidebar = () => {
  const location = useLocation();
  const { collapsed } = useSidebarContext();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

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
    },
    {
      label: 'Transactions',
      icon: <ReceiptIcon className="h-4 w-4" />,
      href: '/transactions',
      active: isActive('/transactions'),
    },
    {
      label: 'Cash Desk',
      icon: <ShoppingCartIcon className="h-4 w-4" />,
      href: '/cash-desk',
      active: isActive('/cash-desk'),
    },
    {
      label: 'Inventory',
      icon: <BoxIcon className="h-4 w-4" />,
      href: '/inventory',
      active: isActive('/inventory'),
    },
    {
      label: 'Reports',
      icon: <LineChartIcon className="h-4 w-4" />,
      href: '/reports',
      active: isActive('/reports'),
    },
    {
      label: 'Settings',
      icon: <SettingsIcon className="h-4 w-4" />,
      href: '/settings',
      active: isActive('/settings'),
    },
  ];

  return (
    <aside
      className={cn(
        'fixed inset-y-0 z-20 hidden h-full flex-col border-r bg-background transition-all sm:flex print:hidden',
        collapsed ? 'w-[70px]' : 'w-[240px]'
      )}
    >
      <div className="flex h-14 items-center border-b px-3">
        <Link to="/" className="flex items-center">
          <CreditCardIcon className="h-6 w-6 text-primary" />
          {!collapsed && (
            <span className="ml-2 font-semibold">Business Manager</span>
          )}
        </Link>
      </div>

      <ScrollArea className="flex-1 overflow-hidden">
        <nav className="flex flex-col gap-1 px-2 py-4">
          {navigationItems.map((item) => (
            <Button
              key={item.href}
              variant={item.active ? 'default' : 'ghost'}
              asChild
              size={collapsed ? 'icon' : 'default'}
              className={cn(
                'justify-start',
                collapsed ? 'h-10 w-10' : 'h-10 w-full px-4'
              )}
            >
              <Link to={item.href}>
                {item.icon}
                {!collapsed && <span className="ml-2">{item.label}</span>}
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
              collapsed ? 'h-10 w-10' : 'h-10 w-full px-4'
            )}
            onClick={() => signOut()}
          >
            <SettingsIcon className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
