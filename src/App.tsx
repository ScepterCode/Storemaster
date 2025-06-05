import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient } from 'react-query';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { ThemeProvider } from './components/ui/theme-provider';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CustomersPage from './pages/CustomersPage';
import InvoicesPage from './pages/InvoicesPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedRoute from './components/ProtectedRoute';
import CashdeskPage from './pages/CashDeskPage';
import ManagerOverviewPage from './pages/ManagerOverviewPage';

function App() {
  return (
    <QueryClient>
      <AuthProvider>
        <NotificationProvider>
          <SidebarProvider>
            <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
              <div className="min-h-screen bg-background">
                <Router>
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route 
                      path="/" 
                      element={
                        <ProtectedRoute>
                          <DashboardPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/products" 
                      element={
                        <ProtectedRoute>
                          <ProductsPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/customers" 
                      element={
                        <ProtectedRoute>
                          <CustomersPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/invoices" 
                      element={
                        <ProtectedRoute>
                          <InvoicesPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/settings" 
                      element={
                        <ProtectedRoute>
                          <SettingsPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/cashdesk" 
                      element={
                        <ProtectedRoute>
                          <CashdeskPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/manager-overview" 
                      element={
                        <ProtectedRoute>
                          <ManagerOverviewPage />
                        </ProtectedRoute>
                      } 
                    />
                  </Routes>
                </Router>
              </div>
            </ThemeProvider>
          </SidebarProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClient>
  );
}

export default App;
