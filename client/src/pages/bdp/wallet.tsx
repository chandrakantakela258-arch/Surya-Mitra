import { useQuery, useMutation } from "@tanstack/react-query";
import { IndianRupee, TrendingUp, Clock, CheckCircle, Download, Wallet, Users, CreditCard, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/stat-card";
import { TableSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import { dcrFixedCommission, dcrPerKwRates, nonDcrPerKwRates, inverterCommission, type Commission, type BankAccount } from "@shared/schema";
import { formatINR } from "@/components/subsidy-calculator";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

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

export default function BDPWallet() {
  const { toast } = useToast();
  const [bankForm, setBankForm] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<{
    totalEarned: number;
    totalPending: number;
    totalPaid: number;
    totalInstallations: number;
  }>({
    queryKey: ["/api/bdp/commissions/summary"],
  });
  
  const { data: commissions, isLoading: commissionsLoading } = useQuery<Commission[]>({
    queryKey: ["/api/bdp/commissions"],
  });

  const { data: bankAccount } = useQuery<BankAccount | null>({
    queryKey: ["/api/bank-account"],
  });

  useEffect(() => {
    if (bankAccount) {
      setBankForm({
        accountHolderName: bankAccount.accountHolderName || "",
        accountNumber: bankAccount.accountNumber || "",
        ifscCode: bankAccount.ifscCode || "",
        bankName: bankAccount.bankName || "",
      });
    }
  }, [bankAccount]);

  const saveBankMutation = useMutation({
    mutationFn: async (data: typeof bankForm) => {
      return apiRequest("POST", "/api/bank-account", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-account"] });
      toast({
        title: "Bank Details Saved",
        description: "Your bank account details have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save bank details",
        variant: "destructive",
      });
    },
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
    a.download = "bdp_commissions.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Commission Wallet</h1>
          <p className="text-muted-foreground">Track your earnings from partner network installations</p>
        </div>
        <Button variant="outline" onClick={exportToCSV} disabled={!commissions?.length} data-testid="button-export-csv">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>
      
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Wallet className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Wallet Balance</p>
                <p className="text-3xl font-bold" data-testid="text-wallet-balance">
                  {summaryLoading ? "..." : formatINR(summary?.totalPending || 0)}
                </p>
              </div>
            </div>
            <div className="flex gap-6 flex-wrap">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {summaryLoading ? "..." : formatINR(summary?.totalEarned || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Earned</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {summaryLoading ? "..." : formatINR(summary?.totalPaid || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Paid</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
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
            <CardDescription>Earnings from your district partner network</CardDescription>
          </CardHeader>
          <CardContent>
            {commissionsLoading ? (
              <TableSkeleton rows={5} />
            ) : !commissions?.length ? (
              <EmptyState
                icon={IndianRupee}
                title="No commissions yet"
                description="When your district partners complete solar installations, you'll earn commissions based on the installation type and capacity."
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
              <Wallet className="w-5 h-5 text-primary" />
              Commission Structure
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
                    {formatINR(dcrFixedCommission[3]?.bdp || 0)}
                  </Badge>
                </div>
                <div className="p-3 rounded-lg bg-primary/10 flex items-center justify-between gap-4 flex-wrap">
                  <span className="text-sm">5 kW</span>
                  <Badge variant="outline" className="font-mono">
                    {formatINR(dcrFixedCommission[5]?.bdp || 0)}
                  </Badge>
                </div>
                <div className="p-3 rounded-lg bg-primary/10 flex items-center justify-between gap-4 flex-wrap">
                  <span className="text-sm">6-10 kW</span>
                  <Badge variant="outline" className="font-mono">
                    {formatINR(dcrPerKwRates.bdp)}/kW
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Non-DCR Panels</p>
              <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-between gap-4 flex-wrap">
                <span className="text-sm">6-10 kW</span>
                <Badge variant="outline" className="font-mono">
                  {formatINR(nonDcrPerKwRates.bdp)}/kW
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">SunPunch 3-in-1 Inverter</p>
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-between gap-4 flex-wrap">
                <span className="text-sm">Per Unit Sold</span>
                <Badge variant="outline" className="font-mono">
                  {formatINR(inverterCommission.bdp)}
                </Badge>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm">DDP Rates (reference)</span>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DCR 3 kW</span>
                  <span className="font-mono">{formatINR(dcrFixedCommission[3]?.ddp || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DCR 5 kW</span>
                  <span className="font-mono">{formatINR(dcrFixedCommission[5]?.ddp || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DCR 6-10 kW</span>
                  <span className="font-mono">{formatINR(dcrPerKwRates.ddp)}/kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Non-DCR</span>
                  <span className="font-mono">{formatINR(nonDcrPerKwRates.ddp)}/kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Inverter</span>
                  <span className="font-mono">{formatINR(inverterCommission.ddp)}/unit</span>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Build your network of District Development Partners to maximize your earnings from solar installations.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Bank Account Details
          </CardTitle>
          <CardDescription>
            Add your bank account for receiving commission payouts via Razorpay
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountHolderName">Account Holder Name</Label>
              <Input
                id="accountHolderName"
                placeholder="Enter name as per bank account"
                value={bankForm.accountHolderName}
                onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                data-testid="input-account-holder"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                placeholder="e.g., State Bank of India"
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                data-testid="input-bank-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                placeholder="Enter your bank account number"
                value={bankForm.accountNumber}
                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                data-testid="input-account-number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ifscCode">IFSC Code</Label>
              <Input
                id="ifscCode"
                placeholder="e.g., SBIN0001234"
                value={bankForm.ifscCode}
                onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                data-testid="input-ifsc-code"
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 mt-6 flex-wrap">
            {bankAccount && (
              <div className="flex items-center gap-2">
                <Badge variant={bankAccount.verified === "verified" ? "default" : "secondary"}>
                  {bankAccount.verified === "verified" ? (
                    <><CheckCircle className="w-3 h-3 mr-1" />Verified</>
                  ) : (
                    <><Clock className="w-3 h-3 mr-1" />Pending Verification</>
                  )}
                </Badge>
              </div>
            )}
            <Button
              onClick={() => saveBankMutation.mutate(bankForm)}
              disabled={saveBankMutation.isPending || !bankForm.accountHolderName || !bankForm.accountNumber || !bankForm.ifscCode}
              data-testid="button-save-bank"
            >
              {saveBankMutation.isPending ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Bank Details
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
