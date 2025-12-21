import { useState, useEffect } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppSidebar } from "@/components/app-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationBell } from "@/components/notification-bell";
import { ChatbotAssistant } from "@/components/chatbot-assistant";
import { OnboardingTutorial } from "@/components/onboarding-tutorial";

import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import SubsidyCalculatorPage from "@/pages/subsidy-calculator";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import BDPDashboard from "@/pages/bdp/dashboard";
import BDPPartners from "@/pages/bdp/partners";
import PartnerDetail from "@/pages/bdp/partner-detail";
import PartnerForm from "@/pages/bdp/partner-form";
import BDPCustomers from "@/pages/bdp/customers";
import DDPDashboard from "@/pages/ddp/dashboard";
import DDPCustomers from "@/pages/ddp/customers";
import CustomerForm from "@/pages/ddp/customer-form";
import DDPApplications from "@/pages/ddp/applications";
import CustomerDetail from "@/pages/ddp/customer-detail";
import DDPEarnings from "@/pages/ddp/earnings";
import DDPStore from "@/pages/ddp/store";
import BDPWallet from "@/pages/bdp/wallet";
import CalculatorPage from "@/pages/calculator";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminPartners from "@/pages/admin/partners";
import AdminCustomers from "@/pages/admin/customers";
import AdminPayouts from "@/pages/admin/payouts";
import AdminProducts from "@/pages/admin/products";
import AdminOrders from "@/pages/admin/orders";
import AdminFeedback from "@/pages/admin/feedback";
import AdminNotificationSettings from "@/pages/admin/notifications-settings";
import AdminVendors from "@/pages/admin/vendors";
import AdminSiteExpenses from "@/pages/admin/site-expenses";
import AdminBankLoanSubmissions from "@/pages/admin/bank-loan-submissions";
import AdminBankLoanApprovals from "@/pages/admin/bank-loan-approvals";
import AdminLoanDisbursements from "@/pages/admin/loan-disbursements";
import AdminVendorPurchaseOrders from "@/pages/admin/vendor-purchase-orders";
import AdminGoodsDeliveries from "@/pages/admin/goods-deliveries";
import AdminSiteExecutionOrders from "@/pages/admin/site-execution-orders";
import AdminCompletionReports from "@/pages/admin/completion-reports";
import AdminCustomerFileSubmissions from "@/pages/admin/customer-file-submissions";
import AdminIndependentCustomers from "@/pages/admin/independent-customers";
import ProfilePage from "@/pages/profile";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import DisclaimerPage from "@/pages/disclaimer";
import TermsAndConditionsPage from "@/pages/terms-and-conditions";
import NotificationsPage from "@/pages/notifications";
import NewsPage from "@/pages/news";
import PanelComparisonPage from "@/pages/panel-comparison";
import LeaderboardPage from "@/pages/leaderboard";
import ReferralsPage from "@/pages/referrals";
import InstallationMap from "@/pages/installation-map";
import NetworkMap from "@/pages/network-map";
import VendorRegistration from "@/pages/vendor-registration";
import CustomerRegistration from "@/pages/customer-registration";
import CustomerPartnerDashboard from "@/pages/customer-partner/dashboard";
import CustomerPartnerReferrals from "@/pages/customer-partner/referrals";
import CustomerPartnerEarnings from "@/pages/customer-partner/earnings";
import CustomerPartnerProfile from "@/pages/customer-partner/profile";
import CustomerPartnerRegisterPage from "@/pages/customer-partner-register";
import ForgotPasswordPage from "@/pages/forgot-password";
import { MobileNav } from "@/components/mobile-nav";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-4 w-full max-w-md p-8">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-1/2" />
      </div>
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      setShouldRedirect("/login");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      if (user.role === "admin") {
        setShouldRedirect("/admin/dashboard");
      } else if (user.role === "bdp") {
        setShouldRedirect("/bdp/dashboard");
      } else if (user.role === "customer_partner") {
        setShouldRedirect("/customer-partner/dashboard");
      } else {
        setShouldRedirect("/ddp/dashboard");
      }
    }
  }, [user, isLoading, allowedRoles]);

  useEffect(() => {
    if (shouldRedirect) {
      setLocation(shouldRedirect);
    }
  }, [shouldRedirect, setLocation]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "3.5rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 p-4 border-b sticky top-0 bg-background z-50">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <NotificationBell />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
            {children}
          </main>
        </div>
        <MobileNav />
        <PWAInstallPrompt />
        {user && (user.role === "bdp" || user.role === "ddp") && (
          <OnboardingTutorial userRole={user.role} />
        )}
      </div>
    </SidebarProvider>
  );
}

