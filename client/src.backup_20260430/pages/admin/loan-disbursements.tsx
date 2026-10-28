import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Banknote, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2,
  Clock,
  Calendar,
  IndianRupee,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import type { LoanDisbursement, Customer, BankLoanApproval } from "@shared/schema";
import { loanDisbursementStatuses } from "@shared/schema";

export default function AdminLoanDisbursements() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedDisbursement, setSelectedDisbursement] = useState<LoanDisbursement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    customerId: "",
    bankLoanApprovalId: "",
    customerName: "",
    bankName: "",
    bankBranch: "",
    disbursementDate: format(new Date(), "yyyy-MM-dd"),
    disbursementTime: "",
    disbursedAmount: "",
    transactionReference: "",
    divyanshiBankAccount: "",
    remarks: "",
    status: "received",
  });

  const { data: disbursements = [], isLoading } = useQuery<LoanDisbursement[]>({
    queryKey: ["/api/admin/loan-disbursements"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  const { data: approvals = [] } = useQuery<BankLoanApproval[]>({
    queryKey: ["/api/admin/bank-loan-approvals"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/admin/loan-disbursements", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/loan-disbursements"] });
      toast({ title: "Loan disbursement created successfully" });
      setIsAddOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create disbursement", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return await apiRequest("PATCH", `/api/admin/loan-disbursements/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/loan-disbursements"] });
      toast({ title: "Loan disbursement updated successfully" });
      setIsEditOpen(false);
      setSelectedDisbursement(null);
    },
    onError: () => {
      toast({ title: "Failed to update disbursement", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/loan-disbursements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/loan-disbursements"] });
      toast({ title: "Loan disbursement deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete disbursement", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      customerId: "",
      bankLoanApprovalId: "",
      customerName: "",
      bankName: "",
      bankBranch: "",
      disbursementDate: format(new Date(), "yyyy-MM-dd"),
      disbursementTime: "",
      disbursedAmount: "",
      transactionReference: "",
      divyanshiBankAccount: "",
      remarks: "",
      status: "received",
    });
  };

  const handleEdit = (disbursement: LoanDisbursement) => {
    setSelectedDisbursement(disbursement);
    setFormData({
      customerId: disbursement.customerId || "",
      bankLoanApprovalId: disbursement.bankLoanApprovalId || "",
      customerName: disbursement.customerName,
      bankName: disbursement.bankName,
      bankBranch: disbursement.bankBranch || "",
      disbursementDate: disbursement.disbursementDate ? format(new Date(disbursement.disbursementDate), "yyyy-MM-dd") : "",
      disbursementTime: disbursement.disbursementTime || "",
      disbursedAmount: disbursement.disbursedAmount || "",
      transactionReference: disbursement.transactionReference || "",
      divyanshiBankAccount: disbursement.divyanshiBankAccount || "",
      remarks: disbursement.remarks || "",
      status: disbursement.status || "received",
    });
    setIsEditOpen(true);
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId,
        customerName: customer.name,
      }));
    }
  };

  const handleApprovalSelect = (approvalId: string) => {
    const approval = approvals.find((a) => a.id === approvalId);
    if (approval) {
      const customer = customers.find((c) => c.id === approval.customerId);
      setFormData(prev => ({
        ...prev,
        bankLoanApprovalId: approvalId,
        customerId: approval.customerId || "",
        customerName: customer?.name || approval.customerName,
        bankName: approval.bankName,
        bankBranch: approval.bankBranch || "",
        disbursedAmount: approval.approvedAmount || "",
      }));
    }
  };

  const handleCreate = () => {
    if (!formData.customerName || !formData.bankName || !formData.disbursementDate || !formData.disbursedAmount) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedDisbursement) return;
    updateMutation.mutate({
      id: selectedDisbursement.id,
      data: formData,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      processing: { variant: "outline", label: "Processing" },
      received: { variant: "default", label: "Received" },
      partial: { variant: "outline", label: "Partial" },
      failed: { variant: "destructive", label: "Failed" },
    };
    const config = statusConfig[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (value: string | null | undefined) => {
    if (!value) return "-";
    const num = Number(value);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const filteredDisbursements = disbursements.filter((disbursement) => {
    const customerName = disbursement.customerName.toLowerCase();
    const bankName = disbursement.bankName.toLowerCase();
    const reference = (disbursement.transactionReference || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return customerName.includes(query) || bankName.includes(query) || reference.includes(query);
  });

  const totalReceivedAmount = disbursements
    .filter(d => d.status === "received")
    .reduce((sum, d) => sum + Number(d.disbursedAmount || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Loan Disbursements</h1>
          <p className="text-muted-foreground">Track bank loan disbursements into Divyanshi account (Step 4)</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} data-testid="button-add-disbursement">
          <Plus className="mr-2 h-4 w-4" />
          Add Disbursement
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Disbursements</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-disbursements">{disbursements.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Received</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-received-count">
              {disbursements.filter((d) => d.status === "received").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending/Processing</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-pending-count">
              {disbursements.filter((d) => d.status === "pending" || d.status === "processing").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received Amount</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-amount">
              {formatCurrency(String(totalReceivedAmount))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Disbursements</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by customer, bank, or reference..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDisbursements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No loan disbursements found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Transaction Ref</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDisbursements.map((disbursement) => (
                    <TableRow key={disbursement.id} data-testid={`row-disbursement-${disbursement.id}`}>
                      <TableCell>
                        <div className="font-medium">{disbursement.customerName}</div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{disbursement.bankName}</div>
                          {disbursement.bankBranch && (
                            <div className="text-sm text-muted-foreground">{disbursement.bankBranch}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {disbursement.disbursementDate 
                            ? format(new Date(disbursement.disbursementDate), "dd MMM yyyy")
                            : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {disbursement.disbursementTime || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-4 w-4 text-muted-foreground" />
                          {formatCurrency(disbursement.disbursedAmount)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{disbursement.transactionReference || "-"}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(disbursement.status || "received")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleEdit(disbursement)}
                            data-testid={`button-edit-${disbursement.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this disbursement?")) {
                                deleteMutation.mutate(disbursement.id);
                              }
                            }}
                            data-testid={`button-delete-${disbursement.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Loan Disbursement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Link to Existing Approval (Optional)</Label>
              <Select
                value={formData.bankLoanApprovalId}
                onValueChange={handleApprovalSelect}
              >
                <SelectTrigger data-testid="select-approval">
                  <SelectValue placeholder="Select from approved loans" />
                </SelectTrigger>
                <SelectContent>
                  {approvals.filter(a => a.status === "approved").map((approval) => {
                    return (
                      <SelectItem key={approval.id} value={approval.id}>
                        {approval.customerName} - {approval.bankName} ({formatCurrency(approval.approvedAmount)})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Or Select Customer</Label>
              <Select
                value={formData.customerId}
                onValueChange={handleCustomerSelect}
              >
                <SelectTrigger data-testid="select-customer">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Enter customer name"
                data-testid="input-customer-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="State Bank of India"
                  data-testid="input-bank-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankBranch">Bank Branch</Label>
                <Input
                  id="bankBranch"
                  value={formData.bankBranch}
                  onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                  placeholder="Main Branch, Patna"
                  data-testid="input-bank-branch"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="disbursementDate">Disbursement Date *</Label>
                <Input
                  id="disbursementDate"
                  type="date"
                  value={formData.disbursementDate}
                  onChange={(e) => setFormData({ ...formData, disbursementDate: e.target.value })}
                  data-testid="input-disbursement-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="disbursementTime">Disbursement Time</Label>
                <Input
                  id="disbursementTime"
                  type="time"
                  value={formData.disbursementTime}
                  onChange={(e) => setFormData({ ...formData, disbursementTime: e.target.value })}
                  data-testid="input-disbursement-time"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="disbursedAmount">Disbursed Amount (INR) *</Label>
              <Input
                id="disbursedAmount"
                type="number"
                value={formData.disbursedAmount}
                onChange={(e) => setFormData({ ...formData, disbursedAmount: e.target.value })}
                placeholder="100000"
                data-testid="input-disbursed-amount"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transactionReference">Transaction Reference (UTR/NEFT/RTGS)</Label>
                <Input
                  id="transactionReference"
                  value={formData.transactionReference}
                  onChange={(e) => setFormData({ ...formData, transactionReference: e.target.value })}
                  placeholder="UTR123456789"
                  data-testid="input-transaction-reference"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="divyanshiBankAccount">Divyanshi Bank Account</Label>
                <Input
                  id="divyanshiBankAccount"
                  value={formData.divyanshiBankAccount}
                  onChange={(e) => setFormData({ ...formData, divyanshiBankAccount: e.target.value })}
                  placeholder="XXXX1234"
                  data-testid="input-divyanshi-account"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Any additional notes..."
                data-testid="input-remarks"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} data-testid="button-cancel-create">
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={createMutation.isPending}
              data-testid="button-submit-create"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Disbursement"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Loan Disbursement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-customerName">Customer Name *</Label>
              <Input
                id="edit-customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                data-testid="input-edit-customer-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-bankName">Bank Name *</Label>
                <Input
                  id="edit-bankName"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  data-testid="input-edit-bank-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-bankBranch">Bank Branch</Label>
                <Input
                  id="edit-bankBranch"
                  value={formData.bankBranch}
                  onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                  data-testid="input-edit-bank-branch"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-disbursementDate">Disbursement Date *</Label>
                <Input
                  id="edit-disbursementDate"
                  type="date"
                  value={formData.disbursementDate}
                  onChange={(e) => setFormData({ ...formData, disbursementDate: e.target.value })}
                  data-testid="input-edit-disbursement-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-disbursementTime">Disbursement Time</Label>
                <Input
                  id="edit-disbursementTime"
                  type="time"
                  value={formData.disbursementTime}
                  onChange={(e) => setFormData({ ...formData, disbursementTime: e.target.value })}
                  data-testid="input-edit-disbursement-time"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-disbursedAmount">Disbursed Amount (INR) *</Label>
              <Input
                id="edit-disbursedAmount"
                type="number"
                value={formData.disbursedAmount}
                onChange={(e) => setFormData({ ...formData, disbursedAmount: e.target.value })}
                data-testid="input-edit-disbursed-amount"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-transactionReference">Transaction Reference</Label>
                <Input
                  id="edit-transactionReference"
                  value={formData.transactionReference}
                  onChange={(e) => setFormData({ ...formData, transactionReference: e.target.value })}
                  data-testid="input-edit-transaction-reference"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-divyanshiBankAccount">Divyanshi Bank Account</Label>
                <Input
                  id="edit-divyanshiBankAccount"
                  value={formData.divyanshiBankAccount}
                  onChange={(e) => setFormData({ ...formData, divyanshiBankAccount: e.target.value })}
                  data-testid="input-edit-divyanshi-account"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger data-testid="select-edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {loanDisbursementStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-remarks">Remarks</Label>
              <Textarea
                id="edit-remarks"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                data-testid="input-edit-remarks"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} data-testid="button-cancel-update">
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate} 
              disabled={updateMutation.isPending}
              data-testid="button-submit-update"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Disbursement"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
