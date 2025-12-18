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

import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import BDPDashboard from "@/pages/bdp/dashboard";
import BDPPartners from "@/pages/bdp/partners";
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

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their proper dashboard
    if (user.role === "admin") {
      setLocation("/admin/dashboard");
    } else if (user.role === "bdp") {
      setLocation("/bdp/dashboard");
    } else {
      setLocation("/ddp/dashboard");
    }
    return null;
  }

  return <>{children}</>;
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
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
            <ThemeToggle />
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
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

      {/* Shared Routes */}
      <Route path="/calculator">
        <ProtectedRoute>
          <DashboardLayout>
            <CalculatorPage />
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
      <Route path="/login">
        {user ? (
          <Redirect to={user.role === "admin" ? "/admin/dashboard" : user.role === "bdp" ? "/bdp/dashboard" : "/ddp/dashboard"} />
        ) : (
          <LoginPage />
        )}
      </Route>
      <Route path="/register">
        {user ? (
          <Redirect to={user.role === "admin" ? "/admin/dashboard" : user.role === "bdp" ? "/bdp/dashboard" : "/ddp/dashboard"} />
        ) : (
          <RegisterPage />
        )}
      </Route>
      <Route path="/">
        {user ? (
          <Redirect to={user.role === "admin" ? "/admin/dashboard" : user.role === "bdp" ? "/bdp/dashboard" : "/ddp/dashboard"} />
        ) : (
          <Redirect to="/login" />
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
