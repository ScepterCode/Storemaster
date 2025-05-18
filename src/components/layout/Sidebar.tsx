
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Receipt, 
  Tag, 
  Calendar,
  Settings,
  Menu,
  X
} from 'lucide-react';

interface NavItemProps {
  icon: React.ElementType;
  title: string;
  to: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem = ({ icon: Icon, title, to, isActive, onClick }: NavItemProps) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
        isActive 
          ? "bg-sidebar-accent text-sidebar-accent-foreground" 
          : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{title}</span>
    </Link>
  );
};

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activePath, setActivePath] = useState(window.location.pathname);

  const navItems = [
    { icon: Home, title: 'Dashboard', to: '/' },
    { icon: Receipt, title: 'Transactions', to: '/transactions' },
    { icon: Tag, title: 'Inventory', to: '/inventory' },
    { icon: Calendar, title: 'Reports', to: '/reports' },
    { icon: Settings, title: 'Settings', to: '/settings' },
  ];

  const handleNavClick = (path: string) => {
    setActivePath(path);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-40 md:hidden bg-background/80 backdrop-blur-sm"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={cn(
          "fixed top-0 left-0 h-full bg-sidebar w-64 shadow-lg transition-transform z-30",
          "transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4">
            <h1 className="text-2xl font-bold text-sidebar-foreground">Aba Cash Ledger</h1>
            <p className="text-sm text-sidebar-foreground/70">Business Finance Made Simple</p>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map((item) => (
              <NavItem 
                key={item.to}
                icon={item.icon}
                title={item.title}
                to={item.to}
                isActive={activePath === item.to}
                onClick={() => handleNavClick(item.to)}
              />
            ))}
          </nav>

          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground">
                AB
              </div>
              <div>
                <p className="text-sm font-medium text-sidebar-foreground">Aba Business</p>
                <p className="text-xs text-sidebar-foreground/70">Free Account</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content spacer for fixed sidebar */}
      <div className="md:ml-64" />
    </>
  );
};

export default Sidebar;
