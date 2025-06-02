
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

// Pages
import LandingPage from '@/pages/LandingPage';
import DashboardPage from '@/pages/DashboardPage';
import TransactionsPage from '@/pages/TransactionsPage';
import InventoryPage from '@/pages/InventoryPage';
import InventoryViewPage from '@/pages/InventoryViewPage';
import ReportsPage from '@/pages/ReportsPage';
import SettingsPage from '@/pages/SettingsPage';
import StockPage from '@/pages/StockPage';
import CashDeskPage from '@/pages/CashDeskPage';
import NotFoundPage from '@/pages/NotFoundPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import LoginPage from '@/pages/LoginPage';

// Components
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="theme">
      <AuthProvider>
        <NotificationProvider>
          <SidebarProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute requiredPermission="dashboard_view">
                    <DashboardPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/transactions" element={
                  <ProtectedRoute requiredPermission="transactions_view">
                    <TransactionsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/cash-desk" element={
                  <ProtectedRoute requiredPermission="cash_desk_access">
                    <CashDeskPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/inventory" element={
                  <ProtectedRoute requiredPermission="inventory_view">
                    <InventoryPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/inventory/:id" element={
                  <ProtectedRoute requiredPermission="inventory_view">
                    <InventoryViewPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/stock" element={
                  <ProtectedRoute requiredPermission="inventory_view">
                    <StockPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/reports" element={
                  <ProtectedRoute requiredPermission="reports_view">
                    <ReportsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute requiredPermission="settings_view">
                    <SettingsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              <Toaster />
            </BrowserRouter>
          </SidebarProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
