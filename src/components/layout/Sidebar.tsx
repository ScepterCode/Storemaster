
import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  Receipt,
  Package,
  BarChartBig,
  Settings,
  XCircle,
  Box,
} from 'lucide-react';

interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, toggleSidebar }) => {
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Transactions', href: '/transactions', icon: <Receipt size={20} /> },
    { name: 'Inventory', href: '/inventory', icon: <Package size={20} /> },
    { name: 'Stock', href: '/stock', icon: <Box size={20} /> },
    { name: 'Reports', href: '/reports', icon: <BarChartBig size={20} /> },
    { name: 'Settings', href: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r bg-background transition-all duration-300',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        <h2 className="text-lg font-semibold">StoreMaster</h2>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
          <XCircle size={20} />
        </Button>
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="px-2 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )
              }
              end
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          StoreMaster v1.0
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
