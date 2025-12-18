import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Users, FileText, TrendingUp, CheckCircle, Plus, ArrowRight, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { DashboardSkeleton, TableSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import { PartnerOfMonthCard } from "@/components/partner-of-month";
import { DashboardCustomizer, useDashboardWidgets } from "@/components/dashboard-widgets";
import type { Customer } from "@shared/schema";

interface DDPStats {
  totalCustomers: number;
  pendingApplications: number;
  approvedApplications: number;
  completedInstallations: number;
}

export default function DDPDashboard() {
  const { widgets, setWidgets, isWidgetVisible } = useDashboardWidgets("ddp");

  const { data: stats, isLoading: statsLoading } = useQuery<DDPStats>({
    queryKey: ["/api/ddp/stats"],
  });

  const { data: recentCustomers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/ddp/customers", "recent"],
  });

  if (statsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">Dashboard</h1>
          <p className="text-muted-foreground">Manage your customer registrations for PM Surya Ghar Yojana</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DashboardCustomizer role="ddp" widgets={widgets} onWidgetsChange={setWidgets} />
          <Button asChild data-testid="button-add-customer">
            <Link href="/ddp/customers/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Link>
          </Button>
        </div>
      </div>

      {/* Partner of the Month */}
      {isWidgetVisible("partner-of-month") && <PartnerOfMonthCard />}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          icon={Users}
          trend={{ value: 18, isPositive: true }}
        />
        <StatCard
          title="Pending Applications"
          value={stats?.pendingApplications || 0}
          icon={Clock}
        />
        <StatCard
          title="Approved"
          value={stats?.approvedApplications || 0}
          icon={TrendingUp}
          trend={{ value: 32, isPositive: true }}
        />
        <StatCard
          title="Installations Done"
          value={stats?.completedInstallations || 0}
          icon={CheckCircle}
          trend={{ value: 20, isPositive: true }}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover-elevate cursor-pointer" onClick={() => window.location.href = "/ddp/customers/new"}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">New Customer</h3>
              <p className="text-sm text-muted-foreground">Register a new customer application</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer" onClick={() => window.location.href = "/ddp/customers"}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="font-medium">View Customers</h3>
              <p className="text-sm text-muted-foreground">Manage all your customers</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer" onClick={() => window.location.href = "/ddp/applications"}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium">Applications</h3>
              <p className="text-sm text-muted-foreground">Track application progress</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Customers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-xl">Recent Customers</CardTitle>
            <CardDescription>Latest customer registrations you've added</CardDescription>
          </div>
          <Button variant="outline" asChild data-testid="button-view-all-customers">
            <Link href="/ddp/customers">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {customersLoading ? (
            <TableSkeleton rows={5} />
          ) : !recentCustomers?.length ? (
            <EmptyState
              icon={Users}
              title="No customers registered yet"
              description="Start registering customers for solar panel installations under PM Surya Ghar Yojana."
              actionLabel="Add Customer"
              onAction={() => window.location.href = "/ddp/customers/new"}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Proposed Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCustomers.slice(0, 5).map((customer) => (
                  <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="font-mono text-sm">{customer.phone}</TableCell>
                    <TableCell>{customer.district}</TableCell>
                    <TableCell className="font-mono">{customer.proposedCapacity || "-"} kW</TableCell>
                    <TableCell>
                      <StatusBadge status={customer.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild data-testid={`button-view-customer-${customer.id}`}>
                        <Link href={`/ddp/customers/${customer.id}`}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
