import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import TransactionsPage from "./pages/TransactionsPage";
import InventoryPage from "./pages/InventoryPage";
import InventoryViewPage from "./pages/InventoryViewPage";
import StockPage from "./pages/StockPage";
import ReportsPage from "./pages/ReportsPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import CashdeskPage from "./pages/CashDeskPage";
import ManagerOverviewPage from "./pages/ManagerOverviewPage";

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
                      path="/unauthorized"
                      element={<UnauthorizedPage />}
                    />
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <DashboardPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <DashboardPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/inventory"
                      element={
                        <ProtectedRoute>
                          <InventoryPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/inventory/view"
                      element={
                        <ProtectedRoute>
                          <InventoryViewPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/stock"
                      element={
                        <ProtectedRoute>
                          <StockPage />
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
                      path="/reports"
                      element={
                        <ProtectedRoute requiredPermission="reports_view">
                          <ReportsPage />
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
                        <ProtectedRoute requiredPermission="cash_desk_access">
                          <CashdeskPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/manager-overview"
                      element={
                        <ProtectedRoute requiredPermission="reports_view">
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
