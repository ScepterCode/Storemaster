
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { ThemeProvider } from './contexts/ThemeContext';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import TransactionsPage from './pages/TransactionsPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import CashdeskPage from './pages/CashDeskPage';
import ManagerOverviewPage from './pages/ManagerOverviewPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <SidebarProvider>
            <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
              <div className="min-h-screen bg-background">
                <Router>
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route 
                      path="/" 
                      element={
                        <ProtectedRoute>
                          <DashboardPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/transactions" 
                      element={
                        <ProtectedRoute>
                          <TransactionsPage />
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
    </QueryClientProvider>
  );
}

export default App;
