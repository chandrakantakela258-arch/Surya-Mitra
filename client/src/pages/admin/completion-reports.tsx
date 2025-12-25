import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  FileCheck, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Camera,
  Star,
  Send,
  ThumbsUp,
  ThumbsDown,
  Image,
} from "lucide-react";
import { format } from "date-fns";
import type { SiteExecutionCompletionReport, SiteExecutionOrder, Vendor } from "@shared/schema";

const reportStatuses = ["draft", "submitted", "under_review", "approved", "rejected"] as const;

export default function AdminCompletionReports() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<SiteExecutionCompletionReport | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  
  const beforePhotosRef = useRef<HTMLInputElement>(null);
  const duringPhotosRef = useRef<HTMLInputElement>(null);
  const afterPhotosRef = useRef<HTMLInputElement>(null);
  const panelPhotosRef = useRef<HTMLInputElement>(null);
  const inverterPhotosRef = useRef<HTMLInputElement>(null);
  const wiringPhotosRef = useRef<HTMLInputElement>(null);
  const meterPhotosRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    executionOrderId: "",
    vendorId: "",
    customerName: "",
    siteAddress: "",
    completionDate: format(new Date(), "yyyy-MM-dd"),
    workSummary: "",
    scopeCompletedAs: "as_planned",
    deviationsNotes: "",
    materialsUsed: "",
    extraMaterialsUsed: "",
    totalWorkHours: "",
    crewSize: "",
    panelsInstalled: "",
    inverterInstalled: "",
    wiringCompleted: false,
    earthingCompleted: false,
    meterConnected: false,
    gridSyncCompleted: false,
    meterReading: "",
    generationTestPassed: false,
    testReadingKw: "",
    qualityChecklistCompleted: false,
    safetyChecklistCompleted: false,
    cleanupCompleted: false,
    customerBriefingDone: false,
    customerName2: "",
    customerPhone: "",
    customerFeedback: "",
    customerRating: "",
    vendorRepName: "",
    vendorRepPhone: "",
    status: "draft",
    remarks: "",
  });

  const { data: reports = [], isLoading } = useQuery<SiteExecutionCompletionReport[]>({
    queryKey: ["/api/admin/completion-reports"],
  });

  const { data: executionOrders = [] } = useQuery<SiteExecutionOrder[]>({
    queryKey: ["/api/admin/site-execution-orders"],
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/admin/vendors"],
  });

  const createMutation = useMutation({
    mutationFn: async (formDataObj: FormData) => {
      const response = await fetch("/api/admin/completion-reports", {
        method: "POST",
        body: formDataObj,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create report");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/completion-reports"] });
      setIsAddOpen(false);
      resetForm();
      toast({ title: "Completion report created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create report", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formDataObj }: { id: string; formDataObj: FormData }) => {
      const response = await fetch(`/api/admin/completion-reports/${id}`, {
        method: "PATCH",
        body: formDataObj,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update report");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/completion-reports"] });
      setIsEditOpen(false);
      setSelectedReport(null);
      resetForm();
      toast({ title: "Completion report updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update report", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/completion-reports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/completion-reports"] });
      toast({ title: "Completion report deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete report", description: error.message, variant: "destructive" });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action, notes, rejectionReason }: { id: string; action: string; notes: string; rejectionReason: string }) => {
      return await apiRequest("POST", `/api/admin/completion-reports/${id}/review`, { action, notes, rejectionReason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/completion-reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-execution-orders"] });
      setIsReviewOpen(false);
      setSelectedReport(null);
      toast({ title: reviewAction === "approve" ? "Report approved" : "Report rejected" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to review report", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      executionOrderId: "",
      vendorId: "",
      customerName: "",
      siteAddress: "",
      completionDate: format(new Date(), "yyyy-MM-dd"),
      workSummary: "",
      scopeCompletedAs: "as_planned",
      deviationsNotes: "",
      materialsUsed: "",
      extraMaterialsUsed: "",
      totalWorkHours: "",
      crewSize: "",
      panelsInstalled: "",
      inverterInstalled: "",
      wiringCompleted: false,
      earthingCompleted: false,
      meterConnected: false,
      gridSyncCompleted: false,
      meterReading: "",
      generationTestPassed: false,
      testReadingKw: "",
      qualityChecklistCompleted: false,
      safetyChecklistCompleted: false,
      cleanupCompleted: false,
      customerBriefingDone: false,
      customerName2: "",
      customerPhone: "",
      customerFeedback: "",
      customerRating: "",
      vendorRepName: "",
      vendorRepPhone: "",
      status: "draft",
      remarks: "",
    });
    setActiveTab("basic");
  };

  const handleAddOpen = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleEdit = (report: SiteExecutionCompletionReport) => {
    setSelectedReport(report);
    setFormData({
      executionOrderId: report.executionOrderId || "",
      vendorId: report.vendorId || "",
      customerName: report.customerName || "",
      siteAddress: report.siteAddress || "",
      completionDate: report.completionDate ? format(new Date(report.completionDate), "yyyy-MM-dd") : "",
      workSummary: report.workSummary || "",
      scopeCompletedAs: report.scopeCompletedAs || "as_planned",
      deviationsNotes: report.deviationsNotes || "",
      materialsUsed: report.materialsUsed || "",
      extraMaterialsUsed: report.extraMaterialsUsed || "",
      totalWorkHours: report.totalWorkHours?.toString() || "",
      crewSize: report.crewSize?.toString() || "",
      panelsInstalled: report.panelsInstalled?.toString() || "",
      inverterInstalled: report.inverterInstalled || "",
      wiringCompleted: report.wiringCompleted || false,
      earthingCompleted: report.earthingCompleted || false,
      meterConnected: report.meterConnected || false,
      gridSyncCompleted: report.gridSyncCompleted || false,
      meterReading: report.meterReading || "",
      generationTestPassed: report.generationTestPassed || false,
      testReadingKw: report.testReadingKw || "",
      qualityChecklistCompleted: report.qualityChecklistCompleted || false,
      safetyChecklistCompleted: report.safetyChecklistCompleted || false,
      cleanupCompleted: report.cleanupCompleted || false,
      customerBriefingDone: report.customerBriefingDone || false,
      customerName2: report.customerName2 || "",
      customerPhone: report.customerPhone || "",
      customerFeedback: report.customerFeedback || "",
      customerRating: report.customerRating?.toString() || "",
      vendorRepName: report.vendorRepName || "",
      vendorRepPhone: report.vendorRepPhone || "",
      status: report.status || "draft",
      remarks: report.remarks || "",
    });
    setIsEditOpen(true);
  };

  const handleView = (report: SiteExecutionCompletionReport) => {
    setSelectedReport(report);
    setIsViewOpen(true);
  };

  const handleReview = (report: SiteExecutionCompletionReport) => {
    setSelectedReport(report);
    setReviewNotes("");
    setRejectionReason("");
    setReviewAction("approve");
    setIsReviewOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formDataObj = new FormData();
    
    Object.entries(formData).forEach(([key, value]) => {
      formDataObj.append(key, value.toString());
    });
    
    if (beforePhotosRef.current?.files) {
      Array.from(beforePhotosRef.current.files).forEach(file => {
        formDataObj.append('beforePhotos', file);
      });
    }
    if (duringPhotosRef.current?.files) {
      Array.from(duringPhotosRef.current.files).forEach(file => {
        formDataObj.append('duringPhotos', file);
      });
    }
    if (afterPhotosRef.current?.files) {
      Array.from(afterPhotosRef.current.files).forEach(file => {
        formDataObj.append('afterPhotos', file);
      });
    }
    if (panelPhotosRef.current?.files) {
      Array.from(panelPhotosRef.current.files).forEach(file => {
        formDataObj.append('panelPhotos', file);
      });
    }
    if (inverterPhotosRef.current?.files) {
      Array.from(inverterPhotosRef.current.files).forEach(file => {
        formDataObj.append('inverterPhotos', file);
      });
    }
    if (wiringPhotosRef.current?.files) {
      Array.from(wiringPhotosRef.current.files).forEach(file => {
        formDataObj.append('wiringPhotos', file);
      });
    }
    if (meterPhotosRef.current?.files) {
      Array.from(meterPhotosRef.current.files).forEach(file => {
        formDataObj.append('meterPhotos', file);
      });
    }

    if (isEditOpen && selectedReport) {
      updateMutation.mutate({ id: selectedReport.id, formDataObj });
    } else {
      createMutation.mutate(formDataObj);
    }
  };

  const handleReviewSubmit = () => {
    if (!selectedReport) return;
    reviewMutation.mutate({
      id: selectedReport.id,
      action: reviewAction,
      notes: reviewNotes,
      rejectionReason,
    });
  };

  const handleExecutionOrderChange = (orderId: string) => {
    const order = executionOrders.find(o => o.id === orderId);
    if (order) {
      setFormData(prev => ({
        ...prev,
        executionOrderId: orderId,
        vendorId: order.vendorId || "",
        customerName: order.customerName || "",
        siteAddress: order.siteAddress || "",
        panelsInstalled: order.numberOfPanels?.toString() || "",
        inverterInstalled: order.inverterType || "",
      }));
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; icon: any }> = {
      draft: { variant: "secondary", icon: Clock },
      submitted: { variant: "default", icon: Send },
      under_review: { variant: "outline", icon: Eye },
      approved: { variant: "default", icon: CheckCircle },
      rejected: { variant: "destructive", icon: XCircle },
    };
    const config = variants[status] || variants.draft;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {status?.replace(/_/g, " ").toUpperCase()}
      </Badge>
    );
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.reportNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.siteAddress?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: reports.length,
    draft: reports.filter(r => r.status === "draft").length,
    submitted: reports.filter(r => r.status === "submitted").length,
    underReview: reports.filter(r => r.status === "under_review").length,
    approved: reports.filter(r => r.status === "approved").length,
    rejected: reports.filter(r => r.status === "rejected").length,
  };

  const PhotoGallery = ({ photos, title }: { photos: string[] | null; title: string }) => {
    if (!photos || photos.length === 0) return null;
    return (
      <div className="space-y-2">
        <Label className="font-medium">{title}</Label>
        <div className="flex flex-wrap gap-2">
          {photos.map((photo, idx) => (
            <a key={idx} href={photo} target="_blank" rel="noopener noreferrer">
              <img 
                src={photo} 
                alt={`${title} ${idx + 1}`} 
                className="w-20 h-20 object-cover rounded-md border hover:opacity-80 transition-opacity"
              />
            </a>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileCheck className="w-6 h-6" />
            Step 8: Completion Reports
          </h1>
          <p className="text-muted-foreground">
            Manage site execution completion reports with vendor-uploaded photos
          </p>
        </div>
        <Button onClick={handleAddOpen} data-testid="button-add-report">
          <Plus className="w-4 h-4 mr-2" />
          Add Report
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Reports</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-500">{stats.draft}</div>
            <div className="text-sm text-muted-foreground">Draft</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-500">{stats.submitted}</div>
            <div className="text-sm text-muted-foreground">Submitted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-500">{stats.underReview}</div>
            <div className="text-sm text-muted-foreground">Under Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-500">{stats.approved}</div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-500">{stats.rejected}</div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
          <CardTitle>Completion Reports</CardTitle>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
                data-testid="input-search-reports"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {reportStatuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status.replace(/_/g, " ").toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No completion reports found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Site Address</TableHead>
                  <TableHead>Completion Date</TableHead>
                  <TableHead>Photos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => {
                  const photoCount = 
                    (report.beforePhotos?.length || 0) +
                    (report.duringPhotos?.length || 0) +
                    (report.afterPhotos?.length || 0) +
                    (report.panelPhotos?.length || 0) +
                    (report.inverterPhotos?.length || 0) +
                    (report.wiringPhotos?.length || 0) +
                    (report.meterPhotos?.length || 0);
                  
                  return (
                    <TableRow key={report.id} data-testid={`row-report-${report.id}`}>
                      <TableCell className="font-mono text-sm">{report.reportNumber}</TableCell>
                      <TableCell>{report.customerName}</TableCell>
                      <TableCell className="max-w-48 truncate">{report.siteAddress}</TableCell>
                      <TableCell>
                        {report.completionDate ? format(new Date(report.completionDate), "dd MMM yyyy") : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Image className="w-3 h-3" />
                          {photoCount}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status || "draft")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleView(report)} data-testid={`button-view-${report.id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(report)} data-testid={`button-edit-${report.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          {(report.status === "submitted" || report.status === "under_review") && (
                            <Button size="icon" variant="ghost" onClick={() => handleReview(report)} data-testid={`button-review-${report.id}`}>
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this report?")) {
                                deleteMutation.mutate(report.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${report.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => { if (!open) { setIsAddOpen(false); setIsEditOpen(false); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditOpen ? "Edit Completion Report" : "Create Completion Report"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="installation">Installation</TabsTrigger>
                <TabsTrigger value="photos">Photos</TabsTrigger>
                <TabsTrigger value="checklist">Checklists</TabsTrigger>
                <TabsTrigger value="signatures">Signatures</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Execution Order</Label>
                    <Select value={formData.executionOrderId} onValueChange={handleExecutionOrderChange}>
                      <SelectTrigger data-testid="select-execution-order">
                        <SelectValue placeholder="Select order" />
                      </SelectTrigger>
                      <SelectContent>
                        {executionOrders.filter(o => o.status === "in_progress" || o.status === "completed").map(order => (
                          <SelectItem key={order.id} value={order.id}>
                            {order.orderNumber} - {order.customerName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Vendor</Label>
                    <Select value={formData.vendorId} onValueChange={(v) => setFormData(prev => ({ ...prev, vendorId: v }))}>
                      <SelectTrigger data-testid="select-vendor">
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map(vendor => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Customer Name *</Label>
                    <Input
                      value={formData.customerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                      required
                      data-testid="input-customer-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Completion Date *</Label>
                    <Input
                      type="date"
                      value={formData.completionDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, completionDate: e.target.value }))}
                      required
                      data-testid="input-completion-date"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Site Address *</Label>
                  <Textarea
                    value={formData.siteAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, siteAddress: e.target.value }))}
                    required
                    data-testid="input-site-address"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportStatuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {status.replace(/_/g, " ").toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="installation" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Panels Installed</Label>
                    <Input
                      type="number"
                      value={formData.panelsInstalled}
                      onChange={(e) => setFormData(prev => ({ ...prev, panelsInstalled: e.target.value }))}
                      data-testid="input-panels"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Inverter Installed</Label>
                    <Input
                      value={formData.inverterInstalled}
                      onChange={(e) => setFormData(prev => ({ ...prev, inverterInstalled: e.target.value }))}
                      data-testid="input-inverter"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <Label className="text-base font-medium">Installation Checklist</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="wiringCompleted"
                        checked={formData.wiringCompleted}
                        onCheckedChange={(c) => setFormData(prev => ({ ...prev, wiringCompleted: !!c }))}
                        data-testid="checkbox-wiring"
                      />
                      <Label htmlFor="wiringCompleted">Wiring Completed</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="earthingCompleted"
                        checked={formData.earthingCompleted}
                        onCheckedChange={(c) => setFormData(prev => ({ ...prev, earthingCompleted: !!c }))}
                        data-testid="checkbox-earthing"
                      />
                      <Label htmlFor="earthingCompleted">Earthing Completed</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="meterConnected"
                        checked={formData.meterConnected}
                        onCheckedChange={(c) => setFormData(prev => ({ ...prev, meterConnected: !!c }))}
                        data-testid="checkbox-meter"
                      />
                      <Label htmlFor="meterConnected">Meter Connected</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="gridSyncCompleted"
                        checked={formData.gridSyncCompleted}
                        onCheckedChange={(c) => setFormData(prev => ({ ...prev, gridSyncCompleted: !!c }))}
                        data-testid="checkbox-grid"
                      />
                      <Label htmlFor="gridSyncCompleted">Grid Sync Completed</Label>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Meter Reading</Label>
                    <Input
                      value={formData.meterReading}
                      onChange={(e) => setFormData(prev => ({ ...prev, meterReading: e.target.value }))}
                      data-testid="input-meter-reading"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Test Reading (kW)</Label>
                    <Input
                      value={formData.testReadingKw}
                      onChange={(e) => setFormData(prev => ({ ...prev, testReadingKw: e.target.value }))}
                      data-testid="input-test-reading"
                    />
                  </div>
                  <div className="flex items-end gap-2 pb-2">
                    <Checkbox
                      id="generationTestPassed"
                      checked={formData.generationTestPassed}
                      onCheckedChange={(c) => setFormData(prev => ({ ...prev, generationTestPassed: !!c }))}
                      data-testid="checkbox-generation-test"
                    />
                    <Label htmlFor="generationTestPassed">Generation Test Passed</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="photos" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload photos documenting the installation process. Each category supports up to 5 images.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Before Photos
                    </Label>
                    <Input
                      type="file"
                      ref={beforePhotosRef}
                      accept="image/*"
                      multiple
                      data-testid="input-before-photos"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      During Photos
                    </Label>
                    <Input
                      type="file"
                      ref={duringPhotosRef}
                      accept="image/*"
                      multiple
                      data-testid="input-during-photos"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      After Photos
                    </Label>
                    <Input
                      type="file"
                      ref={afterPhotosRef}
                      accept="image/*"
                      multiple
                      data-testid="input-after-photos"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Panel Photos
                    </Label>
                    <Input
                      type="file"
                      ref={panelPhotosRef}
                      accept="image/*"
                      multiple
                      data-testid="input-panel-photos"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Inverter Photos
                    </Label>
                    <Input
                      type="file"
                      ref={inverterPhotosRef}
                      accept="image/*"
                      multiple
                      data-testid="input-inverter-photos"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Wiring Photos
                    </Label>
                    <Input
                      type="file"
                      ref={wiringPhotosRef}
                      accept="image/*"
                      multiple
                      data-testid="input-wiring-photos"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Meter Photos
                    </Label>
                    <Input
                      type="file"
                      ref={meterPhotosRef}
                      accept="image/*"
                      multiple
                      data-testid="input-meter-photos"
                    />
                  </div>
                </div>
                {selectedReport && (
                  <div className="space-y-4 border-t pt-4">
                    <Label className="text-base font-medium">Existing Photos</Label>
                    <PhotoGallery photos={selectedReport.beforePhotos} title="Before Photos" />
                    <PhotoGallery photos={selectedReport.duringPhotos} title="During Photos" />
                    <PhotoGallery photos={selectedReport.afterPhotos} title="After Photos" />
                    <PhotoGallery photos={selectedReport.panelPhotos} title="Panel Photos" />
                    <PhotoGallery photos={selectedReport.inverterPhotos} title="Inverter Photos" />
                    <PhotoGallery photos={selectedReport.wiringPhotos} title="Wiring Photos" />
                    <PhotoGallery photos={selectedReport.meterPhotos} title="Meter Photos" />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="checklist" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="qualityChecklistCompleted"
                      checked={formData.qualityChecklistCompleted}
                      onCheckedChange={(c) => setFormData(prev => ({ ...prev, qualityChecklistCompleted: !!c }))}
                      data-testid="checkbox-quality"
                    />
                    <Label htmlFor="qualityChecklistCompleted">Quality Checklist Completed</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="safetyChecklistCompleted"
                      checked={formData.safetyChecklistCompleted}
                      onCheckedChange={(c) => setFormData(prev => ({ ...prev, safetyChecklistCompleted: !!c }))}
                      data-testid="checkbox-safety"
                    />
                    <Label htmlFor="safetyChecklistCompleted">Safety Checklist Completed</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="cleanupCompleted"
                      checked={formData.cleanupCompleted}
                      onCheckedChange={(c) => setFormData(prev => ({ ...prev, cleanupCompleted: !!c }))}
                      data-testid="checkbox-cleanup"
                    />
                    <Label htmlFor="cleanupCompleted">Site Cleanup Completed</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="customerBriefingDone"
                      checked={formData.customerBriefingDone}
                      onCheckedChange={(c) => setFormData(prev => ({ ...prev, customerBriefingDone: !!c }))}
                      data-testid="checkbox-briefing"
                    />
                    <Label htmlFor="customerBriefingDone">Customer Briefing Done</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Remarks</Label>
                  <Textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                    data-testid="input-remarks"
                  />
                </div>
              </TabsContent>

              <TabsContent value="signatures" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h4 className="font-medium">Customer Acknowledgment</h4>
                    <div className="space-y-2">
                      <Label>Customer Name (Signed)</Label>
                      <Input
                        value={formData.customerName2}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerName2: e.target.value }))}
                        data-testid="input-customer-signed"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Customer Phone</Label>
                      <Input
                        value={formData.customerPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                        data-testid="input-customer-phone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Customer Feedback</Label>
                      <Textarea
                        value={formData.customerFeedback}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerFeedback: e.target.value }))}
                        data-testid="input-customer-feedback"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Customer Rating (1-5)</Label>
                      <Select value={formData.customerRating} onValueChange={(v) => setFormData(prev => ({ ...prev, customerRating: v }))}>
                        <SelectTrigger data-testid="select-rating">
                          <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map(r => (
                            <SelectItem key={r} value={r.toString()}>
                              {r} {r === 1 ? "Star" : "Stars"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">Vendor Acknowledgment</h4>
                    <div className="space-y-2">
                      <Label>Vendor Rep Name</Label>
                      <Input
                        value={formData.vendorRepName}
                        onChange={(e) => setFormData(prev => ({ ...prev, vendorRepName: e.target.value }))}
                        data-testid="input-vendor-rep"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Vendor Rep Phone</Label>
                      <Input
                        value={formData.vendorRepPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, vendorRepPhone: e.target.value }))}
                        data-testid="input-vendor-phone"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditOpen ? "Update Report" : "Create Report"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Completion Report - {selectedReport?.reportNumber}</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Customer Name</Label>
                  <p className="font-medium">{selectedReport.customerName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Completion Date</Label>
                  <p className="font-medium">
                    {selectedReport.completionDate ? format(new Date(selectedReport.completionDate), "dd MMM yyyy") : "-"}
                  </p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Site Address</Label>
                  <p className="font-medium">{selectedReport.siteAddress}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedReport.status || "draft")}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Scope Completed</Label>
                  <p className="font-medium">{selectedReport.scopeCompletedAs?.replace(/_/g, " ")}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Work Summary</h4>
                <p className="text-sm">{selectedReport.workSummary || "No summary provided"}</p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Installation Details</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Panels</Label>
                    <p className="font-medium">{selectedReport.panelsInstalled || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Inverter</Label>
                    <p className="font-medium">{selectedReport.inverterInstalled || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Work Hours</Label>
                    <p className="font-medium">{selectedReport.totalWorkHours || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Crew Size</Label>
                    <p className="font-medium">{selectedReport.crewSize || "-"}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedReport.wiringCompleted && <Badge variant="outline">Wiring Done</Badge>}
                  {selectedReport.earthingCompleted && <Badge variant="outline">Earthing Done</Badge>}
                  {selectedReport.meterConnected && <Badge variant="outline">Meter Connected</Badge>}
                  {selectedReport.gridSyncCompleted && <Badge variant="outline">Grid Synced</Badge>}
                  {selectedReport.generationTestPassed && <Badge variant="default">Generation Test Passed</Badge>}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Photos</h4>
                <div className="space-y-4">
                  <PhotoGallery photos={selectedReport.beforePhotos} title="Before Photos" />
                  <PhotoGallery photos={selectedReport.duringPhotos} title="During Photos" />
                  <PhotoGallery photos={selectedReport.afterPhotos} title="After Photos" />
                  <PhotoGallery photos={selectedReport.panelPhotos} title="Panel Photos" />
                  <PhotoGallery photos={selectedReport.inverterPhotos} title="Inverter Photos" />
                  <PhotoGallery photos={selectedReport.wiringPhotos} title="Wiring Photos" />
                  <PhotoGallery photos={selectedReport.meterPhotos} title="Meter Photos" />
                </div>
              </div>

              {selectedReport.customerRating && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Customer Feedback</h4>
                  <div className="flex items-center gap-2 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < (selectedReport.customerRating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                    <span className="ml-2 font-medium">{selectedReport.customerRating}/5</span>
                  </div>
                  <p className="text-sm">{selectedReport.customerFeedback || "No feedback provided"}</p>
                </div>
              )}

              {selectedReport.reviewNotes && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Review Notes</h4>
                  <p className="text-sm">{selectedReport.reviewNotes}</p>
                </div>
              )}

              {selectedReport.rejectionReason && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 text-red-600">Rejection Reason</h4>
                  <p className="text-sm text-red-600">{selectedReport.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Close
            </Button>
            {selectedReport && (selectedReport.status === "submitted" || selectedReport.status === "under_review") && (
              <Button onClick={() => { setIsViewOpen(false); handleReview(selectedReport); }}>
                Review Report
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Completion Report</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-md">
                <p><strong>Report:</strong> {selectedReport.reportNumber}</p>
                <p><strong>Customer:</strong> {selectedReport.customerName}</p>
                <p><strong>Site:</strong> {selectedReport.siteAddress}</p>
              </div>

              <div className="space-y-2">
                <Label>Review Action</Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={reviewAction === "approve" ? "default" : "outline"}
                    onClick={() => setReviewAction("approve")}
                    className="flex-1"
                    data-testid="button-approve"
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant={reviewAction === "reject" ? "destructive" : "outline"}
                    onClick={() => setReviewAction("reject")}
                    className="flex-1"
                    data-testid="button-reject"
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Review Notes</Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add any notes about this review..."
                  data-testid="input-review-notes"
                />
              </div>

              {reviewAction === "reject" && (
                <div className="space-y-2">
                  <Label>Rejection Reason *</Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why the report is being rejected..."
                    required
                    data-testid="input-rejection-reason"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReviewSubmit}
              disabled={reviewMutation.isPending || (reviewAction === "reject" && !rejectionReason)}
              variant={reviewAction === "approve" ? "default" : "destructive"}
            >
              {reviewMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {reviewAction === "approve" ? "Approve Report" : "Reject Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
