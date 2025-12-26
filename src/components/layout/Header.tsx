
import React from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useMobile } from '@/hooks/use-mobile';
import NotificationDropdown from '@/components/ui/notification-dropdown';

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const { isMobile } = useMobile();
  const { user, signOut } = useAuth();
  const { organization } = useOrganization();
  
  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'U';
  const displayName = organization?.name || 'StoreMaster';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2">
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
        {!isMobile && <h1 className="text-xl font-semibold">{displayName}</h1>}
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        
        <NotificationDropdown />
        
        <div className="flex items-center gap-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="sm" onClick={() => signOut()}>Sign Out</Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
