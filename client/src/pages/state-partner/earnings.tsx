import { useQuery } from "@tanstack/react-query";
import { IndianRupee, Clock, CheckCircle, Wallet, Sun } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/stat-card";
import { TableSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import type { Commission } from "@shared/schema";

function formatINR(n: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n); }

export default function SDPEarnings() {
  const { data: stats } = useQuery<any>({ queryKey: ["/api/sdp/earnings/stats"] });
  const { data: commissions, isLoading } = useQuery<Commission[]>({ queryKey: ["/api/sdp/commissions"] });

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Earnings & Commissions</h1><p className="text-muted-foreground">Your commission earnings</p></div>
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20"><CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">DCR Panel (With Subsidy)</h3><p className="text-sm text-muted-foreground">SDP: <strong>Rs 2,000/kW</strong> | Direct customer bonus: <strong>+Rs 4,000/kW</strong></p></div>
          <div><h3 className="font-semibold text-orange-700 dark:text-orange-300 mb-2">Non-DCR Panel (Without Subsidy)</h3><p className="text-sm text-muted-foreground">SDP: <strong>Rs 1,000/kW</strong> | Direct customer bonus: <strong>+Rs 1,500/kW</strong></p></div>
        </div>
      </CardContent></Card>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Earned" value={formatINR(stats?.totalEarned || 0)} icon={IndianRupee} description="Lifetime" />
        <StatCard title="Pending" value={formatINR(stats?.pendingAmount || 0)} icon={Clock} description="Awaiting payment" />
        <StatCard title="Paid" value={formatINR(stats?.paidAmount || 0)} icon={CheckCircle} description="Received" />
        <StatCard title="Direct Customers" value={stats?.directCustomers || 0} icon={Sun} description="Bonus commission" />
      </div>
      <Card><CardHeader><CardTitle>Commission History</CardTitle></CardHeader><CardContent>
        {isLoading ? <TableSkeleton /> : !commissions?.length ? <EmptyState icon={Wallet} title="No commissions yet" description="Commissions generated on installation completion" /> : (
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Source</TableHead><TableHead>Capacity</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{commissions.map((c: Commission) => (
              <TableRow key={c.id}>
                <TableCell>{c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN") : "-"}</TableCell>
                <TableCell><Badge variant={c.source === "direct_installation" ? "default" : "outline"}>{c.source === "direct_installation" ? "Direct+DDP" : c.source}</Badge></TableCell>
                <TableCell>{c.capacityKw} kW</TableCell>
                <TableCell className="font-semibold text-green-600">{formatINR(c.commissionAmount)}</TableCell>
                <TableCell><Badge className={c.status === "paid" ? "bg-green-100 text-green-700" : c.status === "approved" ? "bg-blue-100 text-blue-700" : ""}>{c.status}</Badge></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}
