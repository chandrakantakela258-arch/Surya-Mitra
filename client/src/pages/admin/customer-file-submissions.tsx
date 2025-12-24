import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  FileText, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2,
  User,
  Zap,
  Calendar,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import type { CustomerFileSubmission, Customer, Vendor } from "@shared/schema";
import { customerFileStatuses } from "@shared/schema";
import { Building2 } from "lucide-react";

export default function AdminCustomerFileSubmissions() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<CustomerFileSubmission | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    consumerNo: "",
    billHolderName: "",
    loanApplied: false,
    submissionDate: format(new Date(), "yyyy-MM-dd"),
    remarks: "",
    status: "submitted",
    discomVendorId: "",
  });

  const { data: submissions = [], isLoading } = useQuery<CustomerFileSubmission[]>({
    queryKey: ["/api/admin/customer-file-submissions"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  const { data: approvedVendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/admin/vendors/approved"],
  });

  const discomVendors = approvedVendors.filter(v => v.vendorType === "discom_net_metering");

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/admin/customer-file-submissions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customer-file-submissions"] });
      toast({ title: "Customer file submission created successfully" });
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
      return await apiRequest("PATCH", `/api/admin/customer-file-submissions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customer-file-submissions"] });
      toast({ title: "Customer file submission updated successfully" });
      setIsEditOpen(false);
      setSelectedSubmission(null);
    },
    onError: () => {
      toast({ title: "Failed to update submission", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/customer-file-submissions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customer-file-submissions"] });
      toast({ title: "Customer file submission deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete submission", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      customerId: "",
      customerName: "",
      consumerNo: "",
      billHolderName: "",
      loanApplied: false,
      submissionDate: format(new Date(), "yyyy-MM-dd"),
      remarks: "",
      status: "submitted",
      discomVendorId: "",
    });
  };

  const handleEdit = (submission: CustomerFileSubmission) => {
    setSelectedSubmission(submission);
    setFormData({
      customerId: submission.customerId || "",
      customerName: submission.customerName,
      consumerNo: submission.consumerNo,
      billHolderName: submission.billHolderName,
      loanApplied: submission.loanApplied || false,
      submissionDate: submission.submissionDate ? format(new Date(submission.submissionDate), "yyyy-MM-dd") : "",
      remarks: submission.remarks || "",
      status: submission.status || "submitted",
      discomVendorId: (submission as any).discomVendorId || "",
    });
    setIsEditOpen(true);
  };

  const handleCreate = () => {
    if (!formData.customerName || !formData.consumerNo || !formData.billHolderName || !formData.submissionDate) {
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

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    setFormData((prev) => ({
      ...prev,
      customerId,
      customerName: customer ? customer.name : prev.customerName,
    }));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      submitted: { variant: "secondary", label: "Submitted" },
      under_review: { variant: "outline", label: "Under Review" },
      approved: { variant: "default", label: "Approved" },
      rejected: { variant: "destructive", label: "Rejected" },
      resubmission_required: { variant: "destructive", label: "Resubmission Required" },
    };
    const config = statusConfig[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredSubmissions = submissions.filter((submission) => {
    const customerName = submission.customerName.toLowerCase();
    const consumerNo = submission.consumerNo.toLowerCase();
    const query = searchQuery.toLowerCase();
    return customerName.includes(query) || consumerNo.includes(query);
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
          <h1 className="text-2xl font-bold" data-testid="text-page-title">PM Surya Ghar File Submissions</h1>
          <p className="text-muted-foreground">Step 1 of Customer Journey - Track customer file submissions</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} data-testid="button-add-submission">
          <Plus className="mr-2 h-4 w-4" />
          Add Submission
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Submissions ({filteredSubmissions.length})
          </CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by customer or consumer no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No customer file submissions found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Consumer No.</TableHead>
                    <TableHead>Bill Holder Name</TableHead>
                    <TableHead>Loan Applied</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id} data-testid={`row-submission-${submission.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{submission.customerName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-muted-foreground" />
                          <span>{submission.consumerNo}</span>
                        </div>
                      </TableCell>
                      <TableCell>{submission.billHolderName}</TableCell>
                      <TableCell>
                        {submission.loanApplied ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {submission.submissionDate
                            ? format(new Date(submission.submissionDate), "dd MMM yyyy")
                            : "-"}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(submission.status || "submitted")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(submission)}
                            data-testid={`button-edit-${submission.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(submission.id)}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Customer File Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Link to Customer (Optional)</Label>
              <Select
                value={formData.customerId}
                onValueChange={handleCustomerSelect}
              >
                <SelectTrigger data-testid="select-customer">
                  <SelectValue placeholder="Select customer..." />
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
              <Label>Customer Name *</Label>
              <Input
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Enter customer name"
                data-testid="input-customer-name"
              />
            </div>

            <div className="space-y-2">
              <Label>Consumer No. *</Label>
              <Input
                value={formData.consumerNo}
                onChange={(e) => setFormData({ ...formData, consumerNo: e.target.value })}
                placeholder="Enter electricity consumer number"
                data-testid="input-consumer-no"
              />
            </div>

            <div className="space-y-2">
              <Label>Electricity Bill Holder Name *</Label>
              <Input
                value={formData.billHolderName}
                onChange={(e) => setFormData({ ...formData, billHolderName: e.target.value })}
                placeholder="Enter bill holder name"
                data-testid="input-bill-holder-name"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="loanApplied"
                checked={formData.loanApplied}
                onCheckedChange={(checked) => setFormData({ ...formData, loanApplied: !!checked })}
                data-testid="checkbox-loan-applied"
              />
              <Label htmlFor="loanApplied">Loan Applied</Label>
            </div>

            <div className="space-y-2">
              <Label>Submission Date *</Label>
              <Input
                type="date"
                value={formData.submissionDate}
                onChange={(e) => setFormData({ ...formData, submissionDate: e.target.value })}
                data-testid="input-submission-date"
              />
            </div>

            <div className="space-y-2">
              <Label>DISCOM Vendor (Site Survey)</Label>
              <Select
                value={formData.discomVendorId}
                onValueChange={(value) => setFormData({ ...formData, discomVendorId: value })}
              >
                <SelectTrigger data-testid="select-discom-vendor">
                  <SelectValue placeholder="Select DISCOM Vendor..." />
                </SelectTrigger>
                <SelectContent>
                  {discomVendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        {vendor.vendorCode} - {vendor.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Assign DISCOM vendor to expedite site survey</p>
            </div>

            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Add any notes..."
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
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Customer File Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Enter customer name"
                data-testid="input-edit-customer-name"
              />
            </div>

            <div className="space-y-2">
              <Label>Consumer No. *</Label>
              <Input
                value={formData.consumerNo}
                onChange={(e) => setFormData({ ...formData, consumerNo: e.target.value })}
                placeholder="Enter electricity consumer number"
                data-testid="input-edit-consumer-no"
              />
            </div>

            <div className="space-y-2">
              <Label>Electricity Bill Holder Name *</Label>
              <Input
                value={formData.billHolderName}
                onChange={(e) => setFormData({ ...formData, billHolderName: e.target.value })}
                placeholder="Enter bill holder name"
                data-testid="input-edit-bill-holder-name"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="loanAppliedEdit"
                checked={formData.loanApplied}
                onCheckedChange={(checked) => setFormData({ ...formData, loanApplied: !!checked })}
                data-testid="checkbox-edit-loan-applied"
              />
              <Label htmlFor="loanAppliedEdit">Loan Applied</Label>
            </div>

            <div className="space-y-2">
              <Label>Submission Date *</Label>
              <Input
                type="date"
                value={formData.submissionDate}
                onChange={(e) => setFormData({ ...formData, submissionDate: e.target.value })}
                data-testid="input-edit-submission-date"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger data-testid="select-edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {customerFileStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Add any notes..."
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
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
