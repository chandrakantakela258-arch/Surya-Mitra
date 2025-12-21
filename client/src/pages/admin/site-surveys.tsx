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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ClipboardList, 
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
  Zap,
  Home
} from "lucide-react";
import { format } from "date-fns";
import type { SiteSurvey, Customer } from "@shared/schema";

const surveyStatuses = [
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const approvalStatuses = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const roofConditions = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

const roofTypes = [
  { value: "RCC", label: "RCC (Reinforced Cement Concrete)" },
  { value: "tin", label: "Tin/Metal Sheet" },
  { value: "tile", label: "Tile" },
  { value: "asbestos", label: "Asbestos" },
  { value: "other", label: "Other" },
];

const feasibilityOptions = [
  { value: "feasible", label: "Feasible" },
  { value: "needs_reinforcement", label: "Needs Reinforcement" },
  { value: "needs_upgrade", label: "Needs Upgrade" },
  { value: "not_feasible", label: "Not Feasible" },
];

const shadowOptions = [
  { value: "none", label: "No Shadow" },
  { value: "minimal", label: "Minimal Shadow" },
  { value: "moderate", label: "Moderate Shadow" },
  { value: "significant", label: "Significant Shadow" },
];

const recommendationOptions = [
  { value: "approved", label: "Approved" },
  { value: "conditional", label: "Conditional Approval" },
  { value: "rejected", label: "Rejected" },
];

export default function AdminSiteSurveys() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<SiteSurvey | null>(null);
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
    scheduledDate: format(new Date(), "yyyy-MM-dd"),
    surveyTime: "",
    bankName: "",
    bankBranch: "",
    bankStaffName: "",
    bankStaffDesignation: "",
    bankStaffPhone: "",
    bankSurveyCompleted: false,
    bankSurveyDate: "",
    bankSurveyNotes: "",
    bankApprovalStatus: "pending",
    discomName: "",
    discomDivision: "",
    discomRepName: "",
    discomRepDesignation: "",
    discomRepPhone: "",
    discomSurveyCompleted: false,
    discomSurveyDate: "",
    discomSurveyNotes: "",
    discomApprovalStatus: "pending",
    roofCondition: "",
    roofType: "",
    roofArea: "",
    shadowAnalysis: "",
    structuralFeasibility: "",
    electricalFeasibility: "",
    existingMeterType: "",
    meterLocation: "",
    sanctionedLoad: "",
    proposedCapacity: "",
    gridConnectionDistance: "",
    status: "scheduled",
    overallRecommendation: "",
    recommendedCapacity: "",
    specialConditions: "",
    rejectionReason: "",
    remarks: "",
  });

  const { data: surveys = [], isLoading } = useQuery<SiteSurvey[]>({
    queryKey: ["/api/admin/site-surveys"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/admin/site-surveys", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-surveys"] });
      toast({ title: "Site survey scheduled successfully" });
      setIsAddOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create survey", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return await apiRequest("PATCH", `/api/admin/site-surveys/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-surveys"] });
      toast({ title: "Site survey updated successfully" });
      setIsEditOpen(false);
      setSelectedSurvey(null);
    },
    onError: () => {
      toast({ title: "Failed to update survey", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/site-surveys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-surveys"] });
      toast({ title: "Site survey deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete survey", variant: "destructive" });
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
      scheduledDate: format(new Date(), "yyyy-MM-dd"),
      surveyTime: "",
      bankName: "",
      bankBranch: "",
      bankStaffName: "",
      bankStaffDesignation: "",
      bankStaffPhone: "",
      bankSurveyCompleted: false,
      bankSurveyDate: "",
      bankSurveyNotes: "",
      bankApprovalStatus: "pending",
      discomName: "",
      discomDivision: "",
      discomRepName: "",
      discomRepDesignation: "",
      discomRepPhone: "",
      discomSurveyCompleted: false,
      discomSurveyDate: "",
      discomSurveyNotes: "",
      discomApprovalStatus: "pending",
      roofCondition: "",
      roofType: "",
      roofArea: "",
      shadowAnalysis: "",
      structuralFeasibility: "",
      electricalFeasibility: "",
      existingMeterType: "",
      meterLocation: "",
      sanctionedLoad: "",
      proposedCapacity: "",
      gridConnectionDistance: "",
      status: "scheduled",
      overallRecommendation: "",
      recommendedCapacity: "",
      specialConditions: "",
      rejectionReason: "",
      remarks: "",
    });
  };

  const handleEdit = (survey: SiteSurvey) => {
    setSelectedSurvey(survey);
    setFormData({
      customerId: survey.customerId || "",
      customerName: survey.customerName,
      customerPhone: survey.customerPhone || "",
      siteAddress: survey.siteAddress,
      district: survey.district || "",
      state: survey.state || "",
      pincode: survey.pincode || "",
      scheduledDate: survey.scheduledDate ? format(new Date(survey.scheduledDate), "yyyy-MM-dd") : "",
      surveyTime: survey.surveyTime || "",
      bankName: survey.bankName || "",
      bankBranch: survey.bankBranch || "",
      bankStaffName: survey.bankStaffName || "",
      bankStaffDesignation: survey.bankStaffDesignation || "",
      bankStaffPhone: survey.bankStaffPhone || "",
      bankSurveyCompleted: survey.bankSurveyCompleted || false,
      bankSurveyDate: survey.bankSurveyDate ? format(new Date(survey.bankSurveyDate), "yyyy-MM-dd") : "",
      bankSurveyNotes: survey.bankSurveyNotes || "",
      bankApprovalStatus: survey.bankApprovalStatus || "pending",
      discomName: survey.discomName || "",
      discomDivision: survey.discomDivision || "",
      discomRepName: survey.discomRepName || "",
      discomRepDesignation: survey.discomRepDesignation || "",
      discomRepPhone: survey.discomRepPhone || "",
      discomSurveyCompleted: survey.discomSurveyCompleted || false,
      discomSurveyDate: survey.discomSurveyDate ? format(new Date(survey.discomSurveyDate), "yyyy-MM-dd") : "",
      discomSurveyNotes: survey.discomSurveyNotes || "",
      discomApprovalStatus: survey.discomApprovalStatus || "pending",
      roofCondition: survey.roofCondition || "",
      roofType: survey.roofType || "",
      roofArea: survey.roofArea?.toString() || "",
      shadowAnalysis: survey.shadowAnalysis || "",
      structuralFeasibility: survey.structuralFeasibility || "",
      electricalFeasibility: survey.electricalFeasibility || "",
      existingMeterType: survey.existingMeterType || "",
      meterLocation: survey.meterLocation || "",
      sanctionedLoad: survey.sanctionedLoad || "",
      proposedCapacity: survey.proposedCapacity || "",
      gridConnectionDistance: survey.gridConnectionDistance || "",
      status: survey.status || "scheduled",
      overallRecommendation: survey.overallRecommendation || "",
      recommendedCapacity: survey.recommendedCapacity || "",
      specialConditions: survey.specialConditions || "",
      rejectionReason: survey.rejectionReason || "",
      remarks: survey.remarks || "",
    });
    setIsEditOpen(true);
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId,
        customerName: customer.name,
        customerPhone: customer.phone,
        siteAddress: customer.address,
        district: customer.district,
        state: customer.state,
        pincode: customer.pincode,
        roofType: customer.roofType || "",
        proposedCapacity: customer.proposedCapacity || "",
        sanctionedLoad: customer.sanctionedLoad || "",
      }));
    }
  };

  const handleCreate = () => {
    if (!formData.customerName || !formData.siteAddress || !formData.scheduledDate) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedSurvey) return;
    updateMutation.mutate({
      id: selectedSurvey.id,
      data: formData,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      scheduled: { variant: "outline", label: "Scheduled" },
      in_progress: { variant: "secondary", label: "In Progress" },
      completed: { variant: "default", label: "Completed" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };
    const config = statusConfig[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getApprovalBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">Pending</Badge>;
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "outline", label: "Pending" },
      approved: { variant: "default", label: "Approved" },
      rejected: { variant: "destructive", label: "Rejected" },
    };
    const config = statusConfig[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredSurveys = surveys.filter((survey) => {
    const matchesSearch = 
      survey.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      survey.surveyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (survey.siteAddress && survey.siteAddress.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || survey.status === statusFilter;
    return matchesSearch && matchesStatus;
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
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Step 3: Site Surveys</h1>
          <p className="text-muted-foreground">Bank Staff & DISCOM Representative Site Visits</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} data-testid="button-add-survey">
          <Plus className="mr-2 h-4 w-4" />
          Schedule Survey
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Site Surveys ({filteredSurveys.length})
            </CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search surveys..."
                  className="pl-8 w-full sm:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40" data-testid="select-status-filter">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {surveyStatuses.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSurveys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No site surveys found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Survey #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Bank Survey</TableHead>
                    <TableHead>DISCOM Survey</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSurveys.map((survey) => (
                    <TableRow key={survey.id} data-testid={`row-survey-${survey.id}`}>
                      <TableCell className="font-mono text-sm">{survey.surveyNumber}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{survey.customerName}</span>
                          {survey.customerPhone && (
                            <span className="text-xs text-muted-foreground">{survey.customerPhone}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col max-w-48">
                          <span className="truncate">{survey.siteAddress}</span>
                          {survey.district && (
                            <span className="text-xs text-muted-foreground">{survey.district}, {survey.state}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {survey.scheduledDate && (
                          <div className="flex flex-col">
                            <span>{format(new Date(survey.scheduledDate), "dd MMM yyyy")}</span>
                            {survey.surveyTime && (
                              <span className="text-xs text-muted-foreground">{survey.surveyTime}</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {survey.bankSurveyCompleted ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                          {getApprovalBadge(survey.bankApprovalStatus)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {survey.discomSurveyCompleted ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                          {getApprovalBadge(survey.discomApprovalStatus)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(survey.status || "scheduled")}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(survey)}
                            data-testid={`button-edit-${survey.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm("Delete this survey?")) {
                                deleteMutation.mutate(survey.id);
                              }
                            }}
                            data-testid={`button-delete-${survey.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Site Survey</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="customer" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="customer">Customer & Site</TabsTrigger>
              <TabsTrigger value="bank">Bank Staff</TabsTrigger>
              <TabsTrigger value="discom">DISCOM Rep</TabsTrigger>
            </TabsList>
            <TabsContent value="customer" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Select Customer (Optional)</Label>
                  <Select value={formData.customerId} onValueChange={handleCustomerSelect}>
                    <SelectTrigger data-testid="select-customer">
                      <SelectValue placeholder="Select existing customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name} - {c.phone}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Customer Name *</Label>
                  <Input
                    value={formData.customerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                    data-testid="input-customer-name"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.customerPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                    data-testid="input-customer-phone"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Site Address *</Label>
                  <Textarea
                    value={formData.siteAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, siteAddress: e.target.value }))}
                    data-testid="input-site-address"
                  />
                </div>
                <div>
                  <Label>District</Label>
                  <Input
                    value={formData.district}
                    onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                    data-testid="input-district"
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    data-testid="input-state"
                  />
                </div>
                <div>
                  <Label>Pincode</Label>
                  <Input
                    value={formData.pincode}
                    onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                    data-testid="input-pincode"
                  />
                </div>
                <div>
                  <Label>Scheduled Date *</Label>
                  <Input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    data-testid="input-scheduled-date"
                  />
                </div>
                <div>
                  <Label>Survey Time</Label>
                  <Input
                    type="time"
                    value={formData.surveyTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, surveyTime: e.target.value }))}
                    data-testid="input-survey-time"
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="bank" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Bank Name</Label>
                  <Input
                    value={formData.bankName}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                    data-testid="input-bank-name"
                  />
                </div>
                <div>
                  <Label>Bank Branch</Label>
                  <Input
                    value={formData.bankBranch}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankBranch: e.target.value }))}
                    data-testid="input-bank-branch"
                  />
                </div>
                <div>
                  <Label>Staff Name</Label>
                  <Input
                    value={formData.bankStaffName}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankStaffName: e.target.value }))}
                    data-testid="input-bank-staff-name"
                  />
                </div>
                <div>
                  <Label>Designation</Label>
                  <Input
                    value={formData.bankStaffDesignation}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankStaffDesignation: e.target.value }))}
                    data-testid="input-bank-staff-designation"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.bankStaffPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankStaffPhone: e.target.value }))}
                    data-testid="input-bank-staff-phone"
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="discom" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>DISCOM Name</Label>
                  <Input
                    value={formData.discomName}
                    onChange={(e) => setFormData(prev => ({ ...prev, discomName: e.target.value }))}
                    data-testid="input-discom-name"
                  />
                </div>
                <div>
                  <Label>Division</Label>
                  <Input
                    value={formData.discomDivision}
                    onChange={(e) => setFormData(prev => ({ ...prev, discomDivision: e.target.value }))}
                    data-testid="input-discom-division"
                  />
                </div>
                <div>
                  <Label>Representative Name</Label>
                  <Input
                    value={formData.discomRepName}
                    onChange={(e) => setFormData(prev => ({ ...prev, discomRepName: e.target.value }))}
                    data-testid="input-discom-rep-name"
                  />
                </div>
                <div>
                  <Label>Designation</Label>
                  <Input
                    value={formData.discomRepDesignation}
                    onChange={(e) => setFormData(prev => ({ ...prev, discomRepDesignation: e.target.value }))}
                    data-testid="input-discom-rep-designation"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.discomRepPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, discomRepPhone: e.target.value }))}
                    data-testid="input-discom-rep-phone"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <div>
            <Label>Remarks</Label>
            <Textarea
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              data-testid="input-remarks"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} data-testid="button-submit-survey">
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Schedule Survey
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Site Survey - {selectedSurvey?.surveyNumber}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="customer" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="bank">Bank Survey</TabsTrigger>
              <TabsTrigger value="discom">DISCOM Survey</TabsTrigger>
              <TabsTrigger value="assessment">Site Assessment</TabsTrigger>
              <TabsTrigger value="outcome">Outcome</TabsTrigger>
            </TabsList>
            <TabsContent value="customer" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer Name *</Label>
                  <Input
                    value={formData.customerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.customerPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Site Address *</Label>
                  <Textarea
                    value={formData.siteAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, siteAddress: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>District</Label>
                  <Input
                    value={formData.district}
                    onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Scheduled Date</Label>
                  <Input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Survey Time</Label>
                  <Input
                    type="time"
                    value={formData.surveyTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, surveyTime: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {surveyStatuses.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="bank" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Bank Name</Label>
                  <Input
                    value={formData.bankName}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Branch</Label>
                  <Input
                    value={formData.bankBranch}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankBranch: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Staff Name</Label>
                  <Input
                    value={formData.bankStaffName}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankStaffName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Designation</Label>
                  <Input
                    value={formData.bankStaffDesignation}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankStaffDesignation: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.bankStaffPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankStaffPhone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Survey Date</Label>
                  <Input
                    type="date"
                    value={formData.bankSurveyDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankSurveyDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Survey Completed</Label>
                  <Select 
                    value={formData.bankSurveyCompleted ? "true" : "false"} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, bankSurveyCompleted: v === "true" }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">No</SelectItem>
                      <SelectItem value="true">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Approval Status</Label>
                  <Select 
                    value={formData.bankApprovalStatus} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, bankApprovalStatus: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {approvalStatuses.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Survey Notes</Label>
                  <Textarea
                    value={formData.bankSurveyNotes}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankSurveyNotes: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="discom" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>DISCOM Name</Label>
                  <Input
                    value={formData.discomName}
                    onChange={(e) => setFormData(prev => ({ ...prev, discomName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Division</Label>
                  <Input
                    value={formData.discomDivision}
                    onChange={(e) => setFormData(prev => ({ ...prev, discomDivision: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Representative Name</Label>
                  <Input
                    value={formData.discomRepName}
                    onChange={(e) => setFormData(prev => ({ ...prev, discomRepName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Designation</Label>
                  <Input
                    value={formData.discomRepDesignation}
                    onChange={(e) => setFormData(prev => ({ ...prev, discomRepDesignation: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.discomRepPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, discomRepPhone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Survey Date</Label>
                  <Input
                    type="date"
                    value={formData.discomSurveyDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, discomSurveyDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Survey Completed</Label>
                  <Select 
                    value={formData.discomSurveyCompleted ? "true" : "false"} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, discomSurveyCompleted: v === "true" }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">No</SelectItem>
                      <SelectItem value="true">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Approval Status</Label>
                  <Select 
                    value={formData.discomApprovalStatus} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, discomApprovalStatus: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {approvalStatuses.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Survey Notes</Label>
                  <Textarea
                    value={formData.discomSurveyNotes}
                    onChange={(e) => setFormData(prev => ({ ...prev, discomSurveyNotes: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="assessment" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Roof Condition</Label>
                  <Select 
                    value={formData.roofCondition} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, roofCondition: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {roofConditions.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Roof Type</Label>
                  <Select 
                    value={formData.roofType} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, roofType: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {roofTypes.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Roof Area (sq ft)</Label>
                  <Input
                    type="number"
                    value={formData.roofArea}
                    onChange={(e) => setFormData(prev => ({ ...prev, roofArea: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Shadow Analysis</Label>
                  <Select 
                    value={formData.shadowAnalysis} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, shadowAnalysis: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select shadow level" />
                    </SelectTrigger>
                    <SelectContent>
                      {shadowOptions.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Structural Feasibility</Label>
                  <Select 
                    value={formData.structuralFeasibility} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, structuralFeasibility: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select feasibility" />
                    </SelectTrigger>
                    <SelectContent>
                      {feasibilityOptions.map(f => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Electrical Feasibility</Label>
                  <Select 
                    value={formData.electricalFeasibility} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, electricalFeasibility: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select feasibility" />
                    </SelectTrigger>
                    <SelectContent>
                      {feasibilityOptions.map(f => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Existing Meter Type</Label>
                  <Input
                    value={formData.existingMeterType}
                    onChange={(e) => setFormData(prev => ({ ...prev, existingMeterType: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Meter Location</Label>
                  <Input
                    value={formData.meterLocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, meterLocation: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Sanctioned Load</Label>
                  <Input
                    value={formData.sanctionedLoad}
                    onChange={(e) => setFormData(prev => ({ ...prev, sanctionedLoad: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Proposed Capacity (kW)</Label>
                  <Input
                    value={formData.proposedCapacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, proposedCapacity: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Grid Connection Distance</Label>
                  <Input
                    value={formData.gridConnectionDistance}
                    onChange={(e) => setFormData(prev => ({ ...prev, gridConnectionDistance: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="outcome" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Overall Recommendation</Label>
                  <Select 
                    value={formData.overallRecommendation} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, overallRecommendation: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recommendation" />
                    </SelectTrigger>
                    <SelectContent>
                      {recommendationOptions.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Recommended Capacity (kW)</Label>
                  <Input
                    value={formData.recommendedCapacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, recommendedCapacity: e.target.value }))}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Special Conditions</Label>
                  <Textarea
                    value={formData.specialConditions}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialConditions: e.target.value }))}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Rejection Reason (if rejected)</Label>
                  <Textarea
                    value={formData.rejectionReason}
                    onChange={(e) => setFormData(prev => ({ ...prev, rejectionReason: e.target.value }))}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Remarks</Label>
                  <Textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Survey
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
