
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";
import InventoryPage from "./pages/InventoryPage";
import InventoryViewPage from "./pages/InventoryViewPage";
import StockPage from "./pages/StockPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import CashDeskPage from "./pages/CashDeskPage";
import NotFoundPage from "./pages/NotFoundPage";
import { useAuth } from "@/contexts/AuthContext";

// Create a new QueryClient instance
const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const { user, loading } = useAuth();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Redirect to landing page if not authenticated
  if (!user) {
    return <Navigate to="/landing" replace />;
  }
  
  // Render the protected content
  return <>{element}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/" element={<ProtectedRoute element={<DashboardPage />} />} />
      <Route path="/dashboard" element={<ProtectedRoute element={<DashboardPage />} />} />
      <Route path="/transactions" element={<ProtectedRoute element={<TransactionsPage />} />} />
      <Route path="/inventory" element={<ProtectedRoute element={<InventoryPage />} />} />
      <Route path="/inventory/view" element={<ProtectedRoute element={<InventoryViewPage />} />} />
      <Route path="/stock" element={<ProtectedRoute element={<StockPage />} />} />
      <Route path="/reports" element={<ProtectedRoute element={<ReportsPage />} />} />
      <Route path="/settings" element={<ProtectedRoute element={<SettingsPage />} />} />
      <Route path="/cash-desk" element={<ProtectedRoute element={<CashDeskPage />} />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

const App = () => (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

export default App;
