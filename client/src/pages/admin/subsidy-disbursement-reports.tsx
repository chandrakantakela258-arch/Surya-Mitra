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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Search, Edit, Trash2, Banknote, Eye, CheckCircle2, AlertCircle, IndianRupee } from "lucide-react";
import type { SubsidyDisbursementReport, Customer } from "@shared/schema";

export default function AdminSubsidyDisbursementReports() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<SubsidyDisbursementReport | null>(null);
  const [activeTab, setActiveTab] = useState("customer");

  const { data: reports = [], isLoading } = useQuery<SubsidyDisbursementReport[]>({
    queryKey: ["/api/admin/subsidy-disbursement-reports"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/admin/subsidy-disbursement-reports", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subsidy-disbursement-reports"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Success", description: "Subsidy disbursement report created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create subsidy disbursement report", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/admin/subsidy-disbursement-reports/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subsidy-disbursement-reports"] });
      setEditingReport(null);
      toast({ title: "Success", description: "Subsidy disbursement report updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update subsidy disbursement report", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/subsidy-disbursement-reports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subsidy-disbursement-reports"] });
      toast({ title: "Success", description: "Subsidy disbursement report deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete subsidy disbursement report", variant: "destructive" });
    },
  });

  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.disbursementReferenceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string | null) => {
    const statusColors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      disbursed: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
      verified: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    };
    return <Badge className={statusColors[status || "pending"] || statusColors.pending}>{status || "pending"}</Badge>;
  };

  const ReportForm = ({ report, onSubmit, isLoading }: { report?: SubsidyDisbursementReport | null; onSubmit: (data: any) => void; isLoading: boolean }) => {
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
      portalApplicationNumber: report?.portalApplicationNumber || "",
      subsidyScheme: report?.subsidyScheme || "pm_surya_ghar",
      centralSubsidyApproved: report?.centralSubsidyApproved?.toString() || "",
      stateSubsidyApproved: report?.stateSubsidyApproved?.toString() || "",
      totalSubsidyApproved: report?.totalSubsidyApproved?.toString() || "",
      disbursementStatus: report?.disbursementStatus || "pending",
      disbursementReferenceNumber: report?.disbursementReferenceNumber || "",
      disbursementDate: report?.disbursementDate ? format(new Date(report.disbursementDate), "yyyy-MM-dd") : "",
      disbursementAmount: report?.disbursementAmount?.toString() || "",
      disbursementMode: report?.disbursementMode || "",
      beneficiaryName: report?.beneficiaryName || "",
      beneficiaryAccountNumber: report?.beneficiaryAccountNumber || "",
      beneficiaryIfsc: report?.beneficiaryIfsc || "",
      beneficiaryBankName: report?.beneficiaryBankName || "",
      disbursementVerified: report?.disbursementVerified || false,
      verificationDate: report?.verificationDate ? format(new Date(report.verificationDate), "yyyy-MM-dd") : "",
      verificationRemarks: report?.verificationRemarks || "",
      commissionReleaseTriggered: report?.commissionReleaseTriggered || false,
      commissionReleaseDate: report?.commissionReleaseDate ? format(new Date(report.commissionReleaseDate), "yyyy-MM-dd") : "",
      ddpCommissionReleased: report?.ddpCommissionReleased?.toString() || "",
      bdpCommissionReleased: report?.bdpCommissionReleased?.toString() || "",
      cpCommissionReleased: report?.cpCommissionReleased?.toString() || "",
      status: report?.status || "pending",
      expectedDisbursementDate: report?.expectedDisbursementDate ? format(new Date(report.expectedDisbursementDate), "yyyy-MM-dd") : "",
      actualProcessingDays: report?.actualProcessingDays?.toString() || "",
      lastFollowUpDate: report?.lastFollowUpDate ? format(new Date(report.lastFollowUpDate), "yyyy-MM-dd") : "",
      nextFollowUpDate: report?.nextFollowUpDate ? format(new Date(report.nextFollowUpDate), "yyyy-MM-dd") : "",
      followUpRemarks: report?.followUpRemarks || "",
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
          <TabsTrigger value="subsidy">Subsidy</TabsTrigger>
          <TabsTrigger value="disbursement">Disbursement</TabsTrigger>
          <TabsTrigger value="commission">Commission</TabsTrigger>
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
          </div>
        </TabsContent>

        <TabsContent value="subsidy" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Portal Application Number</Label><Input value={formData.portalApplicationNumber} onChange={(e) => setFormData({ ...formData, portalApplicationNumber: e.target.value })} /></div>
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
            <div><Label>Central Subsidy Approved (Rs)</Label><Input type="number" value={formData.centralSubsidyApproved} onChange={(e) => setFormData({ ...formData, centralSubsidyApproved: e.target.value })} /></div>
            <div><Label>State Subsidy Approved (Rs)</Label><Input type="number" value={formData.stateSubsidyApproved} onChange={(e) => setFormData({ ...formData, stateSubsidyApproved: e.target.value })} /></div>
            <div><Label>Total Subsidy Approved (Rs)</Label><Input type="number" value={formData.totalSubsidyApproved} onChange={(e) => setFormData({ ...formData, totalSubsidyApproved: e.target.value })} /></div>
          </div>
        </TabsContent>

        <TabsContent value="disbursement" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Disbursement Status</Label>
              <Select value={formData.disbursementStatus} onValueChange={(v) => setFormData({ ...formData, disbursementStatus: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Reference Number</Label><Input value={formData.disbursementReferenceNumber} onChange={(e) => setFormData({ ...formData, disbursementReferenceNumber: e.target.value })} /></div>
            <div><Label>Disbursement Date</Label><Input type="date" value={formData.disbursementDate} onChange={(e) => setFormData({ ...formData, disbursementDate: e.target.value })} /></div>
            <div><Label>Disbursement Amount (Rs)</Label><Input type="number" value={formData.disbursementAmount} onChange={(e) => setFormData({ ...formData, disbursementAmount: e.target.value })} /></div>
            <div><Label>Disbursement Mode</Label>
              <Select value={formData.disbursementMode} onValueChange={(v) => setFormData({ ...formData, disbursementMode: v })}>
                <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="neft">NEFT</SelectItem>
                  <SelectItem value="rtgs">RTGS</SelectItem>
                  <SelectItem value="dbt">DBT (Direct Benefit Transfer)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Beneficiary Name</Label><Input value={formData.beneficiaryName} onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value })} /></div>
            <div><Label>Account Number</Label><Input value={formData.beneficiaryAccountNumber} onChange={(e) => setFormData({ ...formData, beneficiaryAccountNumber: e.target.value })} /></div>
            <div><Label>IFSC Code</Label><Input value={formData.beneficiaryIfsc} onChange={(e) => setFormData({ ...formData, beneficiaryIfsc: e.target.value })} /></div>
            <div><Label>Bank Name</Label><Input value={formData.beneficiaryBankName} onChange={(e) => setFormData({ ...formData, beneficiaryBankName: e.target.value })} /></div>
            <div className="flex items-center gap-2 col-span-2">
              <Switch checked={formData.disbursementVerified} onCheckedChange={(v) => setFormData({ ...formData, disbursementVerified: v })} />
              <Label>Disbursement Verified</Label>
            </div>
            <div><Label>Verification Date</Label><Input type="date" value={formData.verificationDate} onChange={(e) => setFormData({ ...formData, verificationDate: e.target.value })} /></div>
            <div><Label>Verification Remarks</Label><Input value={formData.verificationRemarks} onChange={(e) => setFormData({ ...formData, verificationRemarks: e.target.value })} /></div>
          </div>
        </TabsContent>

        <TabsContent value="commission" className="space-y-4 mt-4">
          <Card className="bg-green-50 dark:bg-green-950 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
                <IndianRupee className="w-5 h-5" />
                Commission Release (50% Released After Subsidy Disbursement)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 col-span-2">
                  <Switch checked={formData.commissionReleaseTriggered} onCheckedChange={(v) => setFormData({ ...formData, commissionReleaseTriggered: v })} />
                  <Label>Commission Release Triggered</Label>
                </div>
                <div><Label>Release Date</Label><Input type="date" value={formData.commissionReleaseDate} onChange={(e) => setFormData({ ...formData, commissionReleaseDate: e.target.value })} /></div>
                <div></div>
                <div><Label>DDP Commission Released (Rs)</Label><Input type="number" value={formData.ddpCommissionReleased} onChange={(e) => setFormData({ ...formData, ddpCommissionReleased: e.target.value })} /></div>
                <div><Label>BDP Commission Released (Rs)</Label><Input type="number" value={formData.bdpCommissionReleased} onChange={(e) => setFormData({ ...formData, bdpCommissionReleased: e.target.value })} /></div>
                <div><Label>CP Commission Released (Rs)</Label><Input type="number" value={formData.cpCommissionReleased} onChange={(e) => setFormData({ ...formData, cpCommissionReleased: e.target.value })} /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="disbursed">Disbursed</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Expected Disbursement Date</Label><Input type="date" value={formData.expectedDisbursementDate} onChange={(e) => setFormData({ ...formData, expectedDisbursementDate: e.target.value })} /></div>
            <div><Label>Actual Processing Days</Label><Input type="number" value={formData.actualProcessingDays} onChange={(e) => setFormData({ ...formData, actualProcessingDays: e.target.value })} /></div>
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

  const totalDisbursed = reports.reduce((sum, r) => sum + (r.disbursementAmount || 0), 0);
  const totalCommissionReleased = reports.reduce((sum, r) => sum + (r.ddpCommissionReleased || 0) + (r.bdpCommissionReleased || 0) + (r.cpCommissionReleased || 0), 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Step 14: Subsidy Disbursement Reports (Final)</h1>
          <p className="text-muted-foreground">Track subsidy disbursement into customer bank accounts and commission release</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-report"><Plus className="w-4 h-4 mr-2" />New Report</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Subsidy Disbursement Report</DialogTitle></DialogHeader>
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
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="disbursed">Disbursed</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{reports.length}</div><p className="text-sm text-muted-foreground">Total Disbursements</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">Rs {totalDisbursed.toLocaleString()}</div><p className="text-sm text-muted-foreground">Total Disbursed</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-blue-600">{reports.filter((r) => r.disbursementVerified).length}</div><p className="text-sm text-muted-foreground">Verified</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-purple-600">Rs {totalCommissionReleased.toLocaleString()}</div><p className="text-sm text-muted-foreground">Commission Released</p></CardContent></Card>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading...</div>
      ) : filteredReports.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No subsidy disbursement reports found</CardContent></Card>
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
                      {report.disbursementVerified && <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Verified</Badge>}
                      {report.commissionReleaseTriggered && <Badge className="bg-purple-100 text-purple-800"><IndianRupee className="w-3 h-3 mr-1" />Commission Released</Badge>}
                    </div>
                    <div className="text-lg font-semibold">{report.customerName}</div>
                    <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div><span className="font-medium">Capacity:</span> {report.installedCapacity} kW</div>
                      <div><span className="font-medium">Approved:</span> Rs {report.totalSubsidyApproved?.toLocaleString() || "-"}</div>
                      <div><span className="font-medium">Disbursed:</span> Rs {report.disbursementAmount?.toLocaleString() || "-"}</div>
                      <div><span className="font-medium">Mode:</span> {report.disbursementMode?.toUpperCase() || "-"}</div>
                    </div>
                    {report.disbursementDate && (
                      <div className="text-sm text-muted-foreground">
                        Disbursed on: {format(new Date(report.disbursementDate), "dd MMM yyyy")}
                      </div>
                    )}
                    {report.commissionReleaseTriggered && (
                      <div className="text-sm text-green-600 dark:text-green-400">
                        Commission: DDP Rs {report.ddpCommissionReleased?.toLocaleString()} | BDP Rs {report.bdpCommissionReleased?.toLocaleString()} | CP Rs {report.cpCommissionReleased?.toLocaleString()}
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
                          <div><strong>Total Approved:</strong> Rs {report.totalSubsidyApproved?.toLocaleString()}</div>
                          <div><strong>Disbursed:</strong> Rs {report.disbursementAmount?.toLocaleString()}</div>
                          <div><strong>Reference #:</strong> {report.disbursementReferenceNumber}</div>
                          <div><strong>Mode:</strong> {report.disbursementMode}</div>
                          <div><strong>Bank:</strong> {report.beneficiaryBankName}</div>
                          <div><strong>Account:</strong> {report.beneficiaryAccountNumber}</div>
                          <div className="col-span-2 border-t pt-2"><strong>Commission Released:</strong></div>
                          <div><strong>DDP:</strong> Rs {report.ddpCommissionReleased?.toLocaleString()}</div>
                          <div><strong>BDP:</strong> Rs {report.bdpCommissionReleased?.toLocaleString()}</div>
                          <div><strong>CP:</strong> Rs {report.cpCommissionReleased?.toLocaleString()}</div>
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
          <DialogHeader><DialogTitle>Edit Subsidy Disbursement Report</DialogTitle></DialogHeader>
          {editingReport && <ReportForm report={editingReport} onSubmit={(data) => updateMutation.mutate({ id: editingReport.id, data })} isLoading={updateMutation.isPending} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