function AuthenticatedRoutes() {
  return (
    <Switch>
      {/* Admin Routes */}
      <Route path="/admin/dashboard">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/partners">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminPartners />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/customers">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminCustomers />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/payouts">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminPayouts />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/products">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminProducts />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/orders">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminOrders />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/feedback">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminFeedback />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/notifications">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminNotificationSettings />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/vendors">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminVendors />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/site-expenses">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminSiteExpenses />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/bank-loan-submissions">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminBankLoanSubmissions />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/bank-loan-approvals">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminBankLoanApprovals />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/loan-disbursements">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminLoanDisbursements />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/vendor-purchase-orders">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminVendorPurchaseOrders />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/goods-deliveries">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminGoodsDeliveries />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/site-execution-orders">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminSiteExecutionOrders />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/completion-reports">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminCompletionReports />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/customer-file-submissions">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminCustomerFileSubmissions />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/independent-customers">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout>
            <AdminIndependentCustomers />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      {/* BDP Routes */}
      <Route path="/bdp/dashboard">
        <ProtectedRoute allowedRoles={["bdp", "admin"]}>
          <DashboardLayout>
            <BDPDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/bdp/partners/new">
        <ProtectedRoute allowedRoles={["bdp", "admin"]}>
          <DashboardLayout>
            <PartnerForm />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/bdp/partners/:id">
        <ProtectedRoute allowedRoles={["bdp", "admin"]}>
          <DashboardLayout>
            <PartnerDetail />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/bdp/partners">
        <ProtectedRoute allowedRoles={["bdp", "admin"]}>
          <DashboardLayout>
            <BDPPartners />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/bdp/customers">
        <ProtectedRoute allowedRoles={["bdp", "admin"]}>
          <DashboardLayout>
            <BDPCustomers />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/bdp/wallet">
        <ProtectedRoute allowedRoles={["bdp", "admin"]}>
          <DashboardLayout>
            <BDPWallet />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/bdp/store">
        <ProtectedRoute allowedRoles={["bdp", "admin"]}>
          <DashboardLayout>
            <DDPStore />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      {/* DDP Routes */}
      <Route path="/ddp/dashboard">
        <ProtectedRoute allowedRoles={["ddp", "admin"]}>
          <DashboardLayout>
            <DDPDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/ddp/customers/new">
        <ProtectedRoute allowedRoles={["ddp", "admin"]}>
          <DashboardLayout>
            <CustomerForm />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/ddp/customers/:id">
        <ProtectedRoute allowedRoles={["ddp", "admin"]}>
          <DashboardLayout>
            <CustomerDetail />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/ddp/customers">
        <ProtectedRoute allowedRoles={["ddp", "admin"]}>
          <DashboardLayout>
            <DDPCustomers />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/ddp/applications">
        <ProtectedRoute allowedRoles={["ddp", "admin"]}>
          <DashboardLayout>
            <DDPApplications />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/ddp/earnings">
        <ProtectedRoute allowedRoles={["ddp", "admin"]}>
          <DashboardLayout>
            <DDPEarnings />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/ddp/store">
        <ProtectedRoute allowedRoles={["ddp", "admin"]}>
          <DashboardLayout>
            <DDPStore />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      {/* Customer Partner Routes */}
      <Route path="/customer-partner/dashboard">
        <ProtectedRoute allowedRoles={["customer_partner"]}>
          <DashboardLayout>
            <CustomerPartnerDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/customer-partner/referrals">
        <ProtectedRoute allowedRoles={["customer_partner"]}>
          <DashboardLayout>
            <CustomerPartnerReferrals />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/customer-partner/earnings">
        <ProtectedRoute allowedRoles={["customer_partner"]}>
          <DashboardLayout>
            <CustomerPartnerEarnings />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/customer-partner/profile">
        <ProtectedRoute allowedRoles={["customer_partner"]}>
          <DashboardLayout>
            <CustomerPartnerProfile />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      {/* Shared Routes */}
      <Route path="/calculator">
        <ProtectedRoute>
          <DashboardLayout>
            <CalculatorPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute allowedRoles={["bdp", "ddp"]}>
          <DashboardLayout>
            <ProfilePage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/notifications">
        <ProtectedRoute allowedRoles={["bdp", "ddp", "admin"]}>
          <DashboardLayout>
            <NotificationsPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function PublicRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Switch>
      {/* Public pages - accessible without login */}
      <Route path="/">
        <LandingPage />
      </Route>
      <Route path="/subsidy-calculator">
        <SubsidyCalculatorPage />
      </Route>
      <Route path="/privacy-policy">
        <PrivacyPolicyPage />
      </Route>
      <Route path="/disclaimer">
        <DisclaimerPage />
      </Route>
      <Route path="/terms-and-conditions">
        <TermsAndConditionsPage />
      </Route>
      <Route path="/news">
        <NewsPage />
      </Route>
      <Route path="/panels">
        <PanelComparisonPage />
      </Route>
      <Route path="/leaderboard">
        <LeaderboardPage />
      </Route>
      <Route path="/installations">
        <InstallationMap />
      </Route>
      <Route path="/network-map">
        <NetworkMap />
      </Route>
      <Route path="/map">
        <NetworkMap />
      </Route>
      <Route path="/vendor-registration">
        <VendorRegistration />
      </Route>
      <Route path="/customer-registration">
        <CustomerRegistration />
      </Route>
      <Route path="/register-solar">
        <CustomerRegistration />
      </Route>
      <Route path="/customer-partner-register">
        <Redirect to="/register" />
      </Route>
      <Route path="/login">
        {user ? (
          <Redirect to={
            user.role === "admin" ? "/admin/dashboard" : 
            user.role === "bdp" ? "/bdp/dashboard" : 
            user.role === "customer_partner" ? "/customer-partner/dashboard" :
            "/ddp/dashboard"
          } />
        ) : (
          <LoginPage />
        )}
      </Route>
      <Route path="/forgot-password">
        {user ? (
          <Redirect to={
            user.role === "admin" ? "/admin/dashboard" : 
            user.role === "bdp" ? "/bdp/dashboard" : 
            user.role === "customer_partner" ? "/customer-partner/dashboard" :
            "/ddp/dashboard"
          } />
        ) : (
          <ForgotPasswordPage />
        )}
      </Route>
      <Route path="/register">
        {user ? (
          <Redirect to={
            user.role === "admin" ? "/admin/dashboard" : 
            user.role === "bdp" ? "/bdp/dashboard" : 
            user.role === "customer_partner" ? "/customer-partner/dashboard" :
            "/ddp/dashboard"
          } />
        ) : (
          <RegisterPage />
        )}
      </Route>
      <Route>
        <AuthenticatedRoutes />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <PublicRouter />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
