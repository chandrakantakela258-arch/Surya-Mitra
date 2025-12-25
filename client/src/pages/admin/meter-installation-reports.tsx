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
  Zap, 
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
  Gauge,
  Cable,
  Shield
} from "lucide-react";
import { format } from "date-fns";
import type { MeterInstallationReport, Customer } from "@shared/schema";

const reportStatuses = [
  { value: "pending", label: "Pending" },
  { value: "meter_installed", label: "Meter Installed" },
  { value: "testing", label: "Testing" },
  { value: "grid_connected", label: "Grid Connected" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

const approvalStatuses = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const meterTypes = [
  { value: "net_meter", label: "Net Meter" },
  { value: "bidirectional", label: "Bi-directional Meter" },
  { value: "smart_meter", label: "Smart Meter" },
  { value: "prepaid", label: "Prepaid Meter" },
];

const connectionTypes = [
  { value: "single_phase", label: "Single Phase" },
  { value: "three_phase", label: "Three Phase" },
];

const supplyVoltages = [
  { value: "230V", label: "230V (Single Phase)" },
  { value: "415V", label: "415V (Three Phase)" },
];

const panelTypes = [
  { value: "DCR", label: "DCR (Domestic Content Requirement)" },
  { value: "Non-DCR", label: "Non-DCR" },
];

const inverterTypes = [
  { value: "ongrid", label: "On-Grid Inverter" },
  { value: "hybrid_3in1", label: "Hybrid 3-in-1 Inverter" },
];

export default function AdminMeterInstallationReports() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<MeterInstallationReport | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    customerPhone: "",
    siteAddress: "",
    district: "",
    state: "",
    pincode: "",
    installedCapacity: "",
    panelType: "",
    inverterType: "",
    numberOfPanels: "",
    oldMeterNumber: "",
    oldMeterReading: "",
    newMeterNumber: "",
    newMeterType: "",
    newMeterMake: "",
    newMeterModel: "",
    meterSerialNumber: "",
    meterInstallationDate: "",
    initialMeterReading: "",
    ctRatio: "",
    discomName: "",
    discomDivision: "",
    consumerNumber: "",
    sanctionedLoad: "",
    connectionType: "",
    supplyVoltage: "",
    gridConnectionDate: "",
    synchronizationDate: "",
    discomRepName: "",
    discomRepDesignation: "",
    discomRepPhone: "",
    discomRepEmployeeId: "",
    dcCapacity: "",
    acCapacity: "",
    dcAcRatio: "",
    tiltAngle: "",
    azimuthAngle: "",
    arrayConfiguration: "",
    earthingCompleted: false,
    lightningArresterInstalled: false,
    acdbInstalled: false,
    dcdbInstalled: false,
    mcbRating: "",
    spdInstalled: false,
    gridSyncTestPassed: false,
    antiIslandingTestPassed: false,
    powerQualityTestPassed: false,
    exportLimitSet: false,
    exportLimitValue: "",
    status: "pending",
    discomApprovalStatus: "pending",
    discomApprovalDate: "",
    rejectionReason: "",
    expectedGeneration: "",
    warrantyPeriod: "",
    maintenanceSchedule: "",
    remarks: "",
  });

  const { data: reports = [], isLoading } = useQuery<MeterInstallationReport[]>({
    queryKey: ["/api/admin/meter-installation-reports"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/admin/meter-installation-reports", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/meter-installation-reports"] });
      setIsAddOpen(false);
      resetForm();
      toast({ title: "Meter installation report created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return await apiRequest("PATCH", `/api/admin/meter-installation-reports/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/meter-installation-reports"] });
      setIsEditOpen(false);
      setSelectedReport(null);
      toast({ title: "Report updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/meter-installation-reports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/meter-installation-reports"] });
      toast({ title: "Report deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      customerId: "",
      customerName: "",
      customerPhone: "",
      siteAddress: "",
      district: "",
      state: "",
      pincode: "",
      installedCapacity: "",
      panelType: "",
      inverterType: "",
      numberOfPanels: "",
      oldMeterNumber: "",
      oldMeterReading: "",
      newMeterNumber: "",
      newMeterType: "",
      newMeterMake: "",
      newMeterModel: "",
      meterSerialNumber: "",
      meterInstallationDate: "",
      initialMeterReading: "",
      ctRatio: "",
      discomName: "",
      discomDivision: "",
      consumerNumber: "",
      sanctionedLoad: "",
      connectionType: "",
      supplyVoltage: "",
      gridConnectionDate: "",
      synchronizationDate: "",
      discomRepName: "",
      discomRepDesignation: "",
      discomRepPhone: "",
      discomRepEmployeeId: "",
      dcCapacity: "",
      acCapacity: "",
      dcAcRatio: "",
      tiltAngle: "",
      azimuthAngle: "",
      arrayConfiguration: "",
      earthingCompleted: false,
      lightningArresterInstalled: false,
      acdbInstalled: false,
      dcdbInstalled: false,
      mcbRating: "",
      spdInstalled: false,
      gridSyncTestPassed: false,
      antiIslandingTestPassed: false,
      powerQualityTestPassed: false,
      exportLimitSet: false,
      exportLimitValue: "",
      status: "pending",
      discomApprovalStatus: "pending",
      discomApprovalDate: "",
      rejectionReason: "",
      expectedGeneration: "",
      warrantyPeriod: "",
      maintenanceSchedule: "",
      remarks: "",
    });
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setFormData((prev) => ({
        ...prev,
        customerId,
        customerName: customer.name,
        customerPhone: customer.phone || "",
        siteAddress: customer.address || "",
        district: customer.district || "",
        state: customer.state || "",
        pincode: customer.pincode || "",
        installedCapacity: customer.proposedCapacity || "",
        panelType: customer.panelType || "",
      }));
    }
  };

  const handleEdit = (report: MeterInstallationReport) => {
    setSelectedReport(report);
    setFormData({
      customerId: report.customerId || "",
      customerName: report.customerName,
      customerPhone: report.customerPhone || "",
      siteAddress: report.siteAddress,
      district: report.district || "",
      state: report.state || "",
      pincode: report.pincode || "",
      installedCapacity: report.installedCapacity || "",
      panelType: report.panelType || "",
      inverterType: report.inverterType || "",
      numberOfPanels: report.numberOfPanels?.toString() || "",
      oldMeterNumber: report.oldMeterNumber || "",
      oldMeterReading: report.oldMeterReading || "",
      newMeterNumber: report.newMeterNumber || "",
      newMeterType: report.newMeterType || "",
      newMeterMake: report.newMeterMake || "",
      newMeterModel: report.newMeterModel || "",
      meterSerialNumber: report.meterSerialNumber || "",
      meterInstallationDate: report.meterInstallationDate ? format(new Date(report.meterInstallationDate), "yyyy-MM-dd") : "",
      initialMeterReading: report.initialMeterReading || "",
      ctRatio: report.ctRatio || "",
      discomName: report.discomName || "",
      discomDivision: report.discomDivision || "",
      consumerNumber: report.consumerNumber || "",
      sanctionedLoad: report.sanctionedLoad || "",
      connectionType: report.connectionType || "",
      supplyVoltage: report.supplyVoltage || "",
      gridConnectionDate: report.gridConnectionDate ? format(new Date(report.gridConnectionDate), "yyyy-MM-dd") : "",
      synchronizationDate: report.synchronizationDate ? format(new Date(report.synchronizationDate), "yyyy-MM-dd") : "",
      discomRepName: report.discomRepName || "",
      discomRepDesignation: report.discomRepDesignation || "",
      discomRepPhone: report.discomRepPhone || "",
      discomRepEmployeeId: report.discomRepEmployeeId || "",
      dcCapacity: report.dcCapacity || "",
      acCapacity: report.acCapacity || "",
      dcAcRatio: report.dcAcRatio || "",
      tiltAngle: report.tiltAngle || "",
      azimuthAngle: report.azimuthAngle || "",
      arrayConfiguration: report.arrayConfiguration || "",
      earthingCompleted: report.earthingCompleted || false,
      lightningArresterInstalled: report.lightningArresterInstalled || false,
      acdbInstalled: report.acdbInstalled || false,
      dcdbInstalled: report.dcdbInstalled || false,
      mcbRating: report.mcbRating || "",
      spdInstalled: report.spdInstalled || false,
      gridSyncTestPassed: report.gridSyncTestPassed || false,
      antiIslandingTestPassed: report.antiIslandingTestPassed || false,
      powerQualityTestPassed: report.powerQualityTestPassed || false,
      exportLimitSet: report.exportLimitSet || false,
      exportLimitValue: report.exportLimitValue || "",
      status: report.status || "pending",
      discomApprovalStatus: report.discomApprovalStatus || "pending",
      discomApprovalDate: report.discomApprovalDate ? format(new Date(report.discomApprovalDate), "yyyy-MM-dd") : "",
      rejectionReason: report.rejectionReason || "",
      expectedGeneration: report.expectedGeneration || "",
      warrantyPeriod: report.warrantyPeriod || "",
      maintenanceSchedule: report.maintenanceSchedule || "",
      remarks: report.remarks || "",
    });
    setIsEditOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.customerName || !formData.siteAddress) {
      toast({ title: "Error", description: "Customer name and site address are required", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedReport) return;
    updateMutation.mutate({ id: selectedReport.id, data: formData });
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch = 
      report.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reportNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.newMeterNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.consumerNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string | null) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      meter_installed: { variant: "outline", label: "Meter Installed" },
      testing: { variant: "outline", label: "Testing" },
      grid_connected: { variant: "default", label: "Grid Connected" },
      completed: { variant: "default", label: "Completed" },
      rejected: { variant: "destructive", label: "Rejected" },
    };
    const config = statusConfig[status || "pending"] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getApprovalBadge = (status: string | null) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      approved: { variant: "default", label: "Approved" },
      rejected: { variant: "destructive", label: "Rejected" },
    };
    const config = statusConfig[status || "pending"] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const FormContent = ({ isEdit = false }: { isEdit?: boolean }) => (
    <Tabs defaultValue="customer" className="w-full">
      <TabsList className="grid w-full grid-cols-3 gap-1">
        <TabsTrigger value="customer" className="text-xs">Customer</TabsTrigger>
        <TabsTrigger value="meter" className="text-xs">Meter</TabsTrigger>
        <TabsTrigger value="status" className="text-xs">Status</TabsTrigger>
      </TabsList>

      <TabsContent value="customer" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label>Select Customer</Label>
          <Select value={formData.customerId} onValueChange={handleCustomerSelect}>
            <SelectTrigger data-testid="select-customer">
              <SelectValue placeholder="Select a customer" />
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
            <Label>Customer Name</Label>
            <Input
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              placeholder="Customer name"
              data-testid="input-customer-name"
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              placeholder="Phone number"
              data-testid="input-customer-phone"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Site Address</Label>
          <Textarea
            value={formData.siteAddress}
            onChange={(e) => setFormData({ ...formData, siteAddress: e.target.value })}
            placeholder="Complete site address"
            data-testid="input-site-address"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>District</Label>
            <Input
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              placeholder="District"
              data-testid="input-district"
            />
          </div>
          <div className="space-y-2">
            <Label>State</Label>
            <Input
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="State"
              data-testid="input-state"
            />
          </div>
          <div className="space-y-2">
            <Label>Pincode</Label>
            <Input
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              placeholder="Pincode"
              data-testid="input-pincode"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Installed Capacity (kW)</Label>
            <Input
              value={formData.installedCapacity}
              onChange={(e) => setFormData({ ...formData, installedCapacity: e.target.value })}
              placeholder="e.g., 3"
              data-testid="input-installed-capacity"
            />
          </div>
          <div className="space-y-2">
            <Label>Number of Panels</Label>
            <Input
              type="number"
              value={formData.numberOfPanels}
              onChange={(e) => setFormData({ ...formData, numberOfPanels: e.target.value })}
              placeholder="e.g., 8"
              data-testid="input-number-of-panels"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Panel Type</Label>
            <Select value={formData.panelType} onValueChange={(v) => setFormData({ ...formData, panelType: v })}>
              <SelectTrigger data-testid="select-panel-type">
                <SelectValue placeholder="Select panel type" />
              </SelectTrigger>
              <SelectContent>
                {panelTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Inverter Type</Label>
            <Select value={formData.inverterType} onValueChange={(v) => setFormData({ ...formData, inverterType: v })}>
              <SelectTrigger data-testid="select-inverter-type">
                <SelectValue placeholder="Select inverter type" />
              </SelectTrigger>
              <SelectContent>
                {inverterTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="meter" className="space-y-4 mt-4">
        <h4 className="font-medium text-muted-foreground">Old Meter Details</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Old Meter Number</Label>
            <Input
              value={formData.oldMeterNumber}
              onChange={(e) => setFormData({ ...formData, oldMeterNumber: e.target.value })}
              placeholder="Old meter number"
              data-testid="input-old-meter-number"
            />
          </div>
          <div className="space-y-2">
            <Label>Old Meter Reading</Label>
            <Input
              value={formData.oldMeterReading}
              onChange={(e) => setFormData({ ...formData, oldMeterReading: e.target.value })}
              placeholder="Final reading"
              data-testid="input-old-meter-reading"
            />
          </div>
        </div>
        <h4 className="font-medium text-muted-foreground mt-4">New Meter Details</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>New Meter Number</Label>
            <Input
              value={formData.newMeterNumber}
              onChange={(e) => setFormData({ ...formData, newMeterNumber: e.target.value })}
              placeholder="New meter number"
              data-testid="input-new-meter-number"
            />
          </div>
          <div className="space-y-2">
            <Label>Meter Type</Label>
            <Select value={formData.newMeterType} onValueChange={(v) => setFormData({ ...formData, newMeterType: v })}>
              <SelectTrigger data-testid="select-meter-type">
                <SelectValue placeholder="Select meter type" />
              </SelectTrigger>
              <SelectContent>
                {meterTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Meter Make</Label>
            <Input
              value={formData.newMeterMake}
              onChange={(e) => setFormData({ ...formData, newMeterMake: e.target.value })}
              placeholder="e.g., L&T, Secure"
              data-testid="input-meter-make"
            />
          </div>
          <div className="space-y-2">
            <Label>Meter Model</Label>
            <Input
              value={formData.newMeterModel}
              onChange={(e) => setFormData({ ...formData, newMeterModel: e.target.value })}
              placeholder="Model number"
              data-testid="input-meter-model"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Serial Number</Label>
            <Input
              value={formData.meterSerialNumber}
              onChange={(e) => setFormData({ ...formData, meterSerialNumber: e.target.value })}
              placeholder="Serial number"
              data-testid="input-serial-number"
            />
          </div>
          <div className="space-y-2">
            <Label>Installation Date</Label>
            <Input
              type="date"
              value={formData.meterInstallationDate}
              onChange={(e) => setFormData({ ...formData, meterInstallationDate: e.target.value })}
              data-testid="input-installation-date"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Initial Meter Reading</Label>
            <Input
              value={formData.initialMeterReading}
              onChange={(e) => setFormData({ ...formData, initialMeterReading: e.target.value })}
              placeholder="Initial reading (usually 0)"
              data-testid="input-initial-reading"
            />
          </div>
          <div className="space-y-2">
            <Label>CT Ratio (if applicable)</Label>
            <Input
              value={formData.ctRatio}
              onChange={(e) => setFormData({ ...formData, ctRatio: e.target.value })}
              placeholder="e.g., 100:5"
              data-testid="input-ct-ratio"
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="status" className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Report Status</Label>
            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
              <SelectTrigger data-testid="select-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {reportStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>DISCOM Approval</Label>
            <Select value={formData.discomApprovalStatus} onValueChange={(v) => setFormData({ ...formData, discomApprovalStatus: v })}>
              <SelectTrigger data-testid="select-discom-approval">
                <SelectValue placeholder="Select approval status" />
              </SelectTrigger>
              <SelectContent>
                {approvalStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {formData.discomApprovalStatus !== "pending" && (
          <div className="space-y-2">
            <Label>DISCOM Approval Date</Label>
            <Input
              type="date"
              value={formData.discomApprovalDate}
              onChange={(e) => setFormData({ ...formData, discomApprovalDate: e.target.value })}
              data-testid="input-approval-date"
            />
          </div>
        )}
        {(formData.status === "rejected" || formData.discomApprovalStatus === "rejected") && (
          <div className="space-y-2">
            <Label>Rejection Reason</Label>
            <Textarea
              value={formData.rejectionReason}
              onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })}
              placeholder="Reason for rejection"
              data-testid="input-rejection-reason"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label>Remarks</Label>
          <Textarea
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="Additional remarks or notes"
            data-testid="input-remarks"
          />
        </div>
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Meter Installation Reports
          </h1>
          <p className="text-muted-foreground">
            Step 10: Track grid connection and meter installation completion
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsAddOpen(true); }} data-testid="button-add-report">
          <Plus className="h-4 w-4 mr-2" />
          New Report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer, report number, meter number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {reportStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Zap className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No meter installation reports found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>New Meter</TableHead>
                  <TableHead>Grid Connection</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>DISCOM</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id} data-testid={`row-report-${report.id}`}>
                    <TableCell className="font-medium">{report.reportNumber}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{report.customerName}</span>
                        <span className="text-xs text-muted-foreground">{report.customerPhone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{report.district}</span>
                        <span className="text-xs text-muted-foreground">{report.state}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{report.newMeterNumber || "-"}</span>
                        <span className="text-xs text-muted-foreground">{report.newMeterType || ""}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {report.gridConnectionDate ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(report.gridConnectionDate), "dd/MM/yyyy")}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell>{getApprovalBadge(report.discomApprovalStatus)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(report)}
                          data-testid={`button-edit-${report.id}`}
                        >
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              New Meter Installation Report
            </DialogTitle>
          </DialogHeader>
          <FormContent />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-submit">
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Report: {selectedReport?.reportNumber}
            </DialogTitle>
          </DialogHeader>
          <FormContent isEdit />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending} data-testid="button-update">
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
