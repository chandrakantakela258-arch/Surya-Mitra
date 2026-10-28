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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Wallet, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2,
  User,
  Phone,
  Calendar,
  IndianRupee,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import type { RemainingPaymentReport, Customer, PortalSubmissionReport } from "@shared/schema";

const reportStatuses = [
  { value: "pending", label: "Pending" },
  { value: "reminder_sent", label: "Reminder Sent" },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "waived", label: "Waived" },
];

const paymentModes = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "neft", label: "NEFT" },
  { value: "rtgs", label: "RTGS" },
  { value: "cheque", label: "Cheque" },
  { value: "razorpay", label: "Razorpay" },
];

const panelTypes = [
  { value: "DCR", label: "DCR (Domestic Content Requirement)" },
  { value: "Non-DCR", label: "Non-DCR" },
];

export default function AdminRemainingPaymentReports() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<RemainingPaymentReport | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    siteAddress: "",
    district: "",
    state: "",
    pincode: "",
    installedCapacity: "",
    panelType: "",
    consumerNumber: "",
    discomName: "",
    portalSubmissionReportId: "",
    portalApplicationNumber: "",
    completionDate: "",
    subsidyReceivedDate: "",
    subsidyAmount: "",
    totalSystemCost: "",
    advancePaymentReceived: "",
    advancePaymentDate: "",
    subsidyAdjusted: "",
    remainingPaymentAmount: "",
    remainingPaymentDueDate: "",
    paymentReminderSent: false,
    reminderSentDate: "",
    reminderCount: "0",
    paymentMode: "",
    paymentReferenceNumber: "",
    paymentReceivedDate: "",
    paymentReceivedAmount: "",
    paymentReceiptNumber: "",
    paymentReceiptUrl: "",
    isPartialPayment: false,
    partialPayments: "",
    totalReceivedTillDate: "",
    balanceAmount: "",
    status: "pending",
    daysOverdue: "0",
    lastFollowUpDate: "",
    nextFollowUpDate: "",
    followUpRemarks: "",
    commissionHeld: true,
    commissionReleaseDate: "",
    ddpCommissionAmount: "",
    bdpCommissionAmount: "",
    customerFeedback: "",
    escalationRequired: false,
    escalationReason: "",
    remarks: "",
  });

  const { data: reports = [], isLoading } = useQuery<RemainingPaymentReport[]>({
    queryKey: ["/api/admin/remaining-payment-reports"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  const { data: portalReports = [] } = useQuery<PortalSubmissionReport[]>({
    queryKey: ["/api/admin/portal-submission-reports"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/admin/remaining-payment-reports", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/remaining-payment-reports"] });
      toast({ title: "Remaining payment report created successfully" });
      setIsAddOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Failed to create report", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return await apiRequest("PATCH", `/api/admin/remaining-payment-reports/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/remaining-payment-reports"] });
      toast({ title: "Remaining payment report updated successfully" });
      setIsEditOpen(false);
      setSelectedReport(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update report", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/remaining-payment-reports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/remaining-payment-reports"] });
      toast({ title: "Report deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete report", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      customerId: "",
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      siteAddress: "",
      district: "",
      state: "",
      pincode: "",
      installedCapacity: "",
      panelType: "",
      consumerNumber: "",
      discomName: "",
      portalSubmissionReportId: "",
      portalApplicationNumber: "",
      completionDate: "",
      subsidyReceivedDate: "",
      subsidyAmount: "",
      totalSystemCost: "",
      advancePaymentReceived: "",
      advancePaymentDate: "",
      subsidyAdjusted: "",
      remainingPaymentAmount: "",
      remainingPaymentDueDate: "",
      paymentReminderSent: false,
      reminderSentDate: "",
      reminderCount: "0",
      paymentMode: "",
      paymentReferenceNumber: "",
      paymentReceivedDate: "",
      paymentReceivedAmount: "",
      paymentReceiptNumber: "",
      paymentReceiptUrl: "",
      isPartialPayment: false,
      partialPayments: "",
      totalReceivedTillDate: "",
      balanceAmount: "",
      status: "pending",
      daysOverdue: "0",
      lastFollowUpDate: "",
      nextFollowUpDate: "",
      followUpRemarks: "",
      commissionHeld: true,
      commissionReleaseDate: "",
      ddpCommissionAmount: "",
      bdpCommissionAmount: "",
      customerFeedback: "",
      escalationRequired: false,
      escalationReason: "",
      remarks: "",
    });
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email || "",
        siteAddress: customer.address || "",
        district: customer.district || "",
        state: customer.state || "",
        pincode: customer.pincode || "",
        installedCapacity: customer.proposedCapacity || "",
        panelType: customer.panelType || "",
        consumerNumber: customer.consumerNumber || "",
      }));
    }
  };

  const handlePortalReportSelect = (reportId: string) => {
    const report = portalReports.find(r => r.id === reportId);
    if (report) {
      setFormData(prev => ({
        ...prev,
        portalSubmissionReportId: reportId,
        portalApplicationNumber: report.portalApplicationNumber || "",
        discomName: report.discomName || "",
        subsidyAmount: report.totalSubsidyClaimed?.toString() || "",
      }));
    }
  };

  const handleEdit = (report: RemainingPaymentReport) => {
    setSelectedReport(report);
    setFormData({
      customerId: report.customerId || "",
      customerName: report.customerName || "",
      customerPhone: report.customerPhone || "",
      customerEmail: report.customerEmail || "",
      siteAddress: report.siteAddress || "",
      district: report.district || "",
      state: report.state || "",
      pincode: report.pincode || "",
      installedCapacity: report.installedCapacity || "",
      panelType: report.panelType || "",
      consumerNumber: report.consumerNumber || "",
      discomName: report.discomName || "",
      portalSubmissionReportId: report.portalSubmissionReportId || "",
      portalApplicationNumber: report.portalApplicationNumber || "",
      completionDate: report.completionDate ? format(new Date(report.completionDate), "yyyy-MM-dd") : "",
      subsidyReceivedDate: report.subsidyReceivedDate ? format(new Date(report.subsidyReceivedDate), "yyyy-MM-dd") : "",
      subsidyAmount: report.subsidyAmount?.toString() || "",
      totalSystemCost: report.totalSystemCost?.toString() || "",
      advancePaymentReceived: report.advancePaymentReceived?.toString() || "",
      advancePaymentDate: report.advancePaymentDate ? format(new Date(report.advancePaymentDate), "yyyy-MM-dd") : "",
      subsidyAdjusted: report.subsidyAdjusted?.toString() || "",
      remainingPaymentAmount: report.remainingPaymentAmount?.toString() || "",
      remainingPaymentDueDate: report.remainingPaymentDueDate ? format(new Date(report.remainingPaymentDueDate), "yyyy-MM-dd") : "",
      paymentReminderSent: report.paymentReminderSent ?? false,
      reminderSentDate: report.reminderSentDate ? format(new Date(report.reminderSentDate), "yyyy-MM-dd") : "",
      reminderCount: report.reminderCount?.toString() || "0",
      paymentMode: report.paymentMode || "",
      paymentReferenceNumber: report.paymentReferenceNumber || "",
      paymentReceivedDate: report.paymentReceivedDate ? format(new Date(report.paymentReceivedDate), "yyyy-MM-dd") : "",
      paymentReceivedAmount: report.paymentReceivedAmount?.toString() || "",
      paymentReceiptNumber: report.paymentReceiptNumber || "",
      paymentReceiptUrl: report.paymentReceiptUrl || "",
      isPartialPayment: report.isPartialPayment ?? false,
      partialPayments: report.partialPayments || "",
      totalReceivedTillDate: report.totalReceivedTillDate?.toString() || "",
      balanceAmount: report.balanceAmount?.toString() || "",
      status: report.status || "pending",
      daysOverdue: report.daysOverdue?.toString() || "0",
      lastFollowUpDate: report.lastFollowUpDate ? format(new Date(report.lastFollowUpDate), "yyyy-MM-dd") : "",
      nextFollowUpDate: report.nextFollowUpDate ? format(new Date(report.nextFollowUpDate), "yyyy-MM-dd") : "",
      followUpRemarks: report.followUpRemarks || "",
      commissionHeld: report.commissionHeld ?? true,
      commissionReleaseDate: report.commissionReleaseDate ? format(new Date(report.commissionReleaseDate), "yyyy-MM-dd") : "",
      ddpCommissionAmount: report.ddpCommissionAmount?.toString() || "",
      bdpCommissionAmount: report.bdpCommissionAmount?.toString() || "",
      customerFeedback: report.customerFeedback || "",
      escalationRequired: report.escalationRequired ?? false,
      escalationReason: report.escalationReason || "",
      remarks: report.remarks || "",
    });
    setIsEditOpen(true);
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reportNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.portalApplicationNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.district?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string | null) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "outline", label: "Pending" },
      reminder_sent: { variant: "secondary", label: "Reminder Sent" },
      partially_paid: { variant: "secondary", label: "Partially Paid" },
      paid: { variant: "default", label: "Paid" },
      overdue: { variant: "destructive", label: "Overdue" },
      waived: { variant: "outline", label: "Waived" },
    };
    const config = statusConfig[status || "pending"] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const overdueCount = reports.filter(r => r.status === 'overdue' || (r.remainingPaymentDueDate && new Date(r.remainingPaymentDueDate) < new Date() && r.status === 'pending')).length;
  const pendingAmount = reports.filter(r => r.status !== 'paid' && r.status !== 'waived').reduce((sum, r) => sum + (r.remainingPaymentAmount || 0), 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Wallet className="h-6 w-6" />
            Remaining Payment Tracking
          </h1>
          <p className="text-muted-foreground">Step 12: Track customer remaining payments after portal submission</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} data-testid="button-add-report">
          <Plus className="h-4 w-4 mr-2" />
          New Payment Record
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold">{reports.filter(r => r.status === 'pending').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">{overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <IndianRupee className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Amount</p>
                <p className="text-2xl font-bold">{pendingAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer name, report number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {reportStatuses.map(status => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No remaining payment reports found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map(report => (
                    <TableRow key={report.id} data-testid={`row-report-${report.id}`}>
                      <TableCell className="font-medium">{report.reportNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{report.customerName}</div>
                            <div className="text-sm text-muted-foreground">{report.district}, {report.state}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {report.totalSystemCost ? (
                          <span className="flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" />
                            {report.totalSystemCost.toLocaleString()}
                          </span>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {report.remainingPaymentAmount ? (
                          <span className="flex items-center gap-1 font-medium text-orange-600">
                            <IndianRupee className="h-3 w-3" />
                            {report.remainingPaymentAmount.toLocaleString()}
                          </span>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {report.remainingPaymentDueDate ? (
                          <span className={new Date(report.remainingPaymentDueDate) < new Date() ? "text-red-600 font-medium" : ""}>
                            {format(new Date(report.remainingPaymentDueDate), "dd MMM yyyy")}
                          </span>
                        ) : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(report)} data-testid={`button-edit-${report.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this report?")) {
                                deleteMutation.mutate(report.id);
                              }
                            }}
                            data-testid={`button-delete-${report.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Remaining Payment Record</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="customer">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="cost">Cost Details</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="commission">Commission</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
            </TabsList>
            
            <TabsContent value="customer" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Select Customer</Label>
                  <Select value={formData.customerId} onValueChange={handleCustomerSelect}>
                    <SelectTrigger data-testid="select-customer">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>{customer.name} - {customer.phone}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Customer Name</Label>
                  <Input value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} data-testid="input-customer-name" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={formData.customerPhone} onChange={(e) => setFormData({...formData, customerPhone: e.target.value})} data-testid="input-customer-phone" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={formData.customerEmail} onChange={(e) => setFormData({...formData, customerEmail: e.target.value})} data-testid="input-customer-email" />
                </div>
                <div>
                  <Label>Consumer Number</Label>
                  <Input value={formData.consumerNumber} onChange={(e) => setFormData({...formData, consumerNumber: e.target.value})} data-testid="input-consumer-number" />
                </div>
                <div className="col-span-2">
                  <Label>Site Address</Label>
                  <Input value={formData.siteAddress} onChange={(e) => setFormData({...formData, siteAddress: e.target.value})} data-testid="input-site-address" />
                </div>
                <div>
                  <Label>District</Label>
                  <Input value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})} data-testid="input-district" />
                </div>
                <div>
                  <Label>State</Label>
                  <Input value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} data-testid="input-state" />
                </div>
                <div>
                  <Label>Installed Capacity (kW)</Label>
                  <Input value={formData.installedCapacity} onChange={(e) => setFormData({...formData, installedCapacity: e.target.value})} data-testid="input-installed-capacity" />
                </div>
                <div>
                  <Label>Panel Type</Label>
                  <Select value={formData.panelType} onValueChange={(v) => setFormData({...formData, panelType: v})}>
                    <SelectTrigger data-testid="select-panel-type">
                      <SelectValue placeholder="Select panel type" />
                    </SelectTrigger>
                    <SelectContent>
                      {panelTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Link to Portal Submission</Label>
                  <Select value={formData.portalSubmissionReportId} onValueChange={handlePortalReportSelect}>
                    <SelectTrigger data-testid="select-portal-report">
                      <SelectValue placeholder="Select portal submission report" />
                    </SelectTrigger>
                    <SelectContent>
                      {portalReports.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.reportNumber} - {r.customerName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="cost" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Total System Cost (Rs)</Label>
                  <Input type="number" value={formData.totalSystemCost} onChange={(e) => setFormData({...formData, totalSystemCost: e.target.value})} data-testid="input-total-cost" />
                </div>
                <div>
                  <Label>Advance Payment Received (Rs)</Label>
                  <Input type="number" value={formData.advancePaymentReceived} onChange={(e) => setFormData({...formData, advancePaymentReceived: e.target.value})} data-testid="input-advance-payment" />
                </div>
                <div>
                  <Label>Advance Payment Date</Label>
                  <Input type="date" value={formData.advancePaymentDate} onChange={(e) => setFormData({...formData, advancePaymentDate: e.target.value})} data-testid="input-advance-date" />
                </div>
                <div>
                  <Label>Subsidy Amount (Rs)</Label>
                  <Input type="number" value={formData.subsidyAmount} onChange={(e) => setFormData({...formData, subsidyAmount: e.target.value})} data-testid="input-subsidy-amount" />
                </div>
                <div>
                  <Label>Subsidy Received Date</Label>
                  <Input type="date" value={formData.subsidyReceivedDate} onChange={(e) => setFormData({...formData, subsidyReceivedDate: e.target.value})} data-testid="input-subsidy-date" />
                </div>
                <div>
                  <Label>Subsidy Adjusted (Rs)</Label>
                  <Input type="number" value={formData.subsidyAdjusted} onChange={(e) => setFormData({...formData, subsidyAdjusted: e.target.value})} data-testid="input-subsidy-adjusted" />
                </div>
                <div>
                  <Label>Remaining Payment Amount (Rs)</Label>
                  <Input type="number" value={formData.remainingPaymentAmount} onChange={(e) => setFormData({...formData, remainingPaymentAmount: e.target.value})} data-testid="input-remaining-amount" />
                </div>
                <div>
                  <Label>Remaining Payment Due Date</Label>
                  <Input type="date" value={formData.remainingPaymentDueDate} onChange={(e) => setFormData({...formData, remainingPaymentDueDate: e.target.value})} data-testid="input-due-date" />
                </div>
                <div>
                  <Label>Completion Date</Label>
                  <Input type="date" value={formData.completionDate} onChange={(e) => setFormData({...formData, completionDate: e.target.value})} data-testid="input-completion-date" />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="payment" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 flex items-center gap-2">
                  <Checkbox 
                    checked={formData.paymentReminderSent} 
                    onCheckedChange={(checked) => setFormData({...formData, paymentReminderSent: !!checked})}
                    data-testid="checkbox-reminder-sent"
                  />
                  <Label>Payment Reminder Sent</Label>
                </div>
                <div>
                  <Label>Reminder Sent Date</Label>
                  <Input type="date" value={formData.reminderSentDate} onChange={(e) => setFormData({...formData, reminderSentDate: e.target.value})} data-testid="input-reminder-date" />
                </div>
                <div>
                  <Label>Reminder Count</Label>
                  <Input type="number" value={formData.reminderCount} onChange={(e) => setFormData({...formData, reminderCount: e.target.value})} data-testid="input-reminder-count" />
                </div>
                <div className="col-span-2 border-t pt-4 mt-2">
                  <h4 className="font-semibold mb-3">Payment Collection</h4>
                </div>
                <div>
                  <Label>Payment Mode</Label>
                  <Select value={formData.paymentMode} onValueChange={(v) => setFormData({...formData, paymentMode: v})}>
                    <SelectTrigger data-testid="select-payment-mode">
                      <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentModes.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Payment Reference Number</Label>
                  <Input value={formData.paymentReferenceNumber} onChange={(e) => setFormData({...formData, paymentReferenceNumber: e.target.value})} data-testid="input-payment-ref" />
                </div>
                <div>
                  <Label>Payment Received Date</Label>
                  <Input type="date" value={formData.paymentReceivedDate} onChange={(e) => setFormData({...formData, paymentReceivedDate: e.target.value})} data-testid="input-payment-received-date" />
                </div>
                <div>
                  <Label>Payment Received Amount (Rs)</Label>
                  <Input type="number" value={formData.paymentReceivedAmount} onChange={(e) => setFormData({...formData, paymentReceivedAmount: e.target.value})} data-testid="input-payment-amount" />
                </div>
                <div>
                  <Label>Receipt Number</Label>
                  <Input value={formData.paymentReceiptNumber} onChange={(e) => setFormData({...formData, paymentReceiptNumber: e.target.value})} data-testid="input-receipt-number" />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Checkbox 
                    checked={formData.isPartialPayment} 
                    onCheckedChange={(checked) => setFormData({...formData, isPartialPayment: !!checked})}
                    data-testid="checkbox-partial-payment"
                  />
                  <Label>Partial Payment</Label>
                </div>
                <div>
                  <Label>Total Received Till Date (Rs)</Label>
                  <Input type="number" value={formData.totalReceivedTillDate} onChange={(e) => setFormData({...formData, totalReceivedTillDate: e.target.value})} data-testid="input-total-received" />
                </div>
                <div>
                  <Label>Balance Amount (Rs)</Label>
                  <Input type="number" value={formData.balanceAmount} onChange={(e) => setFormData({...formData, balanceAmount: e.target.value})} data-testid="input-balance" />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="commission" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 flex items-center gap-2">
                  <Checkbox 
                    checked={formData.commissionHeld} 
                    onCheckedChange={(checked) => setFormData({...formData, commissionHeld: !!checked})}
                    data-testid="checkbox-commission-held"
                  />
                  <Label>Commission Held (pending payment collection)</Label>
                </div>
                <div>
                  <Label>DDP Commission Amount (Rs)</Label>
                  <Input type="number" value={formData.ddpCommissionAmount} onChange={(e) => setFormData({...formData, ddpCommissionAmount: e.target.value})} data-testid="input-ddp-commission" />
                </div>
                <div>
                  <Label>BDP Commission Amount (Rs)</Label>
                  <Input type="number" value={formData.bdpCommissionAmount} onChange={(e) => setFormData({...formData, bdpCommissionAmount: e.target.value})} data-testid="input-bdp-commission" />
                </div>
                <div>
                  <Label>Commission Release Date</Label>
                  <Input type="date" value={formData.commissionReleaseDate} onChange={(e) => setFormData({...formData, commissionReleaseDate: e.target.value})} data-testid="input-commission-release-date" />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="status" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportStatuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Days Overdue</Label>
                  <Input type="number" value={formData.daysOverdue} onChange={(e) => setFormData({...formData, daysOverdue: e.target.value})} data-testid="input-days-overdue" />
                </div>
                <div className="col-span-2 border-t pt-4 mt-2">
                  <h4 className="font-semibold mb-3">Follow-up</h4>
                </div>
                <div>
                  <Label>Last Follow-up Date</Label>
                  <Input type="date" value={formData.lastFollowUpDate} onChange={(e) => setFormData({...formData, lastFollowUpDate: e.target.value})} data-testid="input-last-followup" />
                </div>
                <div>
                  <Label>Next Follow-up Date</Label>
                  <Input type="date" value={formData.nextFollowUpDate} onChange={(e) => setFormData({...formData, nextFollowUpDate: e.target.value})} data-testid="input-next-followup" />
                </div>
                <div className="col-span-2">
                  <Label>Follow-up Remarks</Label>
                  <Textarea value={formData.followUpRemarks} onChange={(e) => setFormData({...formData, followUpRemarks: e.target.value})} data-testid="input-followup-remarks" />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Checkbox 
                    checked={formData.escalationRequired} 
                    onCheckedChange={(checked) => setFormData({...formData, escalationRequired: !!checked})}
                    data-testid="checkbox-escalation"
                  />
                  <Label>Escalation Required</Label>
                </div>
                <div className="col-span-2">
                  <Label>Escalation Reason</Label>
                  <Textarea value={formData.escalationReason} onChange={(e) => setFormData({...formData, escalationReason: e.target.value})} data-testid="input-escalation-reason" />
                </div>
                <div className="col-span-2">
                  <Label>Customer Feedback</Label>
                  <Textarea value={formData.customerFeedback} onChange={(e) => setFormData({...formData, customerFeedback: e.target.value})} data-testid="input-customer-feedback" />
                </div>
                <div className="col-span-2">
                  <Label>Remarks</Label>
                  <Textarea value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} data-testid="input-remarks" />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }} data-testid="button-cancel">Cancel</Button>
            <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending} data-testid="button-create">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Create Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Payment Record - {selectedReport?.reportNumber}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="customer">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="cost">Cost Details</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="commission">Commission</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
            </TabsList>
            
            <TabsContent value="customer" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer Name</Label>
                  <Input value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} data-testid="input-edit-customer-name" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={formData.customerPhone} onChange={(e) => setFormData({...formData, customerPhone: e.target.value})} data-testid="input-edit-customer-phone" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={formData.customerEmail} onChange={(e) => setFormData({...formData, customerEmail: e.target.value})} data-testid="input-edit-customer-email" />
                </div>
                <div>
                  <Label>Consumer Number</Label>
                  <Input value={formData.consumerNumber} onChange={(e) => setFormData({...formData, consumerNumber: e.target.value})} data-testid="input-edit-consumer-number" />
                </div>
                <div className="col-span-2">
                  <Label>Site Address</Label>
                  <Input value={formData.siteAddress} onChange={(e) => setFormData({...formData, siteAddress: e.target.value})} data-testid="input-edit-site-address" />
                </div>
                <div>
                  <Label>District</Label>
                  <Input value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})} data-testid="input-edit-district" />
                </div>
                <div>
                  <Label>State</Label>
                  <Input value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} data-testid="input-edit-state" />
                </div>
                <div>
                  <Label>Installed Capacity (kW)</Label>
                  <Input value={formData.installedCapacity} onChange={(e) => setFormData({...formData, installedCapacity: e.target.value})} data-testid="input-edit-installed-capacity" />
                </div>
                <div>
                  <Label>Panel Type</Label>
                  <Select value={formData.panelType} onValueChange={(v) => setFormData({...formData, panelType: v})}>
                    <SelectTrigger data-testid="select-edit-panel-type">
                      <SelectValue placeholder="Select panel type" />
                    </SelectTrigger>
                    <SelectContent>
                      {panelTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="cost" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Total System Cost (Rs)</Label>
                  <Input type="number" value={formData.totalSystemCost} onChange={(e) => setFormData({...formData, totalSystemCost: e.target.value})} data-testid="input-edit-total-cost" />
                </div>
                <div>
                  <Label>Advance Payment Received (Rs)</Label>
                  <Input type="number" value={formData.advancePaymentReceived} onChange={(e) => setFormData({...formData, advancePaymentReceived: e.target.value})} data-testid="input-edit-advance-payment" />
                </div>
                <div>
                  <Label>Advance Payment Date</Label>
                  <Input type="date" value={formData.advancePaymentDate} onChange={(e) => setFormData({...formData, advancePaymentDate: e.target.value})} data-testid="input-edit-advance-date" />
                </div>
                <div>
                  <Label>Subsidy Amount (Rs)</Label>
                  <Input type="number" value={formData.subsidyAmount} onChange={(e) => setFormData({...formData, subsidyAmount: e.target.value})} data-testid="input-edit-subsidy-amount" />
                </div>
                <div>
                  <Label>Subsidy Received Date</Label>
                  <Input type="date" value={formData.subsidyReceivedDate} onChange={(e) => setFormData({...formData, subsidyReceivedDate: e.target.value})} data-testid="input-edit-subsidy-date" />
                </div>
                <div>
                  <Label>Subsidy Adjusted (Rs)</Label>
                  <Input type="number" value={formData.subsidyAdjusted} onChange={(e) => setFormData({...formData, subsidyAdjusted: e.target.value})} data-testid="input-edit-subsidy-adjusted" />
                </div>
                <div>
                  <Label>Remaining Payment Amount (Rs)</Label>
                  <Input type="number" value={formData.remainingPaymentAmount} onChange={(e) => setFormData({...formData, remainingPaymentAmount: e.target.value})} data-testid="input-edit-remaining-amount" />
                </div>
                <div>
                  <Label>Remaining Payment Due Date</Label>
                  <Input type="date" value={formData.remainingPaymentDueDate} onChange={(e) => setFormData({...formData, remainingPaymentDueDate: e.target.value})} data-testid="input-edit-due-date" />
                </div>
                <div>
                  <Label>Completion Date</Label>
                  <Input type="date" value={formData.completionDate} onChange={(e) => setFormData({...formData, completionDate: e.target.value})} data-testid="input-edit-completion-date" />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="payment" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 flex items-center gap-2">
                  <Checkbox 
                    checked={formData.paymentReminderSent} 
                    onCheckedChange={(checked) => setFormData({...formData, paymentReminderSent: !!checked})}
                    data-testid="checkbox-edit-reminder-sent"
                  />
                  <Label>Payment Reminder Sent</Label>
                </div>
                <div>
                  <Label>Reminder Sent Date</Label>
                  <Input type="date" value={formData.reminderSentDate} onChange={(e) => setFormData({...formData, reminderSentDate: e.target.value})} data-testid="input-edit-reminder-date" />
                </div>
                <div>
                  <Label>Reminder Count</Label>
                  <Input type="number" value={formData.reminderCount} onChange={(e) => setFormData({...formData, reminderCount: e.target.value})} data-testid="input-edit-reminder-count" />
                </div>
                <div className="col-span-2 border-t pt-4 mt-2">
                  <h4 className="font-semibold mb-3">Payment Collection</h4>
                </div>
                <div>
                  <Label>Payment Mode</Label>
                  <Select value={formData.paymentMode} onValueChange={(v) => setFormData({...formData, paymentMode: v})}>
                    <SelectTrigger data-testid="select-edit-payment-mode">
                      <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentModes.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Payment Reference Number</Label>
                  <Input value={formData.paymentReferenceNumber} onChange={(e) => setFormData({...formData, paymentReferenceNumber: e.target.value})} data-testid="input-edit-payment-ref" />
                </div>
                <div>
                  <Label>Payment Received Date</Label>
                  <Input type="date" value={formData.paymentReceivedDate} onChange={(e) => setFormData({...formData, paymentReceivedDate: e.target.value})} data-testid="input-edit-payment-received-date" />
                </div>
                <div>
                  <Label>Payment Received Amount (Rs)</Label>
                  <Input type="number" value={formData.paymentReceivedAmount} onChange={(e) => setFormData({...formData, paymentReceivedAmount: e.target.value})} data-testid="input-edit-payment-amount" />
                </div>
                <div>
                  <Label>Receipt Number</Label>
                  <Input value={formData.paymentReceiptNumber} onChange={(e) => setFormData({...formData, paymentReceiptNumber: e.target.value})} data-testid="input-edit-receipt-number" />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Checkbox 
                    checked={formData.isPartialPayment} 
                    onCheckedChange={(checked) => setFormData({...formData, isPartialPayment: !!checked})}
                    data-testid="checkbox-edit-partial-payment"
                  />
                  <Label>Partial Payment</Label>
                </div>
                <div>
                  <Label>Total Received Till Date (Rs)</Label>
                  <Input type="number" value={formData.totalReceivedTillDate} onChange={(e) => setFormData({...formData, totalReceivedTillDate: e.target.value})} data-testid="input-edit-total-received" />
                </div>
                <div>
                  <Label>Balance Amount (Rs)</Label>
                  <Input type="number" value={formData.balanceAmount} onChange={(e) => setFormData({...formData, balanceAmount: e.target.value})} data-testid="input-edit-balance" />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="commission" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 flex items-center gap-2">
                  <Checkbox 
                    checked={formData.commissionHeld} 
                    onCheckedChange={(checked) => setFormData({...formData, commissionHeld: !!checked})}
                    data-testid="checkbox-edit-commission-held"
                  />
                  <Label>Commission Held (pending payment collection)</Label>
                </div>
                <div>
                  <Label>DDP Commission Amount (Rs)</Label>
                  <Input type="number" value={formData.ddpCommissionAmount} onChange={(e) => setFormData({...formData, ddpCommissionAmount: e.target.value})} data-testid="input-edit-ddp-commission" />
                </div>
                <div>
                  <Label>BDP Commission Amount (Rs)</Label>
                  <Input type="number" value={formData.bdpCommissionAmount} onChange={(e) => setFormData({...formData, bdpCommissionAmount: e.target.value})} data-testid="input-edit-bdp-commission" />
                </div>
                <div>
                  <Label>Commission Release Date</Label>
                  <Input type="date" value={formData.commissionReleaseDate} onChange={(e) => setFormData({...formData, commissionReleaseDate: e.target.value})} data-testid="input-edit-commission-release-date" />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="status" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                    <SelectTrigger data-testid="select-edit-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportStatuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Days Overdue</Label>
                  <Input type="number" value={formData.daysOverdue} onChange={(e) => setFormData({...formData, daysOverdue: e.target.value})} data-testid="input-edit-days-overdue" />
                </div>
                <div className="col-span-2 border-t pt-4 mt-2">
                  <h4 className="font-semibold mb-3">Follow-up</h4>
                </div>
                <div>
                  <Label>Last Follow-up Date</Label>
                  <Input type="date" value={formData.lastFollowUpDate} onChange={(e) => setFormData({...formData, lastFollowUpDate: e.target.value})} data-testid="input-edit-last-followup" />
                </div>
                <div>
                  <Label>Next Follow-up Date</Label>
                  <Input type="date" value={formData.nextFollowUpDate} onChange={(e) => setFormData({...formData, nextFollowUpDate: e.target.value})} data-testid="input-edit-next-followup" />
                </div>
                <div className="col-span-2">
                  <Label>Follow-up Remarks</Label>
                  <Textarea value={formData.followUpRemarks} onChange={(e) => setFormData({...formData, followUpRemarks: e.target.value})} data-testid="input-edit-followup-remarks" />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Checkbox 
                    checked={formData.escalationRequired} 
                    onCheckedChange={(checked) => setFormData({...formData, escalationRequired: !!checked})}
                    data-testid="checkbox-edit-escalation"
                  />
                  <Label>Escalation Required</Label>
                </div>
                <div className="col-span-2">
                  <Label>Escalation Reason</Label>
                  <Textarea value={formData.escalationReason} onChange={(e) => setFormData({...formData, escalationReason: e.target.value})} data-testid="input-edit-escalation-reason" />
                </div>
                <div className="col-span-2">
                  <Label>Customer Feedback</Label>
                  <Textarea value={formData.customerFeedback} onChange={(e) => setFormData({...formData, customerFeedback: e.target.value})} data-testid="input-edit-customer-feedback" />
                </div>
                <div className="col-span-2">
                  <Label>Remarks</Label>
                  <Textarea value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} data-testid="input-edit-remarks" />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setIsEditOpen(false); setSelectedReport(null); }} data-testid="button-edit-cancel">Cancel</Button>
            <Button 
              onClick={() => selectedReport && updateMutation.mutate({ id: selectedReport.id, data: formData })} 
              disabled={updateMutation.isPending}
              data-testid="button-update"
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Update Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
