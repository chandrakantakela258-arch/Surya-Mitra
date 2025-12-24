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
  Users,
  Building2,
  Zap
} from "lucide-react";
import type { VendorPayment, Vendor, Customer } from "@shared/schema";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    case "ready_for_payout":
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"><CheckCircle className="w-3 h-3 mr-1" />Ready</Badge>;
    case "processing":
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><RefreshCw className="w-3 h-3 mr-1" />Processing</Badge>;
    case "paid":
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
    case "cancelled":
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getMilestoneBadge(milestone: string) {
  const labels: Record<string, { label: string; icon: typeof Building2 }> = {
    bank_disbursement: { label: "Bank Disbursement", icon: Building2 },
    full_final_payment: { label: "Final Payment", icon: Building2 },
    discom_survey_completed: { label: "DISCOM Survey", icon: Zap },
    grid_connected: { label: "Grid Connected", icon: Zap },
  };
  const info = labels[milestone] || { label: milestone, icon: Clock };
  const Icon = info.icon;
  return (
    <Badge variant="outline" className="whitespace-nowrap">
      <Icon className="w-3 h-3 mr-1" />
      {info.label}
    </Badge>
  );
}

function getVendorTypeBadge(vendorType: string) {
  switch (vendorType) {
    case "bank_loan_liaison":
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"><Building2 className="w-3 h-3 mr-1" />Bank</Badge>;
    case "discom_net_metering":
      return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"><Zap className="w-3 h-3 mr-1" />DISCOM</Badge>;
    default:
      return <Badge variant="outline">{vendorType}</Badge>;
  }
}

export default function AdminVendorPayments() {
  const { toast } = useToast();
  const [selectedPayment, setSelectedPayment] = useState<VendorPayment | null>(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [vendorTypeFilter, setVendorTypeFilter] = useState<string>("all");

  const { data: payments, isLoading: paymentsLoading } = useQuery<VendorPayment[]>({
    queryKey: ["/api/admin/vendor-payments"],
  });

  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/admin/vendor-payments/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendor-payments"] });
      toast({
        title: "Status Updated",
        description: "Vendor payment status has been updated.",
      });
      setShowProcessDialog(false);
      setSelectedPayment(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const getVendorName = (vendorId: string) => {
    const vendor = vendors?.find(v => v.id === vendorId);
    return vendor?.name || "Unknown Vendor";
  };

  const getVendorCode = (vendorId: string) => {
    const vendor = vendors?.find(v => v.id === vendorId);
    return vendor?.vendorCode || "";
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers?.find(c => c.id === customerId);
    return customer?.name || "Unknown Customer";
  };

  const filteredPayments = payments?.filter(p => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (vendorTypeFilter !== "all" && p.vendorType !== vendorTypeFilter) return false;
    return true;
  }) || [];

  const pendingPayments = payments?.filter(p => p.status === "pending") || [];
  const readyPayments = payments?.filter(p => p.status === "ready_for_payout") || [];
  const paidPayments = payments?.filter(p => p.status === "paid") || [];

  const totalPending = pendingPayments.reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
  const totalReady = readyPayments.reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
  const totalPaid = paidPayments.reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);

  if (paymentsLoading) {
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
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Vendor Payments</h1>
          <p className="text-muted-foreground">Manage vendor milestone-based payments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <Clock className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-total">{formatINR(totalPending)}</div>
            <p className="text-xs text-muted-foreground">{pendingPayments.length} payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ready for Payout</CardTitle>
            <Send className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-ready-total">{formatINR(totalReady)}</div>
            <p className="text-xs text-muted-foreground">{readyPayments.length} payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paid</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-paid-total">{formatINR(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">{paidPayments.length} payments</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle>All Vendor Payments</CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="ready_for_payout">Ready</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={vendorTypeFilter} onValueChange={setVendorTypeFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-vendor-type-filter">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bank_loan_liaison">Bank</SelectItem>
                <SelectItem value="discom_net_metering">DISCOM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No vendor payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Milestone</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id} data-testid={`row-vendor-payment-${payment.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{getVendorName(payment.vendorId)}</div>
                          <div className="text-xs text-muted-foreground">{getVendorCode(payment.vendorId)}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getCustomerName(payment.customerId)}</TableCell>
                      <TableCell>{getVendorTypeBadge(payment.vendorType)}</TableCell>
                      <TableCell>{getMilestoneBadge(payment.milestone)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatINR(parseFloat(payment.amount || "0"))}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {payment.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatusMutation.mutate({ id: payment.id, status: "ready_for_payout" })}
                              disabled={updateStatusMutation.isPending}
                              data-testid={`button-approve-${payment.id}`}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                          )}
                          {payment.status === "ready_for_payout" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setShowProcessDialog(true);
                              }}
                              data-testid={`button-process-${payment.id}`}
                            >
                              <Send className="w-3 h-3 mr-1" />
                              Pay
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Vendor Payment</DialogTitle>
            <DialogDescription>
              Confirm payment processing for this vendor.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Vendor</p>
                  <p className="font-medium">{getVendorName(selectedPayment.vendorId)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{getCustomerName(selectedPayment.customerId)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Milestone</p>
                  {getMilestoneBadge(selectedPayment.milestone)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-bold text-lg">{formatINR(parseFloat(selectedPayment.amount || "0"))}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcessDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedPayment) {
                  updateStatusMutation.mutate({ id: selectedPayment.id, status: "paid" });
                }
              }}
              disabled={updateStatusMutation.isPending}
              data-testid="button-confirm-payment"
            >
              <Send className="w-4 h-4 mr-2" />
              {updateStatusMutation.isPending ? "Processing..." : "Mark as Paid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
