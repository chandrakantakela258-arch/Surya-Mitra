import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Users, FileText, TrendingUp, CheckCircle, Plus, ArrowRight, Clock, Phone, Mail, MapPin, Building2, IdCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { DashboardSkeleton, TableSkeleton, StatCardSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import { PartnerOfMonthCard } from "@/components/partner-of-month";
import { DashboardCustomizer, useDashboardWidgets } from "@/components/dashboard-widgets";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import type { Customer } from "@shared/schema";

interface DDPStats {
  totalCustomers: number;
  pendingApplications: number;
  approvedApplications: number;
  completedInstallations: number;
}

interface BDPInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  district: string | null;
  state: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  partnerCode: string | null;
}

export default function DDPDashboard() {
  const { user, refetchUser } = useAuth();
  const { widgets, setWidgets, isWidgetVisible } = useDashboardWidgets("ddp");

  // Refetch user data on mount to ensure we have the latest partnerCode
  useEffect(() => {
    refetchUser();
  }, []);

  const { data: stats, isLoading: statsLoading } = useQuery<DDPStats>({
    queryKey: ["/api/ddp/stats"],
  });

  const { data: recentCustomers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/ddp/customers", "recent"],
  });

  const { data: bdpInfo, isLoading: bdpLoading } = useQuery<BDPInfo>({
    queryKey: ["/api/ddp/bdp-info"],
  });

  if (statsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-semibold" data-testid="text-page-title">Dashboard</h1>
            {user?.partnerCode && (
              <Badge variant="outline" className="font-mono text-base" data-testid="badge-partner-code">
                <IdCard className="w-4 h-4 mr-1" />
                {user.partnerCode}
              </Badge>
            )}
          </div>
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

      {/* BDP Partner Information */}
      {bdpLoading ? (
        <StatCardSkeleton />
      ) : bdpInfo ? (
        <Card data-testid="card-bdp-info">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Your BDP Partner
            </CardTitle>
            <CardDescription>Business Development Partner assigned to your region</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono" data-testid="badge-bdp-code">
                    <IdCard className="w-3 h-3 mr-1" />
                    {bdpInfo.partnerCode || "N/A"}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-lg font-semibold" data-testid="text-bdp-name">{bdpInfo.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {bdpInfo.district && bdpInfo.state ? `${bdpInfo.district}, ${bdpInfo.state}` : "Location not set"}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${bdpInfo.phone}`} className="hover:underline" data-testid="link-bdp-phone">
                      {bdpInfo.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${bdpInfo.email}`} className="hover:underline" data-testid="link-bdp-email">
                      {bdpInfo.email}
                    </a>
                  </div>
                  {bdpInfo.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span data-testid="text-bdp-address">{bdpInfo.address}</span>
                    </div>
                  )}
                </div>
              </div>
              {bdpInfo.latitude && bdpInfo.longitude && (
                <div className="rounded-md overflow-hidden border h-[200px]" data-testid="map-bdp-location">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${bdpInfo.latitude},${bdpInfo.longitude}&zoom=15`}
                    title="BDP Location"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

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
