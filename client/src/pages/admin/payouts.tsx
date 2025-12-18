import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  IndianRupee, 
  CheckCircle, 
  Clock, 
  Send, 
  RefreshCw, 
  AlertCircle,
  Wallet,
  Users
} from "lucide-react";
import type { Commission, Payout, User } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    case "approved":
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
    case "paid":
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
    case "processing":
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><RefreshCw className="w-3 h-3 mr-1" />Processing</Badge>;
    case "completed":
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
    case "failed":
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function AdminPayouts() {
  const { toast } = useToast();
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [payoutMode, setPayoutMode] = useState("IMPS");
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);

  const { data: commissions, isLoading: commissionsLoading } = useQuery<Commission[]>({
    queryKey: ["/api/admin/commissions"],
  });

  const { data: payouts, isLoading: payoutsLoading } = useQuery<Payout[]>({
    queryKey: ["/api/admin/payouts"],
  });

  const { data: partners } = useQuery<User[]>({
    queryKey: ["/api/admin/partners"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/admin/commissions/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/commissions"] });
      toast({
        title: "Status Updated",
        description: "Commission status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const processPayoutMutation = useMutation({
    mutationFn: async (data: { commissionId: string; partnerId: string; amount: number; mode: string }) => {
      return apiRequest("POST", "/api/admin/payouts/process", data);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/commissions"] });
      setShowPayoutDialog(false);
      setSelectedCommission(null);
      toast({
        title: "Payout Initiated",
        description: data.razorpayPayout?.status === "processed" 
          ? "Payout has been processed successfully!" 
          : "Payout is being processed. Check status for updates.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Payout Failed",
        description: error.message || "Failed to process payout. Check Razorpay configuration.",
        variant: "destructive",
      });
    },
  });

  const getPartnerName = (partnerId: string) => {
    const partner = partners?.find(p => p.id === partnerId);
    return partner?.name || "Unknown Partner";
  };

  const approvedCommissions = commissions?.filter(c => c.status === "approved") || [];
  const pendingCommissions = commissions?.filter(c => c.status === "pending") || [];
  const paidCommissions = commissions?.filter(c => c.status === "paid") || [];

  const totalPending = pendingCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
  const totalApproved = approvedCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
  const totalPaid = paidCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);

  if (commissionsLoading || payoutsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
          <Wallet className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Commission Payouts</h1>
          <p className="text-muted-foreground">Manage and process partner commission payouts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
            <Clock className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="text-pending-amount">{formatINR(totalPending)}</p>
            <p className="text-xs text-muted-foreground mt-1">{pendingCommissions.length} commissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ready for Payout</CardTitle>
            <Send className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="text-approved-amount">{formatINR(totalApproved)}</p>
            <p className="text-xs text-muted-foreground mt-1">{approvedCommissions.length} commissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="text-paid-amount">{formatINR(totalPaid)}</p>
            <p className="text-xs text-muted-foreground mt-1">{paidCommissions.length} commissions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="w-5 h-5" />
            Pending Commissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingCommissions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No pending commissions</p>
          ) : (
            <div className="space-y-3">
              {pendingCommissions.map((commission) => (
                <div 
                  key={commission.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`commission-row-${commission.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{getPartnerName(commission.partnerId)}</p>
                      <p className="text-sm text-muted-foreground">
                        {commission.partnerType.toUpperCase()} - {commission.capacityKw} kW
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold text-lg">{formatINR(commission.commissionAmount)}</p>
                    {getStatusBadge(commission.status)}
                    <Button
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ id: commission.id, status: "approved" })}
                      disabled={updateStatusMutation.isPending}
                      data-testid={`button-approve-${commission.id}`}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Ready for Payout
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvedCommissions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No approved commissions ready for payout</p>
          ) : (
            <div className="space-y-3">
              {approvedCommissions.map((commission) => (
                <div 
                  key={commission.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`payout-row-${commission.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{getPartnerName(commission.partnerId)}</p>
                      <p className="text-sm text-muted-foreground">
                        {commission.partnerType.toUpperCase()} - {commission.capacityKw} kW
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold text-lg">{formatINR(commission.commissionAmount)}</p>
                    {getStatusBadge(commission.status)}
                    <Button
                      onClick={() => {
                        setSelectedCommission(commission);
                        setShowPayoutDialog(true);
                      }}
                      data-testid={`button-payout-${commission.id}`}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Pay Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Recent Payouts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(!payouts || payouts.length === 0) ? (
            <p className="text-muted-foreground text-center py-8">No payouts processed yet</p>
          ) : (
            <div className="space-y-3">
              {payouts.slice(0, 10).map((payout) => (
                <div 
                  key={payout.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`payout-history-${payout.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <IndianRupee className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{getPartnerName(payout.partnerId)}</p>
                      <p className="text-sm text-muted-foreground">
                        {payout.mode} - {payout.utr ? `UTR: ${payout.utr}` : "Pending"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold">{formatINR(payout.amount)}</p>
                    {getStatusBadge(payout.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payout</DialogTitle>
            <DialogDescription>
              Send commission payment via Razorpay to partner&apos;s bank account.
            </DialogDescription>
          </DialogHeader>
          
          {selectedCommission && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Partner:</span>
                <span className="font-medium">{getPartnerName(selectedCommission.partnerId)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold text-lg">{formatINR(selectedCommission.commissionAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Transfer Mode:</span>
                <Select value={payoutMode} onValueChange={setPayoutMode}>
                  <SelectTrigger className="w-32" data-testid="select-payout-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IMPS">IMPS</SelectItem>
                    <SelectItem value="NEFT">NEFT</SelectItem>
                    <SelectItem value="RTGS">RTGS</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedCommission) {
                  processPayoutMutation.mutate({
                    commissionId: selectedCommission.id,
                    partnerId: selectedCommission.partnerId,
                    amount: selectedCommission.commissionAmount,
                    mode: payoutMode,
                  });
                }
              }}
              disabled={processPayoutMutation.isPending}
              data-testid="button-confirm-payout"
            >
              {processPayoutMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
