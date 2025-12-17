/**
 * Admin Dashboard Layout
 * 
 * Main layout for admin sections with navigation and route protection
 * Requirements: 1.1, 1.2
 */

import React from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Building2, 
  BarChart3, 
  FileText,
  Menu,
  X,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminDashboard = () => {
  const { isAdmin, loading } = useAdminAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  const navItems = [
    {
      title: 'Overview',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      title: 'Organizations',
      href: '/admin/organizations',
      icon: Building2,
    },
    {
      title: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
    },
    {
      title: 'Audit Logs',
      href: '/admin/audit-logs',
      icon: FileText,
    },
    {
      title: 'Admin Users',
      href: '/admin/admins',
      icon: Shield,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen transition-transform bg-card border-r',
          sidebarOpen ? 'w-64' : 'w-0 -translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b px-6">
            <h2 className="text-lg font-semibold">Admin Panel</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to Application
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          'transition-all duration-200',
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-0'
        )}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">
              {navItems.find((item) => item.href === location.pathname)?.title || 'Admin Dashboard'}
            </h1>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
