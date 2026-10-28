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
  Globe, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2,
  User,
  Phone,
  Building,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  IndianRupee,
  FileCheck,
  ClipboardCheck
} from "lucide-react";
import { format } from "date-fns";
import type { PortalSubmissionReport, Customer } from "@shared/schema";

const reportStatuses = [
  { value: "pending", label: "Pending" },
  { value: "submitted", label: "Submitted to Portal" },
  { value: "under_review", label: "Under Review" },
  { value: "docs_verified", label: "Documents Verified" },
  { value: "physical_verified", label: "Physical Verified" },
  { value: "approved", label: "Approved" },
  { value: "subsidy_disbursed", label: "Subsidy Disbursed" },
  { value: "rejected", label: "Rejected" },
];

const subsidySchemes = [
  { value: "pm_surya_ghar", label: "PM Surya Ghar Yojana" },
  { value: "state_subsidy", label: "State Subsidy Only" },
  { value: "combined", label: "Central + State Subsidy" },
];

const disbursementStatuses = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "disbursed", label: "Disbursed" },
  { value: "failed", label: "Failed" },
];

const verificationStatuses = [
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];

const physicalVerificationStatuses = [
  { value: "pending", label: "Pending" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

const panelTypes = [
  { value: "DCR", label: "DCR (Domestic Content Requirement)" },
  { value: "Non-DCR", label: "Non-DCR" },
];

export default function AdminPortalSubmissionReports() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<PortalSubmissionReport | null>(null);
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
    portalRegistrationId: "",
    portalApplicationNumber: "",
    discomName: "",
    consumerNumber: "",
    installedCapacity: "",
    panelType: "",
    inverterCapacity: "",
    gridConnectionDate: "",
    netMeterNumber: "",
    submissionDate: "",
    completionCertificateNumber: "",
    completionCertificateDate: "",
    completionCertificateUrl: "",
    meterPhotoUrl: "",
    installationPhotoUrl: "",
    sitePhotoUrl: "",
    netMeteringAgreementUrl: "",
    bankDetailsProofUrl: "",
    aadharCardUrl: "",
    electricityBillUrl: "",
    portalAcknowledgmentNumber: "",
    portalAcknowledgmentDate: "",
    portalAcknowledgmentUrl: "",
    subsidyScheme: "pm_surya_ghar",
    centralSubsidyAmount: "",
    stateSubsidyAmount: "",
    totalSubsidyClaimed: "",
    subsidyApprovedAmount: "",
    subsidyRejectionReason: "",
    beneficiaryName: "",
    beneficiaryAccountNumber: "",
    beneficiaryIfsc: "",
    beneficiaryBankName: "",
    disbursementStatus: "pending",
    disbursementReferenceNumber: "",
    disbursementDate: "",
    disbursementAmount: "",
    disbursementRemarks: "",
    documentVerificationStatus: "pending",
    documentVerificationDate: "",
    documentVerificationRemarks: "",
    physicalVerificationRequired: true,
    physicalVerificationDate: "",
    physicalVerificationOfficer: "",
    physicalVerificationStatus: "pending",
    physicalVerificationRemarks: "",
    status: "pending",
    expectedDisbursementDate: "",
    actualProcessingDays: "",
    rejectionReason: "",
    lastFollowUpDate: "",
    nextFollowUpDate: "",
    followUpRemarks: "",
    portalHelplineTicket: "",
    remarks: "",
  });

  const { data: reports = [], isLoading } = useQuery<PortalSubmissionReport[]>({
    queryKey: ["/api/admin/portal-submission-reports"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/admin/portal-submission-reports", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/portal-submission-reports"] });
      toast({ title: "Portal submission report created successfully" });
      setIsAddOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Failed to create report", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return await apiRequest("PATCH", `/api/admin/portal-submission-reports/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/portal-submission-reports"] });
      toast({ title: "Portal submission report updated successfully" });
      setIsEditOpen(false);
      setSelectedReport(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update report", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/portal-submission-reports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/portal-submission-reports"] });
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
      portalRegistrationId: "",
      portalApplicationNumber: "",
      discomName: "",
      consumerNumber: "",
      installedCapacity: "",
      panelType: "",
      inverterCapacity: "",
      gridConnectionDate: "",
      netMeterNumber: "",
      submissionDate: "",
      completionCertificateNumber: "",
      completionCertificateDate: "",
      completionCertificateUrl: "",
      meterPhotoUrl: "",
      installationPhotoUrl: "",
      sitePhotoUrl: "",
      netMeteringAgreementUrl: "",
      bankDetailsProofUrl: "",
      aadharCardUrl: "",
      electricityBillUrl: "",
      portalAcknowledgmentNumber: "",
      portalAcknowledgmentDate: "",
      portalAcknowledgmentUrl: "",
      subsidyScheme: "pm_surya_ghar",
      centralSubsidyAmount: "",
      stateSubsidyAmount: "",
      totalSubsidyClaimed: "",
      subsidyApprovedAmount: "",
      subsidyRejectionReason: "",
      beneficiaryName: "",
      beneficiaryAccountNumber: "",
      beneficiaryIfsc: "",
      beneficiaryBankName: "",
      disbursementStatus: "pending",
      disbursementReferenceNumber: "",
      disbursementDate: "",
      disbursementAmount: "",
      disbursementRemarks: "",
      documentVerificationStatus: "pending",
      documentVerificationDate: "",
      documentVerificationRemarks: "",
      physicalVerificationRequired: true,
      physicalVerificationDate: "",
      physicalVerificationOfficer: "",
      physicalVerificationStatus: "pending",
      physicalVerificationRemarks: "",
      status: "pending",
      expectedDisbursementDate: "",
      actualProcessingDays: "",
      rejectionReason: "",
      lastFollowUpDate: "",
      nextFollowUpDate: "",
      followUpRemarks: "",
      portalHelplineTicket: "",
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

  const handleEdit = (report: PortalSubmissionReport) => {
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
      portalRegistrationId: report.portalRegistrationId || "",
      portalApplicationNumber: report.portalApplicationNumber || "",
      discomName: report.discomName || "",
      consumerNumber: report.consumerNumber || "",
      installedCapacity: report.installedCapacity || "",
      panelType: report.panelType || "",
      inverterCapacity: report.inverterCapacity || "",
      gridConnectionDate: report.gridConnectionDate ? format(new Date(report.gridConnectionDate), "yyyy-MM-dd") : "",
      netMeterNumber: report.netMeterNumber || "",
      submissionDate: report.submissionDate ? format(new Date(report.submissionDate), "yyyy-MM-dd") : "",
      completionCertificateNumber: report.completionCertificateNumber || "",
      completionCertificateDate: report.completionCertificateDate ? format(new Date(report.completionCertificateDate), "yyyy-MM-dd") : "",
      completionCertificateUrl: report.completionCertificateUrl || "",
      meterPhotoUrl: report.meterPhotoUrl || "",
      installationPhotoUrl: report.installationPhotoUrl || "",
      sitePhotoUrl: report.sitePhotoUrl || "",
      netMeteringAgreementUrl: report.netMeteringAgreementUrl || "",
      bankDetailsProofUrl: report.bankDetailsProofUrl || "",
      aadharCardUrl: report.aadharCardUrl || "",
      electricityBillUrl: report.electricityBillUrl || "",
      portalAcknowledgmentNumber: report.portalAcknowledgmentNumber || "",
      portalAcknowledgmentDate: report.portalAcknowledgmentDate ? format(new Date(report.portalAcknowledgmentDate), "yyyy-MM-dd") : "",
      portalAcknowledgmentUrl: report.portalAcknowledgmentUrl || "",
      subsidyScheme: report.subsidyScheme || "pm_surya_ghar",
      centralSubsidyAmount: report.centralSubsidyAmount?.toString() || "",
      stateSubsidyAmount: report.stateSubsidyAmount?.toString() || "",
      totalSubsidyClaimed: report.totalSubsidyClaimed?.toString() || "",
      subsidyApprovedAmount: report.subsidyApprovedAmount?.toString() || "",
      subsidyRejectionReason: report.subsidyRejectionReason || "",
      beneficiaryName: report.beneficiaryName || "",
      beneficiaryAccountNumber: report.beneficiaryAccountNumber || "",
      beneficiaryIfsc: report.beneficiaryIfsc || "",
      beneficiaryBankName: report.beneficiaryBankName || "",
      disbursementStatus: report.disbursementStatus || "pending",
      disbursementReferenceNumber: report.disbursementReferenceNumber || "",
      disbursementDate: report.disbursementDate ? format(new Date(report.disbursementDate), "yyyy-MM-dd") : "",
      disbursementAmount: report.disbursementAmount?.toString() || "",
      disbursementRemarks: report.disbursementRemarks || "",
      documentVerificationStatus: report.documentVerificationStatus || "pending",
      documentVerificationDate: report.documentVerificationDate ? format(new Date(report.documentVerificationDate), "yyyy-MM-dd") : "",
      documentVerificationRemarks: report.documentVerificationRemarks || "",
      physicalVerificationRequired: report.physicalVerificationRequired ?? true,
      physicalVerificationDate: report.physicalVerificationDate ? format(new Date(report.physicalVerificationDate), "yyyy-MM-dd") : "",
      physicalVerificationOfficer: report.physicalVerificationOfficer || "",
      physicalVerificationStatus: report.physicalVerificationStatus || "pending",
      physicalVerificationRemarks: report.physicalVerificationRemarks || "",
      status: report.status || "pending",
      expectedDisbursementDate: report.expectedDisbursementDate ? format(new Date(report.expectedDisbursementDate), "yyyy-MM-dd") : "",
      actualProcessingDays: report.actualProcessingDays?.toString() || "",
      rejectionReason: report.rejectionReason || "",
      lastFollowUpDate: report.lastFollowUpDate ? format(new Date(report.lastFollowUpDate), "yyyy-MM-dd") : "",
      nextFollowUpDate: report.nextFollowUpDate ? format(new Date(report.nextFollowUpDate), "yyyy-MM-dd") : "",
      followUpRemarks: report.followUpRemarks || "",
      portalHelplineTicket: report.portalHelplineTicket || "",
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
      submitted: { variant: "secondary", label: "Submitted" },
      under_review: { variant: "secondary", label: "Under Review" },
      docs_verified: { variant: "default", label: "Docs Verified" },
      physical_verified: { variant: "default", label: "Physical Verified" },
      approved: { variant: "default", label: "Approved" },
      subsidy_disbursed: { variant: "default", label: "Subsidy Disbursed" },
      rejected: { variant: "destructive", label: "Rejected" },
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

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Globe className="h-6 w-6" />
            PM Surya Ghar Portal Submissions
          </h1>
          <p className="text-muted-foreground">Step 11: Track completion report submissions on PM Surya Ghar Portal</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} data-testid="button-add-report">
          <Plus className="h-4 w-4 mr-2" />
          New Portal Submission
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer name, report number, portal ID..."
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
                  <TableHead>Portal App #</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Subsidy Claimed</TableHead>
                  <TableHead>Submission Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No portal submission reports found
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
                      <TableCell>{report.portalApplicationNumber || "-"}</TableCell>
                      <TableCell>{report.installedCapacity} kW</TableCell>
                      <TableCell>
                        {report.totalSubsidyClaimed ? (
                          <span className="flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" />
                            {report.totalSubsidyClaimed.toLocaleString()}
                          </span>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {report.submissionDate ? format(new Date(report.submissionDate), "dd MMM yyyy") : "-"}
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
            <DialogTitle>New Portal Submission Report</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="customer">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="portal">Portal</TabsTrigger>
              <TabsTrigger value="disbursement">Disbursement</TabsTrigger>
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
                  <Label>Pincode</Label>
                  <Input value={formData.pincode} onChange={(e) => setFormData({...formData, pincode: e.target.value})} data-testid="input-pincode" />
                </div>
                <div>
                  <Label>DISCOM Name</Label>
                  <Input value={formData.discomName} onChange={(e) => setFormData({...formData, discomName: e.target.value})} data-testid="input-discom-name" />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="portal" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Portal Registration ID</Label>
                  <Input value={formData.portalRegistrationId} onChange={(e) => setFormData({...formData, portalRegistrationId: e.target.value})} data-testid="input-portal-reg-id" />
                </div>
                <div>
                  <Label>Portal Application Number</Label>
                  <Input value={formData.portalApplicationNumber} onChange={(e) => setFormData({...formData, portalApplicationNumber: e.target.value})} data-testid="input-portal-app-number" />
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
                <div>
                  <Label>Inverter Capacity</Label>
                  <Input value={formData.inverterCapacity} onChange={(e) => setFormData({...formData, inverterCapacity: e.target.value})} data-testid="input-inverter-capacity" />
                </div>
                <div>
                  <Label>Net Meter Number</Label>
                  <Input value={formData.netMeterNumber} onChange={(e) => setFormData({...formData, netMeterNumber: e.target.value})} data-testid="input-net-meter-number" />
                </div>
                <div>
                  <Label>Grid Connection Date</Label>
                  <Input type="date" value={formData.gridConnectionDate} onChange={(e) => setFormData({...formData, gridConnectionDate: e.target.value})} data-testid="input-grid-connection-date" />
                </div>
                <div>
                  <Label>Submission Date</Label>
                  <Input type="date" value={formData.submissionDate} onChange={(e) => setFormData({...formData, submissionDate: e.target.value})} data-testid="input-submission-date" />
                </div>
                <div>
                  <Label>Completion Certificate Number</Label>
                  <Input value={formData.completionCertificateNumber} onChange={(e) => setFormData({...formData, completionCertificateNumber: e.target.value})} data-testid="input-cert-number" />
                </div>
                <div>
                  <Label>Certificate Date</Label>
                  <Input type="date" value={formData.completionCertificateDate} onChange={(e) => setFormData({...formData, completionCertificateDate: e.target.value})} data-testid="input-cert-date" />
                </div>
                <div>
                  <Label>Acknowledgment Number</Label>
                  <Input value={formData.portalAcknowledgmentNumber} onChange={(e) => setFormData({...formData, portalAcknowledgmentNumber: e.target.value})} data-testid="input-ack-number" />
                </div>
                <div>
                  <Label>Acknowledgment Date</Label>
                  <Input type="date" value={formData.portalAcknowledgmentDate} onChange={(e) => setFormData({...formData, portalAcknowledgmentDate: e.target.value})} data-testid="input-ack-date" />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="disbursement" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Disbursement Status</Label>
                  <Select value={formData.disbursementStatus} onValueChange={(v) => setFormData({...formData, disbursementStatus: v})}>
                    <SelectTrigger data-testid="select-disbursement-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {disbursementStatuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Disbursement Reference Number</Label>
                  <Input value={formData.disbursementReferenceNumber} onChange={(e) => setFormData({...formData, disbursementReferenceNumber: e.target.value})} data-testid="input-disbursement-ref" />
                </div>
                <div>
                  <Label>Disbursement Date</Label>
                  <Input type="date" value={formData.disbursementDate} onChange={(e) => setFormData({...formData, disbursementDate: e.target.value})} data-testid="input-disbursement-date" />
                </div>
                <div>
                  <Label>Disbursement Amount (Rs)</Label>
                  <Input type="number" value={formData.disbursementAmount} onChange={(e) => setFormData({...formData, disbursementAmount: e.target.value})} data-testid="input-disbursement-amount" />
                </div>
                <div className="col-span-2">
                  <Label>Disbursement Remarks</Label>
                  <Textarea value={formData.disbursementRemarks} onChange={(e) => setFormData({...formData, disbursementRemarks: e.target.value})} data-testid="input-disbursement-remarks" />
                </div>
                <div>
                  <Label>Expected Disbursement Date</Label>
                  <Input type="date" value={formData.expectedDisbursementDate} onChange={(e) => setFormData({...formData, expectedDisbursementDate: e.target.value})} data-testid="input-expected-disbursement-date" />
                </div>
                <div>
                  <Label>Actual Processing Days</Label>
                  <Input type="number" value={formData.actualProcessingDays} onChange={(e) => setFormData({...formData, actualProcessingDays: e.target.value})} data-testid="input-processing-days" />
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
                  <Label>Portal Helpline Ticket</Label>
                  <Input value={formData.portalHelplineTicket} onChange={(e) => setFormData({...formData, portalHelplineTicket: e.target.value})} data-testid="input-helpline-ticket" />
                </div>
                <div className="col-span-2">
                  <Label>Rejection Reason (if rejected)</Label>
                  <Textarea value={formData.rejectionReason} onChange={(e) => setFormData({...formData, rejectionReason: e.target.value})} data-testid="input-rejection-reason" />
                </div>
                <div className="col-span-2 border-t pt-4 mt-2">
                  <h4 className="font-semibold mb-3">Follow-up</h4>
                </div>
                <div>
                  <Label>Last Follow-up Date</Label>
                  <Input type="date" value={formData.lastFollowUpDate} onChange={(e) => setFormData({...formData, lastFollowUpDate: e.target.value})} data-testid="input-last-followup-date" />
                </div>
                <div>
                  <Label>Next Follow-up Date</Label>
                  <Input type="date" value={formData.nextFollowUpDate} onChange={(e) => setFormData({...formData, nextFollowUpDate: e.target.value})} data-testid="input-next-followup-date" />
                </div>
                <div className="col-span-2">
                  <Label>Follow-up Remarks</Label>
                  <Textarea value={formData.followUpRemarks} onChange={(e) => setFormData({...formData, followUpRemarks: e.target.value})} data-testid="input-followup-remarks" />
                </div>
                <div className="col-span-2">
                  <Label>General Remarks</Label>
                  <Textarea value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} data-testid="input-remarks" />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }} data-testid="button-cancel">Cancel</Button>
            <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending} data-testid="button-create">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Create Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Portal Submission Report - {selectedReport?.reportNumber}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="customer">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="portal">Portal</TabsTrigger>
              <TabsTrigger value="disbursement">Disbursement</TabsTrigger>
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
                  <Label>Pincode</Label>
                  <Input value={formData.pincode} onChange={(e) => setFormData({...formData, pincode: e.target.value})} data-testid="input-edit-pincode" />
                </div>
                <div>
                  <Label>DISCOM Name</Label>
                  <Input value={formData.discomName} onChange={(e) => setFormData({...formData, discomName: e.target.value})} data-testid="input-edit-discom-name" />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="portal" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Portal Registration ID</Label>
                  <Input value={formData.portalRegistrationId} onChange={(e) => setFormData({...formData, portalRegistrationId: e.target.value})} data-testid="input-edit-portal-reg-id" />
                </div>
                <div>
                  <Label>Portal Application Number</Label>
                  <Input value={formData.portalApplicationNumber} onChange={(e) => setFormData({...formData, portalApplicationNumber: e.target.value})} data-testid="input-edit-portal-app-number" />
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
                <div>
                  <Label>Inverter Capacity</Label>
                  <Input value={formData.inverterCapacity} onChange={(e) => setFormData({...formData, inverterCapacity: e.target.value})} data-testid="input-edit-inverter-capacity" />
                </div>
                <div>
                  <Label>Net Meter Number</Label>
                  <Input value={formData.netMeterNumber} onChange={(e) => setFormData({...formData, netMeterNumber: e.target.value})} data-testid="input-edit-net-meter-number" />
                </div>
                <div>
                  <Label>Grid Connection Date</Label>
                  <Input type="date" value={formData.gridConnectionDate} onChange={(e) => setFormData({...formData, gridConnectionDate: e.target.value})} data-testid="input-edit-grid-connection-date" />
                </div>
                <div>
                  <Label>Submission Date</Label>
                  <Input type="date" value={formData.submissionDate} onChange={(e) => setFormData({...formData, submissionDate: e.target.value})} data-testid="input-edit-submission-date" />
                </div>
                <div>
                  <Label>Completion Certificate Number</Label>
                  <Input value={formData.completionCertificateNumber} onChange={(e) => setFormData({...formData, completionCertificateNumber: e.target.value})} data-testid="input-edit-cert-number" />
                </div>
                <div>
                  <Label>Certificate Date</Label>
                  <Input type="date" value={formData.completionCertificateDate} onChange={(e) => setFormData({...formData, completionCertificateDate: e.target.value})} data-testid="input-edit-cert-date" />
                </div>
                <div>
                  <Label>Acknowledgment Number</Label>
                  <Input value={formData.portalAcknowledgmentNumber} onChange={(e) => setFormData({...formData, portalAcknowledgmentNumber: e.target.value})} data-testid="input-edit-ack-number" />
                </div>
                <div>
                  <Label>Acknowledgment Date</Label>
                  <Input type="date" value={formData.portalAcknowledgmentDate} onChange={(e) => setFormData({...formData, portalAcknowledgmentDate: e.target.value})} data-testid="input-edit-ack-date" />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="disbursement" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Disbursement Status</Label>
                  <Select value={formData.disbursementStatus} onValueChange={(v) => setFormData({...formData, disbursementStatus: v})}>
                    <SelectTrigger data-testid="select-edit-disbursement-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {disbursementStatuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Disbursement Reference Number</Label>
                  <Input value={formData.disbursementReferenceNumber} onChange={(e) => setFormData({...formData, disbursementReferenceNumber: e.target.value})} data-testid="input-edit-disbursement-ref" />
                </div>
                <div>
                  <Label>Disbursement Date</Label>
                  <Input type="date" value={formData.disbursementDate} onChange={(e) => setFormData({...formData, disbursementDate: e.target.value})} data-testid="input-edit-disbursement-date" />
                </div>
                <div>
                  <Label>Disbursement Amount (Rs)</Label>
                  <Input type="number" value={formData.disbursementAmount} onChange={(e) => setFormData({...formData, disbursementAmount: e.target.value})} data-testid="input-edit-disbursement-amount" />
                </div>
                <div className="col-span-2">
                  <Label>Disbursement Remarks</Label>
                  <Textarea value={formData.disbursementRemarks} onChange={(e) => setFormData({...formData, disbursementRemarks: e.target.value})} data-testid="input-edit-disbursement-remarks" />
                </div>
                <div>
                  <Label>Expected Disbursement Date</Label>
                  <Input type="date" value={formData.expectedDisbursementDate} onChange={(e) => setFormData({...formData, expectedDisbursementDate: e.target.value})} data-testid="input-edit-expected-disbursement-date" />
                </div>
                <div>
                  <Label>Actual Processing Days</Label>
                  <Input type="number" value={formData.actualProcessingDays} onChange={(e) => setFormData({...formData, actualProcessingDays: e.target.value})} data-testid="input-edit-processing-days" />
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
                  <Label>Portal Helpline Ticket</Label>
                  <Input value={formData.portalHelplineTicket} onChange={(e) => setFormData({...formData, portalHelplineTicket: e.target.value})} data-testid="input-edit-helpline-ticket" />
                </div>
                <div className="col-span-2">
                  <Label>Rejection Reason (if rejected)</Label>
                  <Textarea value={formData.rejectionReason} onChange={(e) => setFormData({...formData, rejectionReason: e.target.value})} data-testid="input-edit-rejection-reason" />
                </div>
                <div className="col-span-2 border-t pt-4 mt-2">
                  <h4 className="font-semibold mb-3">Follow-up</h4>
                </div>
                <div>
                  <Label>Last Follow-up Date</Label>
                  <Input type="date" value={formData.lastFollowUpDate} onChange={(e) => setFormData({...formData, lastFollowUpDate: e.target.value})} data-testid="input-edit-last-followup-date" />
                </div>
                <div>
                  <Label>Next Follow-up Date</Label>
                  <Input type="date" value={formData.nextFollowUpDate} onChange={(e) => setFormData({...formData, nextFollowUpDate: e.target.value})} data-testid="input-edit-next-followup-date" />
                </div>
                <div className="col-span-2">
                  <Label>Follow-up Remarks</Label>
                  <Textarea value={formData.followUpRemarks} onChange={(e) => setFormData({...formData, followUpRemarks: e.target.value})} data-testid="input-edit-followup-remarks" />
                </div>
                <div className="col-span-2">
                  <Label>General Remarks</Label>
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
              Update Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
