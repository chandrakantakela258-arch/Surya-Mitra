import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Building2, FileText, IndianRupee, CheckCircle, Clock, Sun } from "lucide-react";
import type { User, Customer } from "@shared/schema";

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<{
    totalBDPs: number;
    totalDDPs: number;
    totalCustomers: number;
    pendingPartners: number;
    completedInstallations: number;
    totalCommissions: number;
    pendingCommissions: number;
  }>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: recentPartners } = useQuery<User[]>({
    queryKey: ["/api/admin/partners/recent"],
  });

  const { data: recentCustomers } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers/recent"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
          <Sun className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Admin Dashboard</h1>
          <p className="text-muted-foreground">HarGharSolar Platform Overview</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total BDPs</CardTitle>
            <Building2 className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" data-testid="text-total-bdps">{stats?.totalBDPs || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Business Development Partners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total DDPs</CardTitle>
            <Users className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" data-testid="text-total-ddps">{stats?.totalDDPs || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">District Development Partners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
            <FileText className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" data-testid="text-total-customers">{stats?.totalCustomers || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Solar Applications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" data-testid="text-completed">{stats?.completedInstallations || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Installations Done</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Commissions</CardTitle>
            <IndianRupee className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600" data-testid="text-total-commissions">
              {formatINR(stats?.totalCommissions || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">All partner earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approvals</CardTitle>
            <Clock className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600" data-testid="text-pending-partners">
              {stats?.pendingPartners || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Partners awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Partners</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPartners && recentPartners.length > 0 ? (
              <div className="space-y-3">
                {recentPartners.slice(0, 5).map((partner) => (
                  <div key={partner.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">{partner.name}</p>
                      <p className="text-xs text-muted-foreground">{partner.role.toUpperCase()} - {partner.district}, {partner.state}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      partner.status === "approved" 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300"
                    }`}>
                      {partner.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No partners yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCustomers && recentCustomers.length > 0 ? (
              <div className="space-y-3">
                {recentCustomers.slice(0, 5).map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customer.proposedCapacity} kW - {customer.district}, {customer.state}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      customer.status === "completed" 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                    }`}>
                      {customer.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No customers yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
