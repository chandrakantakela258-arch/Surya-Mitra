import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Users, Building2, TrendingUp, CheckCircle, Plus, ArrowRight, IdCard, Phone, MapPin, ChevronDown, ChevronRight, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { StatCard } from "@/components/stat-card";
import { StatusBadge, RoleBadge } from "@/components/status-badge";
import { DashboardSkeleton, TableSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import { PartnerOfMonthCard } from "@/components/partner-of-month";
import { DashboardCustomizer, useDashboardWidgets } from "@/components/dashboard-widgets";
import { useAuth } from "@/lib/auth";
import { SubsidyCalculator } from "@/components/subsidy-calculator";
import type { User as UserType, Customer } from "@shared/schema";
import { ExpandableSiteProgress } from "@/components/customer-journey-tracker";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalPartners: number;
  activePartners: number;
  totalCustomers: number;
  completedInstallations: number;
}

export default function BDPDashboard() {
  const { user, refetchUser } = useAuth();
  const { widgets, setWidgets, isWidgetVisible } = useDashboardWidgets("bdp");
  const [expandedDDPs, setExpandedDDPs] = useState<Set<string>>(new Set());

  // Refetch user data on mount to ensure we have the latest partnerCode
  useEffect(() => {
    refetchUser();
  }, []);

  const toggleDDP = (id: string) => {
    setExpandedDDPs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/bdp/stats"],
  });

  const { data: recentPartners, isLoading: partnersLoading } = useQuery<UserType[]>({
    queryKey: ["/api/bdp/partners", "recent"],
  });

  const { data: recentCustomers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/bdp/customers", "recent"],
  });

  const getCustomersForDDP = (ddpId: string) => {
    return recentCustomers?.filter(c => c.ddpId === ddpId) || [];
  };

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
        <CardContent className="space-y-2">
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
            recentPartners.slice(0, 5).map((ddp) => {
              const ddpCustomers = getCustomersForDDP(ddp.id);
              const isDDPExpanded = expandedDDPs.has(ddp.id);
              
              return (
                <div key={ddp.id} className="border rounded-lg" data-testid={`card-ddp-${ddp.id}`}>
                  <Collapsible open={isDDPExpanded} onOpenChange={() => toggleDDP(ddp.id)}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 hover-elevate rounded-lg">
                        <div className="flex items-center gap-3">
                          {isDDPExpanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                          <div className="p-1.5 bg-blue-500/10 rounded-full">
                            <Users className="w-3 h-3 text-blue-500" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium">{ddp.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                              <Phone className="w-3 h-3" />
                              <span>{ddp.phone}</span>
                              {ddp.partnerCode && (
                                <>
                                  <IdCard className="w-3 h-3 ml-1" />
                                  <span className="font-mono text-blue-600 dark:text-blue-400">{ddp.partnerCode}</span>
                                </>
                              )}
                              {ddp.district && (
                                <>
                                  <MapPin className="w-3 h-3 ml-1" />
                                  <span>{ddp.district}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{ddpCustomers.length} Customers</Badge>
                          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0 text-xs">DDP</Badge>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="pl-10 pr-3 pb-3 space-y-1">
                        {ddpCustomers.length > 0 ? (
                          ddpCustomers.map((customer) => (
                            <div 
                              key={customer.id} 
                              className="p-2 bg-muted/30 rounded-md border space-y-2"
                              data-testid={`card-customer-${customer.id}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="p-1 bg-green-500/10 rounded-full">
                                    <User className="w-3 h-3 text-green-500" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{customer.name}</p>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
                                      <Phone className="w-3 h-3" />
                                      <span>{customer.phone}</span>
                                      {customer.customerCode && (
                                        <>
                                          <IdCard className="w-3 h-3 ml-1" />
                                          <span className="font-mono text-green-600 dark:text-green-400">{customer.customerCode}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "text-xs",
                                      customer.status === "completed" && "bg-green-500/10 text-green-600 border-green-200",
                                      customer.status === "pending" && "bg-yellow-500/10 text-yellow-600 border-yellow-200"
                                    )}
                                  >
                                    {customer.status}
                                  </Badge>
                                  <p className="text-xs text-muted-foreground mt-1">{customer.proposedCapacity || "N/A"} kW</p>
                                </div>
                              </div>
                              <div className="ml-6">
                                <ExpandableSiteProgress 
                                  customerId={customer.id}
                                  customerName={customer.name}
                                  showActions={false}
                                />
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground py-2">No customers yet</p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            })
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
                  <TableHead>Client Code</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Proposed Capacity</TableHead>
                  <TableHead>Site Progress</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCustomers.slice(0, 5).map((customer) => (
                  <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      {customer.customerCode ? (
                        <Badge variant="outline" className="font-mono text-xs">
                          <IdCard className="w-3 h-3 mr-1" />
                          {customer.customerCode}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{customer.district}</TableCell>
                    <TableCell className="font-mono">{customer.proposedCapacity || "-"} kW</TableCell>
                    <TableCell className="min-w-[180px]">
                      <ExpandableSiteProgress 
                        customerId={customer.id}
                        customerName={customer.name}
                        showActions={false}
                      />
                    </TableCell>
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

      {/* Subsidy Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Check Subsidy Calculator
          </CardTitle>
          <CardDescription>Calculate subsidy and savings for your customers</CardDescription>
        </CardHeader>
        <CardContent>
          <SubsidyCalculator showCommission="bdp" />
        </CardContent>
      </Card>
    </div>
  );
}
