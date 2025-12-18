import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Users, Building2, TrendingUp, CheckCircle, Plus, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/stat-card";
import { StatusBadge, RoleBadge } from "@/components/status-badge";
import { DashboardSkeleton, TableSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import { PartnerOfMonthCard } from "@/components/partner-of-month";
import { DashboardCustomizer, useDashboardWidgets } from "@/components/dashboard-widgets";
import type { User, Customer } from "@shared/schema";

interface DashboardStats {
  totalPartners: number;
  activePartners: number;
  totalCustomers: number;
  completedInstallations: number;
}

export default function BDPDashboard() {
  const { widgets, setWidgets, isWidgetVisible } = useDashboardWidgets("bdp");

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/bdp/stats"],
  });

  const { data: recentPartners, isLoading: partnersLoading } = useQuery<User[]>({
    queryKey: ["/api/bdp/partners", "recent"],
  });

  const { data: recentCustomers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/bdp/customers", "recent"],
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
          <p className="text-muted-foreground">Overview of your partner network and customers</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DashboardCustomizer role="bdp" widgets={widgets} onWidgetsChange={setWidgets} />
          <Button asChild data-testid="button-add-partner">
            <Link href="/bdp/partners/new">
              <Plus className="w-4 h-4 mr-2" />
              Add District Partner
            </Link>
          </Button>
        </div>
      </div>

      {/* Partner of the Month */}
      {isWidgetVisible("partner-of-month") && <PartnerOfMonthCard />}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="District Partners"
          value={stats?.totalPartners || 0}
          icon={Building2}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Active Partners"
          value={stats?.activePartners || 0}
          icon={Users}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          icon={TrendingUp}
          trend={{ value: 24, isPositive: true }}
        />
        <StatCard
          title="Installations Completed"
          value={stats?.completedInstallations || 0}
          icon={CheckCircle}
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      {/* Recent Partners */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-xl">Recent District Partners</CardTitle>
            <CardDescription>Latest partners added to your network</CardDescription>
          </div>
          <Button variant="outline" asChild data-testid="button-view-all-partners">
            <Link href="/bdp/partners">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {partnersLoading ? (
            <TableSkeleton rows={3} />
          ) : !recentPartners?.length ? (
            <EmptyState
              icon={Building2}
              title="No partners yet"
              description="Start building your network by adding district development partners."
              actionLabel="Add Partner"
              onAction={() => window.location.href = "/bdp/partners/new"}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Customers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPartners.slice(0, 5).map((partner) => (
                  <TableRow key={partner.id} data-testid={`row-partner-${partner.id}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {partner.name}
                        <RoleBadge role="ddp" />
                      </div>
                    </TableCell>
                    <TableCell>{partner.district || "-"}</TableCell>
                    <TableCell className="font-mono text-sm">{partner.phone}</TableCell>
                    <TableCell>
                      <StatusBadge status={partner.status} />
                    </TableCell>
                    <TableCell className="text-right font-mono">0</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Customers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-xl">Recent Customer Applications</CardTitle>
            <CardDescription>Latest solar installation applications from your network</CardDescription>
          </div>
          <Button variant="outline" asChild data-testid="button-view-all-customers">
            <Link href="/bdp/customers">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {customersLoading ? (
            <TableSkeleton rows={3} />
          ) : !recentCustomers?.length ? (
            <EmptyState
              icon={Users}
              title="No customers yet"
              description="Your district partners will register customers for solar installations."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Proposed Capacity</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCustomers.slice(0, 5).map((customer) => (
                  <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.district}</TableCell>
                    <TableCell className="font-mono">{customer.proposedCapacity || "-"} kW</TableCell>
                    <TableCell>
                      <StatusBadge status={customer.status} />
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
