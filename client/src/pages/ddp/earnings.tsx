import { useQuery } from "@tanstack/react-query";
import { IndianRupee, TrendingUp, Clock, CheckCircle, Download, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/stat-card";
import { TableSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import { dcrFixedCommission, dcrPerKwRates, nonDcrPerKwRates, type Commission } from "@shared/schema";
import { formatINR } from "@/components/subsidy-calculator";

function CommissionStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "paid":
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">Paid</Badge>;
    case "approved":
      return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">Approved</Badge>;
    default:
      return <Badge variant="secondary">Pending</Badge>;
  }
}

export default function DDPEarnings() {
  const { data: summary, isLoading: summaryLoading } = useQuery<{
    totalEarned: number;
    totalPending: number;
    totalPaid: number;
    totalInstallations: number;
  }>({
    queryKey: ["/api/ddp/commissions/summary"],
  });
  
  const { data: commissions, isLoading: commissionsLoading } = useQuery<Commission[]>({
    queryKey: ["/api/ddp/commissions"],
  });
  
  function exportToCSV() {
    if (!commissions?.length) return;
    
    const headers = ["Date", "Customer ID", "Capacity (kW)", "Commission Amount", "Status", "Paid At"];
    const rows = commissions.map(c => [
      new Date(c.createdAt!).toLocaleDateString(),
      c.customerId,
      c.capacityKw.toString(),
      c.commissionAmount.toString(),
      c.status,
      c.paidAt ? new Date(c.paidAt).toLocaleDateString() : "",
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my_commissions.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Earnings & Commissions</h1>
          <p className="text-muted-foreground">Track your commissions from solar installations</p>
        </div>
        <Button variant="outline" onClick={exportToCSV} disabled={!commissions?.length} data-testid="button-export-csv">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Earned"
          value={summaryLoading ? "..." : formatINR(summary?.totalEarned || 0)}
          icon={Wallet}
        />
        <StatCard
          title="Pending Payout"
          value={summaryLoading ? "..." : formatINR(summary?.totalPending || 0)}
          icon={Clock}
        />
        <StatCard
          title="Total Paid"
          value={summaryLoading ? "..." : formatINR(summary?.totalPaid || 0)}
          icon={CheckCircle}
        />
        <StatCard
          title="Installations"
          value={summary?.totalInstallations || 0}
          icon={TrendingUp}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Commission History</CardTitle>
            <CardDescription>All your commissions from completed installations</CardDescription>
          </CardHeader>
          <CardContent>
            {commissionsLoading ? (
              <TableSkeleton rows={5} />
            ) : !commissions?.length ? (
              <EmptyState
                icon={IndianRupee}
                title="No commissions yet"
                description="Complete solar installations to earn commissions. Commissions are generated when installation is marked complete."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((commission) => (
                    <TableRow key={commission.id} data-testid={`row-commission-${commission.id}`}>
                      <TableCell className="text-sm">
                        {new Date(commission.createdAt!).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-mono">
                        {commission.capacityKw} kW
                      </TableCell>
                      <TableCell className="font-mono font-medium text-green-600 dark:text-green-400">
                        {formatINR(commission.commissionAmount)}
                      </TableCell>
                      <TableCell>
                        <CommissionStatusBadge status={commission.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {commission.paidAt 
                          ? new Date(commission.paidAt).toLocaleDateString()
                          : "-"
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-primary" />
              Commission Rates
            </CardTitle>
            <CardDescription>Your earnings per installation type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">DCR Panels</p>
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-primary/10 flex items-center justify-between gap-4 flex-wrap">
                  <span className="text-sm">3 kW</span>
                  <Badge variant="outline" className="font-mono">
                    {formatINR(dcrFixedCommission[3]?.ddp || 0)}
                  </Badge>
                </div>
                <div className="p-3 rounded-lg bg-primary/10 flex items-center justify-between gap-4 flex-wrap">
                  <span className="text-sm">5 kW</span>
                  <Badge variant="outline" className="font-mono">
                    {formatINR(dcrFixedCommission[5]?.ddp || 0)}
                  </Badge>
                </div>
                <div className="p-3 rounded-lg bg-primary/10 flex items-center justify-between gap-4 flex-wrap">
                  <span className="text-sm">6-10 kW</span>
                  <Badge variant="outline" className="font-mono">
                    {formatINR(dcrPerKwRates.ddp)}/kW
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Non-DCR Panels</p>
              <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-between gap-4 flex-wrap">
                <span className="text-sm">6-10 kW</span>
                <Badge variant="outline" className="font-mono">
                  {formatINR(nonDcrPerKwRates.ddp)}/kW
                </Badge>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Commissions are earned when installation is marked complete. 
                DCR panels are eligible for government subsidy, Non-DCR at Rs 55,000/kW.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
