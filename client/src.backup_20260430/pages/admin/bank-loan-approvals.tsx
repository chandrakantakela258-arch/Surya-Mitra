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
  CheckCircle, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2,
  Clock,
  Calendar,
  IndianRupee
} from "lucide-react";
import { format } from "date-fns";
import type { BankLoanApproval, Customer, BankLoanSubmission } from "@shared/schema";
import { bankLoanApprovalStatuses } from "@shared/schema";

export default function AdminBankLoanApprovals() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<BankLoanApproval | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    customerId: "",
    bankLoanSubmissionId: "",
    customerName: "",
    bankName: "",
    bankBranch: "",
    approvalDate: format(new Date(), "yyyy-MM-dd"),
    approvalTime: "",
    approvedAmount: "",
    interestRate: "",
    loanTenure: "",
    remarks: "",
    status: "approved",
  });

  const { data: approvals = [], isLoading } = useQuery<BankLoanApproval[]>({
    queryKey: ["/api/admin/bank-loan-approvals"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  const { data: submissions = [] } = useQuery<BankLoanSubmission[]>({
    queryKey: ["/api/admin/bank-loan-submissions"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/admin/bank-loan-approvals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bank-loan-approvals"] });
      toast({ title: "Bank loan approval created successfully" });
      setIsAddOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create approval", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return await apiRequest("PATCH", `/api/admin/bank-loan-approvals/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bank-loan-approvals"] });
      toast({ title: "Bank loan approval updated successfully" });
      setIsEditOpen(false);
      setSelectedApproval(null);
    },
    onError: () => {
      toast({ title: "Failed to update approval", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/bank-loan-approvals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bank-loan-approvals"] });
      toast({ title: "Bank loan approval deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete approval", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      customerId: "",
      bankLoanSubmissionId: "",
      customerName: "",
      bankName: "",
      bankBranch: "",
      approvalDate: format(new Date(), "yyyy-MM-dd"),
      approvalTime: "",
      approvedAmount: "",
      interestRate: "",
      loanTenure: "",
      remarks: "",
      status: "approved",
    });
  };

  const handleEdit = (approval: BankLoanApproval) => {
    setSelectedApproval(approval);
    setFormData({
      customerId: approval.customerId || "",
      bankLoanSubmissionId: approval.bankLoanSubmissionId || "",
      customerName: approval.customerName,
      bankName: approval.bankName,
      bankBranch: approval.bankBranch || "",
      approvalDate: approval.approvalDate ? format(new Date(approval.approvalDate), "yyyy-MM-dd") : "",
      approvalTime: approval.approvalTime || "",
      approvedAmount: approval.approvedAmount || "",
      interestRate: approval.interestRate || "",
      loanTenure: approval.loanTenure?.toString() || "",
      remarks: approval.remarks || "",
      status: approval.status || "approved",
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

  const handleSubmissionSelect = (submissionId: string) => {
    const submission = submissions.find((s) => s.id === submissionId);
    if (submission) {
      const customer = customers.find((c) => c.id === submission.customerId);
      setFormData(prev => ({
        ...prev,
        bankLoanSubmissionId: submissionId,
        customerId: submission.customerId,
        customerName: customer?.name || "",
        bankName: submission.bankName,
        bankBranch: submission.bankBranch,
      }));
    }
  };

  const handleCreate = () => {
    if (!formData.customerName || !formData.bankName || !formData.approvalDate) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedApproval) return;
    updateMutation.mutate({
      id: selectedApproval.id,
      data: formData,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      approved: { variant: "default", label: "Approved" },
      conditionally_approved: { variant: "outline", label: "Conditionally Approved" },
      rejected: { variant: "destructive", label: "Rejected" },
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

  const filteredApprovals = approvals.filter((approval) => {
    const customerName = approval.customerName.toLowerCase();
    const bankName = approval.bankName.toLowerCase();
    const query = searchQuery.toLowerCase();
    return customerName.includes(query) || bankName.includes(query);
  });

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
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Bank Loan Approvals</h1>
          <p className="text-muted-foreground">Track bank loan approval dates and times (Step 3)</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} data-testid="button-add-approval">
          <Plus className="mr-2 h-4 w-4" />
          Add Approval
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Approvals</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-approvals">{approvals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-approved-count">
              {approvals.filter((a) => a.status === "approved").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conditionally Approved</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-conditional-count">
              {approvals.filter((a) => a.status === "conditionally_approved" || a.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <CheckCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-rejected-count">
              {approvals.filter((a) => a.status === "rejected").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Approvals</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by customer or bank..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredApprovals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bank loan approvals found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Approval Date</TableHead>
                    <TableHead>Approval Time</TableHead>
                    <TableHead>Approved Amount</TableHead>
                    <TableHead>Interest Rate</TableHead>
                    <TableHead>Tenure</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApprovals.map((approval) => (
                    <TableRow key={approval.id} data-testid={`row-approval-${approval.id}`}>
                      <TableCell>
                        <div className="font-medium">{approval.customerName}</div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{approval.bankName}</div>
                          {approval.bankBranch && (
                            <div className="text-sm text-muted-foreground">{approval.bankBranch}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {approval.approvalDate 
                            ? format(new Date(approval.approvalDate), "dd MMM yyyy")
                            : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {approval.approvalTime || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-4 w-4 text-muted-foreground" />
                          {formatCurrency(approval.approvedAmount)}
                        </div>
                      </TableCell>
                      <TableCell>{approval.interestRate ? `${approval.interestRate}%` : "-"}</TableCell>
                      <TableCell>{approval.loanTenure ? `${approval.loanTenure} months` : "-"}</TableCell>
                      <TableCell>{getStatusBadge(approval.status || "approved")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleEdit(approval)}
                            data-testid={`button-edit-${approval.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this approval?")) {
                                deleteMutation.mutate(approval.id);
                              }
                            }}
                            data-testid={`button-delete-${approval.id}`}
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
            <DialogTitle>Add Bank Loan Approval</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Link to Existing Submission (Optional)</Label>
              <Select
                value={formData.bankLoanSubmissionId}
                onValueChange={handleSubmissionSelect}
              >
                <SelectTrigger data-testid="select-submission">
                  <SelectValue placeholder="Select from existing submissions" />
                </SelectTrigger>
                <SelectContent>
                  {submissions.filter(s => s.status === "approved" || s.status === "processing").map((submission) => {
                    const customer = customers.find((c) => c.id === submission.customerId);
                    return (
                      <SelectItem key={submission.id} value={submission.id}>
                        {customer?.name || "Unknown"} - {submission.bankName}
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
                <Label htmlFor="approvalDate">Approval Date *</Label>
                <Input
                  id="approvalDate"
                  type="date"
                  value={formData.approvalDate}
                  onChange={(e) => setFormData({ ...formData, approvalDate: e.target.value })}
                  data-testid="input-approval-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="approvalTime">Approval Time</Label>
                <Input
                  id="approvalTime"
                  type="time"
                  value={formData.approvalTime}
                  onChange={(e) => setFormData({ ...formData, approvalTime: e.target.value })}
                  data-testid="input-approval-time"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="approvedAmount">Approved Amount</Label>
                <Input
                  id="approvedAmount"
                  type="number"
                  value={formData.approvedAmount}
                  onChange={(e) => setFormData({ ...formData, approvedAmount: e.target.value })}
                  placeholder="100000"
                  data-testid="input-approved-amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interestRate">Interest Rate (%)</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                  placeholder="8.5"
                  data-testid="input-interest-rate"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loanTenure">Tenure (months)</Label>
                <Input
                  id="loanTenure"
                  type="number"
                  value={formData.loanTenure}
                  onChange={(e) => setFormData({ ...formData, loanTenure: e.target.value })}
                  placeholder="60"
                  data-testid="input-loan-tenure"
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
                "Create Approval"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Bank Loan Approval</DialogTitle>
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
                <Label htmlFor="edit-approvalDate">Approval Date *</Label>
                <Input
                  id="edit-approvalDate"
                  type="date"
                  value={formData.approvalDate}
                  onChange={(e) => setFormData({ ...formData, approvalDate: e.target.value })}
                  data-testid="input-edit-approval-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-approvalTime">Approval Time</Label>
                <Input
                  id="edit-approvalTime"
                  type="time"
                  value={formData.approvalTime}
                  onChange={(e) => setFormData({ ...formData, approvalTime: e.target.value })}
                  data-testid="input-edit-approval-time"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-approvedAmount">Approved Amount</Label>
                <Input
                  id="edit-approvedAmount"
                  type="number"
                  value={formData.approvedAmount}
                  onChange={(e) => setFormData({ ...formData, approvedAmount: e.target.value })}
                  data-testid="input-edit-approved-amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-interestRate">Interest Rate (%)</Label>
                <Input
                  id="edit-interestRate"
                  type="number"
                  step="0.01"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                  data-testid="input-edit-interest-rate"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-loanTenure">Tenure (months)</Label>
                <Input
                  id="edit-loanTenure"
                  type="number"
                  value={formData.loanTenure}
                  onChange={(e) => setFormData({ ...formData, loanTenure: e.target.value })}
                  data-testid="input-edit-loan-tenure"
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
                  {bankLoanApprovalStatuses.map((status) => (
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
                "Update Approval"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
