import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Users, TrendingUp, CheckCircle, Plus, ArrowRight, Clock, IdCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { DashboardSkeleton, TableSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import { DashboardCustomizer, useDashboardWidgets } from "@/components/dashboard-widgets";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Copy, CheckCircle2, Link2, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { SubsidyCalculator } from "@/components/subsidy-calculator";
import type { Customer } from "@shared/schema";

interface SDPStats {
  totalCustomers: number;
  pendingApplications: number;
  approvedApplications: number;
  completedInstallations: number;
  totalDDPs: number;
}

function DDPShareCard({ partnerCode }: { partnerCode: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const ddpLink = window.location.origin + "/join/" + partnerCode + "?role=ddp";
  const copyLink = () => {
    navigator.clipboard.writeText(ddpLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };
  const shareWhatsApp = () => {
    window.open("https://api.whatsapp.com/send?text=" + text, "_blank");
  };
  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="w-5 h-5 text-blue-600" />
          Add District Partner — Share Registration Link
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input value={ddpLink} readOnly className="font-mono text-xs bg-white dark:bg-gray-900" />
          <Button onClick={copyLink} variant={copied ? "default" : "outline"} className="shrink-0">
            {copied ? <><CheckCircle2 className="h-4 w-4 mr-1" />Copied</> : <><Copy className="h-4 w-4 mr-1" />Copy</>}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={shareWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
            <MessageSquare className="h-4 w-4 mr-2" />Share on WhatsApp
          </Button>
          <Link href="/sdp/partners/new">
            <Button variant="outline"><Plus className="h-4 w-4 mr-2" />Add Manually</Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">Share this link to let District Partners register under you directly</p>
      </CardContent>
    </Card>
  );
}

export default function SDPDashboard() {
  const { user, refetchUser } = useAuth();
  const { widgets, setWidgets, isWidgetVisible } = useDashboardWidgets("sdp");
  useEffect(() => { refetchUser(); }, []);

  const { data: stats, isLoading: statsLoading } = useQuery<SDPStats>({
    queryKey: ["/api/sdp/stats"],
  });
  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/sdp/customers"],
  });
  const recentCustomers = customers?.slice(0, 5) || [];
  if (statsLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">State Partner Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}
            {user?.partnerCode && (
              <Badge variant="outline" className="ml-2 font-mono">
                <IdCard className="h-3 w-3 mr-1" />{user.partnerCode}
              </Badge>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <DashboardCustomizer widgets={widgets} onWidgetsChange={setWidgets} role="sdp" />
          <Link href="/sdp/customers/new">
            <Button><Plus className="h-4 w-4 mr-2" />Add Customer</Button>
          </Link>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total DDPs" value={stats?.totalDDPs || 0} icon={Users} description="District partners" />
        <StatCard title="Total Customers" value={stats?.totalCustomers || 0} icon={Users} description="All customers" />
        <StatCard title="Pending" value={stats?.pendingApplications || 0} icon={Clock} description="In progress" />
        <StatCard title="Approved" value={stats?.approvedApplications || 0} icon={CheckCircle} description="Approved" />
        <StatCard title="Completed" value={stats?.completedInstallations || 0} icon={TrendingUp} description="Installations done" />
      </div>
      <SubsidyCalculator showCommission="sdp_only" teamStructure="marketing_team" userRole="sdp" />

      {/* Add District Partner Link */}
      {user?.partnerCode && <DDPShareCard partnerCode={user.partnerCode} />}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle>Recent Customers</CardTitle><CardDescription>Latest customers in your network</CardDescription></div>
          <Link href="/sdp/customers"><Button variant="outline" size="sm">View All <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
        </CardHeader>
        <CardContent>
          {customersLoading ? <TableSkeleton /> : recentCustomers.length === 0 ? (
            <EmptyState icon={Users} title="No customers yet" description="Add your first customer" action={<Link href="/sdp/customers/new"><Button><Plus className="h-4 w-4 mr-2" />Add Customer</Button></Link>} />
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>District</TableHead><TableHead>Capacity</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {recentCustomers.map((c: Customer) => (
                  <TableRow key={c.id}><TableCell className="font-medium">{c.name}</TableCell><TableCell>{c.phone}</TableCell><TableCell>{c.district}</TableCell><TableCell>{c.proposedCapacity} kW</TableCell><TableCell><StatusBadge status={c.status || "pending"} /></TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
