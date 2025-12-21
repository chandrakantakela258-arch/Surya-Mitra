import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Search, Edit, Trash2, FileCheck, Eye, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";
import type { SubsidyApplicationReport, Customer } from "@shared/schema";

export default function AdminSubsidyApplicationReports() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<SubsidyApplicationReport | null>(null);
  const [activeTab, setActiveTab] = useState("customer");

  const { data: reports = [], isLoading } = useQuery<SubsidyApplicationReport[]>({
    queryKey: ["/api/admin/subsidy-application-reports"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/admin/subsidy-application-reports", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subsidy-application-reports"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Success", description: "Subsidy application report created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create subsidy application report", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/admin/subsidy-application-reports/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subsidy-application-reports"] });
      setEditingReport(null);
      toast({ title: "Success", description: "Subsidy application report updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update subsidy application report", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/subsidy-application-reports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subsidy-application-reports"] });
      toast({ title: "Success", description: "Subsidy application report deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete subsidy application report", variant: "destructive" });
    },
  });

  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.portalApplicationNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string | null) => {
    const statusColors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      under_review: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      docs_verified: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
      approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return <Badge className={statusColors[status || "pending"] || statusColors.pending}>{status?.replace("_", " ") || "pending"}</Badge>;
  };

  const getDocVerificationBadge = (status: string | null) => {
    if (status === "verified") return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Verified</Badge>;
    if (status === "rejected") return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
  };

  const ReportForm = ({ report, onSubmit, isLoading }: { report?: SubsidyApplicationReport | null; onSubmit: (data: any) => void; isLoading: boolean }) => {
    const [formData, setFormData] = useState({
      customerId: report?.customerId || "",
      customerName: report?.customerName || "",
      customerPhone: report?.customerPhone || "",
      customerEmail: report?.customerEmail || "",
      siteAddress: report?.siteAddress || "",
      district: report?.district || "",
      state: report?.state || "",
      pincode: report?.pincode || "",
      installedCapacity: report?.installedCapacity || "",
      panelType: report?.panelType || "",
      consumerNumber: report?.consumerNumber || "",
      discomName: report?.discomName || "",
      portalRegistrationId: report?.portalRegistrationId || "",
      portalApplicationNumber: report?.portalApplicationNumber || "",
      completionCertificateNumber: report?.completionCertificateNumber || "",
      completionCertificateDate: report?.completionCertificateDate ? format(new Date(report.completionCertificateDate), "yyyy-MM-dd") : "",
      netMeterNumber: report?.netMeterNumber || "",
      gridConnectionDate: report?.gridConnectionDate ? format(new Date(report.gridConnectionDate), "yyyy-MM-dd") : "",
      applicationDate: report?.applicationDate ? format(new Date(report.applicationDate), "yyyy-MM-dd") : "",
      subsidyScheme: report?.subsidyScheme || "pm_surya_ghar",
      centralSubsidyAmount: report?.centralSubsidyAmount?.toString() || "",
      stateSubsidyAmount: report?.stateSubsidyAmount?.toString() || "",
      totalSubsidyApplied: report?.totalSubsidyApplied?.toString() || "",
      beneficiaryName: report?.beneficiaryName || "",
      beneficiaryAccountNumber: report?.beneficiaryAccountNumber || "",
      beneficiaryIfsc: report?.beneficiaryIfsc || "",
      beneficiaryBankName: report?.beneficiaryBankName || "",
      beneficiaryBankBranch: report?.beneficiaryBankBranch || "",
      applicationAcknowledgmentNumber: report?.applicationAcknowledgmentNumber || "",
      applicationAcknowledgmentDate: report?.applicationAcknowledgmentDate ? format(new Date(report.applicationAcknowledgmentDate), "yyyy-MM-dd") : "",
      documentVerificationStatus: report?.documentVerificationStatus || "pending",
      documentVerificationDate: report?.documentVerificationDate ? format(new Date(report.documentVerificationDate), "yyyy-MM-dd") : "",
      documentVerificationRemarks: report?.documentVerificationRemarks || "",
      status: report?.status || "pending",
      rejectionReason: report?.rejectionReason || "",
      lastFollowUpDate: report?.lastFollowUpDate ? format(new Date(report.lastFollowUpDate), "yyyy-MM-dd") : "",
      nextFollowUpDate: report?.nextFollowUpDate ? format(new Date(report.nextFollowUpDate), "yyyy-MM-dd") : "",
      followUpRemarks: report?.followUpRemarks || "",
      portalHelplineTicket: report?.portalHelplineTicket || "",
      remarks: report?.remarks || "",
    });

    const handleCustomerSelect = (customerId: string) => {
      const customer = customers.find((c) => c.id === customerId);
      if (customer) {
        setFormData({
          ...formData,
          customerId,
          customerName: customer.name,
          customerPhone: customer.phone || "",
          customerEmail: customer.email || "",
          siteAddress: customer.address || "",
          district: customer.district || "",
          state: customer.state || "",
          pincode: customer.pincode || "",
          installedCapacity: customer.proposedCapacity || "",
          panelType: customer.panelType || "",
          consumerNumber: customer.consumerNumber || "",
        });
      }
    };

    return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="customer">Customer</TabsTrigger>
          <TabsTrigger value="portal">Portal</TabsTrigger>
          <TabsTrigger value="subsidy">Subsidy</TabsTrigger>
          <TabsTrigger value="bank">Bank</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>

        <TabsContent value="customer" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Select Customer</Label>
              <Select value={formData.customerId} onValueChange={handleCustomerSelect}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} - {c.phone}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Customer Name</Label><Input value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={formData.customerPhone} onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={formData.customerEmail} onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })} /></div>
            <div><Label>Consumer Number</Label><Input value={formData.consumerNumber} onChange={(e) => setFormData({ ...formData, consumerNumber: e.target.value })} /></div>
            <div className="col-span-2"><Label>Site Address</Label><Input value={formData.siteAddress} onChange={(e) => setFormData({ ...formData, siteAddress: e.target.value })} /></div>
            <div><Label>District</Label><Input value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} /></div>
            <div><Label>State</Label><Input value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} /></div>
            <div><Label>Pincode</Label><Input value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} /></div>
            <div><Label>Installed Capacity (kW)</Label><Input value={formData.installedCapacity} onChange={(e) => setFormData({ ...formData, installedCapacity: e.target.value })} /></div>
            <div><Label>Panel Type</Label>
              <Select value={formData.panelType} onValueChange={(v) => setFormData({ ...formData, panelType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dcr">DCR</SelectItem>
                  <SelectItem value="non_dcr">Non-DCR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>DISCOM Name</Label><Input value={formData.discomName} onChange={(e) => setFormData({ ...formData, discomName: e.target.value })} /></div>
          </div>
        </TabsContent>

        <TabsContent value="portal" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Portal Registration ID</Label><Input value={formData.portalRegistrationId} onChange={(e) => setFormData({ ...formData, portalRegistrationId: e.target.value })} /></div>
            <div><Label>Portal Application Number</Label><Input value={formData.portalApplicationNumber} onChange={(e) => setFormData({ ...formData, portalApplicationNumber: e.target.value })} /></div>
            <div><Label>Completion Certificate Number</Label><Input value={formData.completionCertificateNumber} onChange={(e) => setFormData({ ...formData, completionCertificateNumber: e.target.value })} /></div>
            <div><Label>Completion Certificate Date</Label><Input type="date" value={formData.completionCertificateDate} onChange={(e) => setFormData({ ...formData, completionCertificateDate: e.target.value })} /></div>
            <div><Label>Net Meter Number</Label><Input value={formData.netMeterNumber} onChange={(e) => setFormData({ ...formData, netMeterNumber: e.target.value })} /></div>
            <div><Label>Grid Connection Date</Label><Input type="date" value={formData.gridConnectionDate} onChange={(e) => setFormData({ ...formData, gridConnectionDate: e.target.value })} /></div>
            <div><Label>Application Date</Label><Input type="date" value={formData.applicationDate} onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })} /></div>
            <div><Label>Acknowledgment Number</Label><Input value={formData.applicationAcknowledgmentNumber} onChange={(e) => setFormData({ ...formData, applicationAcknowledgmentNumber: e.target.value })} /></div>
            <div><Label>Acknowledgment Date</Label><Input type="date" value={formData.applicationAcknowledgmentDate} onChange={(e) => setFormData({ ...formData, applicationAcknowledgmentDate: e.target.value })} /></div>
            <div><Label>Portal Helpline Ticket</Label><Input value={formData.portalHelplineTicket} onChange={(e) => setFormData({ ...formData, portalHelplineTicket: e.target.value })} /></div>
          </div>
        </TabsContent>

        <TabsContent value="subsidy" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Subsidy Scheme</Label>
              <Select value={formData.subsidyScheme} onValueChange={(v) => setFormData({ ...formData, subsidyScheme: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pm_surya_ghar">PM Surya Ghar Yojana</SelectItem>
                  <SelectItem value="state_subsidy">State Subsidy Only</SelectItem>
                  <SelectItem value="combined">Combined (Central + State)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Central Subsidy Amount (Rs)</Label><Input type="number" value={formData.centralSubsidyAmount} onChange={(e) => setFormData({ ...formData, centralSubsidyAmount: e.target.value })} /></div>
            <div><Label>State Subsidy Amount (Rs)</Label><Input type="number" value={formData.stateSubsidyAmount} onChange={(e) => setFormData({ ...formData, stateSubsidyAmount: e.target.value })} /></div>
            <div><Label>Total Subsidy Applied (Rs)</Label><Input type="number" value={formData.totalSubsidyApplied} onChange={(e) => setFormData({ ...formData, totalSubsidyApplied: e.target.value })} /></div>
            <div className="col-span-2"><Label>Document Verification Status</Label>
              <Select value={formData.documentVerificationStatus} onValueChange={(v) => setFormData({ ...formData, documentVerificationStatus: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Verification Date</Label><Input type="date" value={formData.documentVerificationDate} onChange={(e) => setFormData({ ...formData, documentVerificationDate: e.target.value })} /></div>
            <div><Label>Verification Remarks</Label><Input value={formData.documentVerificationRemarks} onChange={(e) => setFormData({ ...formData, documentVerificationRemarks: e.target.value })} /></div>
          </div>
        </TabsContent>

        <TabsContent value="bank" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Beneficiary Name</Label><Input value={formData.beneficiaryName} onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value })} /></div>
            <div><Label>Account Number</Label><Input value={formData.beneficiaryAccountNumber} onChange={(e) => setFormData({ ...formData, beneficiaryAccountNumber: e.target.value })} /></div>
            <div><Label>IFSC Code</Label><Input value={formData.beneficiaryIfsc} onChange={(e) => setFormData({ ...formData, beneficiaryIfsc: e.target.value })} /></div>
            <div><Label>Bank Name</Label><Input value={formData.beneficiaryBankName} onChange={(e) => setFormData({ ...formData, beneficiaryBankName: e.target.value })} /></div>
            <div><Label>Branch</Label><Input value={formData.beneficiaryBankBranch} onChange={(e) => setFormData({ ...formData, beneficiaryBankBranch: e.target.value })} /></div>
          </div>
        </TabsContent>

        <TabsContent value="status" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="docs_verified">Documents Verified</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Rejection Reason</Label><Input value={formData.rejectionReason} onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })} /></div>
            <div><Label>Last Follow-up Date</Label><Input type="date" value={formData.lastFollowUpDate} onChange={(e) => setFormData({ ...formData, lastFollowUpDate: e.target.value })} /></div>
            <div><Label>Next Follow-up Date</Label><Input type="date" value={formData.nextFollowUpDate} onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })} /></div>
            <div className="col-span-2"><Label>Follow-up Remarks</Label><Textarea value={formData.followUpRemarks} onChange={(e) => setFormData({ ...formData, followUpRemarks: e.target.value })} /></div>
            <div className="col-span-2"><Label>General Remarks</Label><Textarea value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} /></div>
          </div>
          <Button onClick={() => onSubmit(formData)} disabled={isLoading} className="w-full mt-4">
            {isLoading ? "Saving..." : report ? "Update Report" : "Create Report"}
          </Button>
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Step 13: Subsidy Application Reports</h1>
          <p className="text-muted-foreground">Track subsidy applications on PM Surya Ghar Portal</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-report"><Plus className="w-4 h-4 mr-2" />New Report</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Subsidy Application Report</DialogTitle></DialogHeader>
            <ReportForm onSubmit={(data) => createMutation.mutate(data)} isLoading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by customer, report number..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" data-testid="input-search" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-status-filter"><SelectValue placeholder="Filter by status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="docs_verified">Docs Verified</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{reports.length}</div><p className="text-sm text-muted-foreground">Total Applications</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-blue-600">{reports.filter((r) => r.status === "submitted" || r.status === "under_review").length}</div><p className="text-sm text-muted-foreground">In Progress</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">{reports.filter((r) => r.status === "approved").length}</div><p className="text-sm text-muted-foreground">Approved</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-red-600">{reports.filter((r) => r.status === "rejected").length}</div><p className="text-sm text-muted-foreground">Rejected</p></CardContent></Card>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading...</div>
      ) : filteredReports.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No subsidy application reports found</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {filteredReports.map((report) => (
            <Card key={report.id} data-testid={`card-report-${report.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{report.reportNumber}</span>
                      {getStatusBadge(report.status)}
                      {getDocVerificationBadge(report.documentVerificationStatus)}
                    </div>
                    <div className="text-lg font-semibold">{report.customerName}</div>
                    <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div><span className="font-medium">Phone:</span> {report.customerPhone}</div>
                      <div><span className="font-medium">Capacity:</span> {report.installedCapacity} kW</div>
                      <div><span className="font-medium">Portal App #:</span> {report.portalApplicationNumber || "-"}</div>
                      <div><span className="font-medium">Subsidy Applied:</span> Rs {report.totalSubsidyApplied?.toLocaleString() || "-"}</div>
                    </div>
                    {report.applicationDate && (
                      <div className="text-sm text-muted-foreground">
                        Applied on: {format(new Date(report.applicationDate), "dd MMM yyyy")}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="icon" variant="ghost" data-testid={`button-view-${report.id}`}><Eye className="w-4 h-4" /></Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader><DialogTitle>Report Details - {report.reportNumber}</DialogTitle></DialogHeader>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div><strong>Customer:</strong> {report.customerName}</div>
                          <div><strong>Phone:</strong> {report.customerPhone}</div>
                          <div><strong>Capacity:</strong> {report.installedCapacity} kW</div>
                          <div><strong>Panel Type:</strong> {report.panelType}</div>
                          <div><strong>Portal App #:</strong> {report.portalApplicationNumber}</div>
                          <div><strong>Acknowledgment #:</strong> {report.applicationAcknowledgmentNumber}</div>
                          <div><strong>Central Subsidy:</strong> Rs {report.centralSubsidyAmount?.toLocaleString()}</div>
                          <div><strong>State Subsidy:</strong> Rs {report.stateSubsidyAmount?.toLocaleString()}</div>
                          <div><strong>Total Applied:</strong> Rs {report.totalSubsidyApplied?.toLocaleString()}</div>
                          <div><strong>Bank:</strong> {report.beneficiaryBankName}</div>
                          <div className="col-span-2"><strong>Remarks:</strong> {report.remarks}</div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button size="icon" variant="ghost" onClick={() => setEditingReport(report)} data-testid={`button-edit-${report.id}`}><Edit className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(report.id)} data-testid={`button-delete-${report.id}`}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editingReport} onOpenChange={(open) => !open && setEditingReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Subsidy Application Report</DialogTitle></DialogHeader>
          {editingReport && <ReportForm report={editingReport} onSubmit={(data) => updateMutation.mutate({ id: editingReport.id, data })} isLoading={updateMutation.isPending} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
