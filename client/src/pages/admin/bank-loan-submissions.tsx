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
  Landmark, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2,
  User,
  Phone,
  Building,
  Calendar,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import type { BankLoanSubmission, Customer, Vendor } from "@shared/schema";
import { bankLoanStatuses } from "@shared/schema";

export default function AdminBankLoanSubmissions() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<BankLoanSubmission | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    customerId: "",
    bankName: "",
    bankBranch: "",
    bankManagerName: "",
    bankManagerMobile: "",
    submissionDate: format(new Date(), "yyyy-MM-dd"),
    loanAmount: "",
    remarks: "",
    status: "submitted",
    bankVendorId: "",
  });

  const { data: submissions = [], isLoading } = useQuery<BankLoanSubmission[]>({
    queryKey: ["/api/admin/bank-loan-submissions"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  const { data: approvedVendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/admin/vendors/approved"],
  });

  const bankVendors = approvedVendors.filter(v => v.vendorType === "bank_loan_liaison");

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/admin/bank-loan-submissions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bank-loan-submissions"] });
      toast({ title: "Bank loan submission created successfully" });
      setIsAddOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create submission", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return await apiRequest("PATCH", `/api/admin/bank-loan-submissions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bank-loan-submissions"] });
      toast({ title: "Bank loan submission updated successfully" });
      setIsEditOpen(false);
      setSelectedSubmission(null);
    },
    onError: () => {
      toast({ title: "Failed to update submission", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/bank-loan-submissions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bank-loan-submissions"] });
      toast({ title: "Bank loan submission deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete submission", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      customerId: "",
      bankName: "",
      bankBranch: "",
      bankManagerName: "",
      bankManagerMobile: "",
      submissionDate: format(new Date(), "yyyy-MM-dd"),
      loanAmount: "",
      remarks: "",
      status: "submitted",
      bankVendorId: "",
    });
  };

  const handleEdit = (submission: BankLoanSubmission) => {
    setSelectedSubmission(submission);
    setFormData({
      customerId: submission.customerId,
      bankName: submission.bankName,
      bankBranch: submission.bankBranch,
      bankManagerName: submission.bankManagerName || "",
      bankManagerMobile: submission.bankManagerMobile || "",
      submissionDate: submission.submissionDate ? format(new Date(submission.submissionDate), "yyyy-MM-dd") : "",
      loanAmount: submission.loanAmount || "",
      remarks: submission.remarks || "",
      status: submission.status,
      bankVendorId: (submission as any).bankVendorId || "",
    });
    setIsEditOpen(true);
  };

  const handleCreate = () => {
    if (!formData.customerId || !formData.bankName || !formData.bankBranch || !formData.submissionDate) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedSubmission) return;
    updateMutation.mutate({
      id: selectedSubmission.id,
      data: formData,
    });
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer?.name || "Unknown Customer";
  };

  const getCustomerPhone = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer?.phone || "";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      submitted: { variant: "secondary", label: "Submitted" },
      processing: { variant: "outline", label: "Processing" },
      approved: { variant: "default", label: "Approved" },
      rejected: { variant: "destructive", label: "Rejected" },
      disbursed: { variant: "default", label: "Disbursed" },
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

  const filteredSubmissions = submissions.filter((submission) => {
    const customerName = getCustomerName(submission.customerId).toLowerCase();
    const bankName = submission.bankName.toLowerCase();
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
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Bank Loan Submissions</h1>
          <p className="text-muted-foreground">Track bank loan applications for customers</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} data-testid="button-add-submission">
          <Plus className="mr-2 h-4 w-4" />
          Add Submission
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-submissions">{submissions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-approved-count">
              {submissions.filter((s) => s.status === "approved" || s.status === "disbursed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <FileText className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-processing-count">
              {submissions.filter((s) => s.status === "submitted" || s.status === "processing").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <FileText className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-rejected-count">
              {submissions.filter((s) => s.status === "rejected").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Submissions</CardTitle>
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
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bank loan submissions found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead>Loan Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id} data-testid={`row-submission-${submission.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{getCustomerName(submission.customerId)}</div>
                          <div className="text-sm text-muted-foreground">{getCustomerPhone(submission.customerId)}</div>
                        </div>
                      </TableCell>
                      <TableCell>{submission.bankName}</TableCell>
                      <TableCell>{submission.bankBranch}</TableCell>
                      <TableCell>
                        {submission.bankManagerName ? (
                          <div>
                            <div className="font-medium">{submission.bankManagerName}</div>
                            {submission.bankManagerMobile && (
                              <div className="text-sm text-muted-foreground">{submission.bankManagerMobile}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.submissionDate 
                          ? format(new Date(submission.submissionDate), "dd MMM yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>{formatCurrency(submission.loanAmount)}</TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleEdit(submission)}
                            data-testid={`button-edit-${submission.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this submission?")) {
                                deleteMutation.mutate(submission.id);
                              }
                            }}
                            data-testid={`button-delete-${submission.id}`}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Bank Loan Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer *</Label>
              <Select
                value={formData.customerId}
                onValueChange={(value) => setFormData({ ...formData, customerId: value })}
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
                <Label htmlFor="bankBranch">Bank Branch *</Label>
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
                <Label htmlFor="bankManagerName">Bank Manager Name (Optional)</Label>
                <Input
                  id="bankManagerName"
                  value={formData.bankManagerName}
                  onChange={(e) => setFormData({ ...formData, bankManagerName: e.target.value })}
                  placeholder="Mr. Sharma"
                  data-testid="input-manager-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankManagerMobile">Manager Mobile (Optional)</Label>
                <Input
                  id="bankManagerMobile"
                  value={formData.bankManagerMobile}
                  onChange={(e) => setFormData({ ...formData, bankManagerMobile: e.target.value })}
                  placeholder="9876543210"
                  data-testid="input-manager-mobile"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="submissionDate">Submission Date *</Label>
                <Input
                  id="submissionDate"
                  type="date"
                  value={formData.submissionDate}
                  onChange={(e) => setFormData({ ...formData, submissionDate: e.target.value })}
                  data-testid="input-submission-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loanAmount">Loan Amount (Optional)</Label>
                <Input
                  id="loanAmount"
                  type="number"
                  value={formData.loanAmount}
                  onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                  placeholder="100000"
                  data-testid="input-loan-amount"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankVendor">Bank Loan Vendor</Label>
              <Select
                value={formData.bankVendorId}
                onValueChange={(value) => setFormData({ ...formData, bankVendorId: value })}
              >
                <SelectTrigger data-testid="select-bank-vendor">
                  <SelectValue placeholder="Select Bank Vendor..." />
                </SelectTrigger>
                <SelectContent>
                  {bankVendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      <div className="flex items-center gap-2">
                        <Landmark className="h-4 w-4 text-green-600" />
                        {vendor.vendorCode} - {vendor.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Assign bank vendor to facilitate loan application</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks (Optional)</Label>
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
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
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
                "Create Submission"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Bank Loan Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customer</Label>
              <div className="p-2 bg-muted rounded-md">
                {selectedSubmission && getCustomerName(selectedSubmission.customerId)}
              </div>
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
                <Label htmlFor="edit-bankBranch">Bank Branch *</Label>
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
                <Label htmlFor="edit-bankManagerName">Bank Manager Name</Label>
                <Input
                  id="edit-bankManagerName"
                  value={formData.bankManagerName}
                  onChange={(e) => setFormData({ ...formData, bankManagerName: e.target.value })}
                  data-testid="input-edit-manager-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-bankManagerMobile">Manager Mobile</Label>
                <Input
                  id="edit-bankManagerMobile"
                  value={formData.bankManagerMobile}
                  onChange={(e) => setFormData({ ...formData, bankManagerMobile: e.target.value })}
                  data-testid="input-edit-manager-mobile"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-submissionDate">Submission Date *</Label>
                <Input
                  id="edit-submissionDate"
                  type="date"
                  value={formData.submissionDate}
                  onChange={(e) => setFormData({ ...formData, submissionDate: e.target.value })}
                  data-testid="input-edit-submission-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-loanAmount">Loan Amount</Label>
                <Input
                  id="edit-loanAmount"
                  type="number"
                  value={formData.loanAmount}
                  onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                  data-testid="input-edit-loan-amount"
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
                  {bankLoanStatuses.map((status) => (
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
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
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
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
