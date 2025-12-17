import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { OrganizationProvider } from "./contexts/OrganizationContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SyncProvider } from "./contexts/SyncContext";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import LandingPage from "./pages/LandingPage";
import TransactionsPage from "./pages/TransactionsPage";
import InventoryPage from "./pages/InventoryPage";
import InventoryViewPage from "./pages/InventoryViewPage";
import StockPage from "./pages/StockPage";
import ReportsPage from "./pages/ReportsPage";
import StockPredictionsPage from "./pages/StockPredictionsPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import SubscriptionGuard from "./components/auth/SubscriptionGuard";
import CashdeskPage from "./pages/CashDeskPage";
import ManagerOverviewPage from "./pages/ManagerOverviewPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOverview from "./pages/admin/AdminOverview";
import OrganizationsPage from "./pages/admin/OrganizationsPage";
import OrganizationDetailsPage from "./pages/admin/OrganizationDetailsPage";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import AuditLogsPage from "./pages/admin/AuditLogsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import SubscriptionPlansPage from "./pages/SubscriptionPlansPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import PaymentCallbackPage from "./pages/PaymentCallbackPage";
import SubscriptionExpiredPage from "./pages/SubscriptionExpiredPage";
import OrganizationSetup from "./pages/onboarding/OrganizationSetup";
import SelectPlan from "./pages/onboarding/SelectPlan";
import Welcome from "./pages/onboarding/Welcome";
import TeamMembersPage from "./pages/TeamMembersPage";
import AcceptInvitationPage from "./pages/AcceptInvitationPage";
import { runMigrations } from "./lib/dataMigration";
import { needsMultiTenantMigration, runMultiTenantMigration } from "./lib/multiTenantMigration";

const queryClient = new QueryClient();

function App() {
  // Run data migrations on app initialization
  useEffect(() => {
    try {
      const migrationReport = runMigrations();
      
      if (migrationReport.totalItemsMigrated > 0) {
        console.log(`✅ Data migration completed: ${migrationReport.totalItemsMigrated} items migrated`);
        
        // Log details for each entity type
        migrationReport.results.forEach(result => {
          if (result.itemsMigrated > 0) {
            console.log(`  - ${result.entityType}: ${result.itemsMigrated} items`);
          }
          if (!result.success && result.error) {
            console.error(`  ❌ ${result.entityType} migration failed: ${result.error}`);
          }
        });
      }
      
      if (!migrationReport.allSuccessful) {
        console.warn('⚠️ Some migrations failed. Check console for details.');
      }
    } catch (error) {
      console.error('Error running migrations:', error);
    }
  }, []);

  // Run multi-tenant migration on app initialization
  useEffect(() => {
    const checkAndRunMultiTenantMigration = async () => {
      try {
        const needsMigration = await needsMultiTenantMigration();
        
        if (needsMigration) {
          console.log('🔄 Starting multi-tenant migration...');
          const result = await runMultiTenantMigration();
          
          if (result.success) {
            console.log('✅ Multi-tenant migration completed successfully');
            console.log(`  - Organization ID: ${result.organizationId}`);
            console.log(`  - Products migrated: ${result.details.productsUpdated}`);
            console.log(`  - Categories migrated: ${result.details.categoriesUpdated}`);
            console.log(`  - Customers migrated: ${result.details.customersUpdated}`);
            console.log(`  - Invoices migrated: ${result.details.invoicesUpdated}`);
            console.log(`  - Transactions migrated: ${result.details.transactionsUpdated}`);
            
            // Reload the page to apply the new organization context
            window.location.reload();
          } else {
            console.error('❌ Multi-tenant migration failed:', result.error);
          }
        }
      } catch (error) {
        console.error('Error checking/running multi-tenant migration:', error);
      }
    };

    // Run migration check after a short delay to ensure auth is ready
    const timer = setTimeout(() => {
      checkAndRunMultiTenantMigration();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrganizationProvider>
          <SyncProvider>
            <NotificationProvider>
              <SidebarProvider>
                <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
                  <div className="min-h-screen bg-background">
                    <Router>
                        <Routes>
                    {/* Public Routes - No Auth Required */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route
                      path="/unauthorized"
                      element={<UnauthorizedPage />}
                    />
                    <Route
                      path="/subscription/callback"
                      element={<PaymentCallbackPage />}
                    />
                    <Route
                      path="/invitation/accept"
                      element={<AcceptInvitationPage />}
                    />

                    {/* Protected Routes - Wrapped in SubscriptionGuard */}
                    <Route path="/*" element={
                      <SubscriptionGuard>
                        <Routes>

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
                      path="/stock-predictions"
                      element={
                        <ProtectedRoute>
                          <StockPredictionsPage />
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

                    {/* Admin Routes */}
                    <Route path="/admin" element={<AdminDashboard />}>
                      <Route index element={<AdminOverview />} />
                      <Route path="organizations" element={<OrganizationsPage />} />
                      <Route path="organizations/:id" element={<OrganizationDetailsPage />} />
                      <Route path="analytics" element={<AnalyticsPage />} />
                      <Route path="audit-logs" element={<AuditLogsPage />} />
                      <Route path="admins" element={<AdminUsersPage />} />
                    </Route>

                    {/* Onboarding Routes */}
                    <Route
                      path="/onboarding/setup"
                      element={
                        <ProtectedRoute skipOrganizationCheck>
                          <OrganizationSetup />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/onboarding/select-plan"
                      element={
                        <ProtectedRoute skipOrganizationCheck>
                          <SelectPlan />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/onboarding/welcome"
                      element={
                        <ProtectedRoute skipOrganizationCheck>
                          <Welcome />
                        </ProtectedRoute>
                      }
                    />

                    {/* Subscription Routes */}
                    <Route
                      path="/subscription/plans"
                      element={
                        <ProtectedRoute>
                          <SubscriptionPlansPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/subscription"
                      element={
                        <ProtectedRoute>
                          <SubscriptionPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/subscription/expired"
                      element={
                        <ProtectedRoute>
                          <SubscriptionExpiredPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Team Management Routes */}
                    <Route
                      path="/team"
                      element={
                        <ProtectedRoute>
                          <TeamMembersPage />
                        </ProtectedRoute>
                      }
                    />
                        </Routes>
                      </SubscriptionGuard>
                    } />
                        </Routes>
                    </Router>
                  </div>
                </ThemeProvider>
              </SidebarProvider>
            </NotificationProvider>
          </SyncProvider>
        </OrganizationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
