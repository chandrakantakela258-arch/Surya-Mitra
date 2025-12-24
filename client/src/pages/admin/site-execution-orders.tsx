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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Wrench, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  PlayCircle,
  PauseCircle,
} from "lucide-react";
import { format } from "date-fns";
import type { SiteExecutionOrder, Customer, Vendor, GoodsDelivery } from "@shared/schema";

const executionStatuses = ["draft", "assigned", "in_progress", "completed", "on_hold", "cancelled"] as const;

export default function AdminSiteExecutionOrders() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SiteExecutionOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState({
    customerId: "",
    vendorId: "",
    purchaseOrderId: "",
    deliveryId: "",
    customerName: "",
    customerPhone: "",
    siteAddress: "",
    district: "",
    state: "",
    pincode: "",
    vendorName: "",
    vendorContactPerson: "",
    vendorPhone: "",
    scheduledStartDate: format(new Date(), "yyyy-MM-dd"),
    scheduledEndDate: "",
    actualStartDate: "",
    actualEndDate: "",
    estimatedDuration: "",
    crewLeadName: "",
    crewLeadPhone: "",
    crewSize: "",
    scopeOfWork: "",
    workDescription: "",
    panelType: "",
    panelCapacity: "",
    inverterType: "",
    numberOfPanels: "",
    siteInstallationRate: "2.5",
    specialInstructions: "",
    safetyChecklistCompleted: false,
    safetyNotes: "",
    permitsObtained: false,
    status: "draft",
    progressPercentage: "0",
    progressNotes: "",
    qualityCheckCompleted: false,
    qualityCheckNotes: "",
    customerFeedback: "",
    customerRating: "",
    holdReason: "",
    cancelReason: "",
    remarks: "",
  });

  const { data: orders = [], isLoading } = useQuery<SiteExecutionOrder[]>({
    queryKey: ["/api/admin/site-execution-orders"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/admin/vendors"],
  });

  const { data: deliveries = [] } = useQuery<GoodsDelivery[]>({
    queryKey: ["/api/admin/goods-deliveries"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/site-execution-orders", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-execution-orders"] });
      setIsAddOpen(false);
      resetForm();
      toast({ title: "Execution order created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create execution order", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/admin/site-execution-orders/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-execution-orders"] });
      setIsEditOpen(false);
      setSelectedOrder(null);
      resetForm();
      toast({ title: "Execution order updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update execution order", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/site-execution-orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-execution-orders"] });
      toast({ title: "Execution order deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete execution order", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      customerId: "",
      vendorId: "",
      purchaseOrderId: "",
      deliveryId: "",
      customerName: "",
      customerPhone: "",
      siteAddress: "",
      district: "",
      state: "",
      pincode: "",
      vendorName: "",
      vendorContactPerson: "",
      vendorPhone: "",
      scheduledStartDate: format(new Date(), "yyyy-MM-dd"),
      scheduledEndDate: "",
      actualStartDate: "",
      actualEndDate: "",
      estimatedDuration: "",
      crewLeadName: "",
      crewLeadPhone: "",
      crewSize: "",
      scopeOfWork: "",
      workDescription: "",
      panelType: "",
      panelCapacity: "",
      inverterType: "",
      numberOfPanels: "",
      siteInstallationRate: "2.5",
      specialInstructions: "",
      safetyChecklistCompleted: false,
      safetyNotes: "",
      permitsObtained: false,
      status: "draft",
      progressPercentage: "0",
      progressNotes: "",
      qualityCheckCompleted: false,
      qualityCheckNotes: "",
      customerFeedback: "",
      customerRating: "",
      holdReason: "",
      cancelReason: "",
      remarks: "",
    });
    setActiveTab("basic");
  };

  const handleAddOpen = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleEdit = (order: SiteExecutionOrder) => {
    setSelectedOrder(order);
    setFormData({
      customerId: order.customerId || "",
      vendorId: order.vendorId || "",
      purchaseOrderId: order.purchaseOrderId || "",
      deliveryId: order.deliveryId || "",
      customerName: order.customerName || "",
      customerPhone: order.customerPhone || "",
      siteAddress: order.siteAddress || "",
      district: order.district || "",
      state: order.state || "",
      pincode: order.pincode || "",
      vendorName: order.vendorName || "",
      vendorContactPerson: order.vendorContactPerson || "",
      vendorPhone: order.vendorPhone || "",
      scheduledStartDate: order.scheduledStartDate ? format(new Date(order.scheduledStartDate), "yyyy-MM-dd") : "",
      scheduledEndDate: order.scheduledEndDate ? format(new Date(order.scheduledEndDate), "yyyy-MM-dd") : "",
      actualStartDate: order.actualStartDate ? format(new Date(order.actualStartDate), "yyyy-MM-dd") : "",
      actualEndDate: order.actualEndDate ? format(new Date(order.actualEndDate), "yyyy-MM-dd") : "",
      estimatedDuration: order.estimatedDuration?.toString() || "",
      crewLeadName: order.crewLeadName || "",
      crewLeadPhone: order.crewLeadPhone || "",
      crewSize: order.crewSize?.toString() || "",
      scopeOfWork: order.scopeOfWork || "",
      workDescription: order.workDescription || "",
      panelType: order.panelType || "",
      panelCapacity: order.panelCapacity || "",
      inverterType: order.inverterType || "",
      numberOfPanels: order.numberOfPanels?.toString() || "",
      siteInstallationRate: order.siteInstallationRate || "2.5",
      specialInstructions: order.specialInstructions || "",
      safetyChecklistCompleted: order.safetyChecklistCompleted || false,
      safetyNotes: order.safetyNotes || "",
      permitsObtained: order.permitsObtained || false,
      status: order.status || "draft",
      progressPercentage: order.progressPercentage?.toString() || "0",
      progressNotes: order.progressNotes || "",
      qualityCheckCompleted: order.qualityCheckCompleted || false,
      qualityCheckNotes: order.qualityCheckNotes || "",
      customerFeedback: order.customerFeedback || "",
      customerRating: order.customerRating?.toString() || "",
      holdReason: order.holdReason || "",
      cancelReason: order.cancelReason || "",
      remarks: order.remarks || "",
    });
    setActiveTab("basic");
    setIsEditOpen(true);
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedOrder) return;
    updateMutation.mutate({ id: selectedOrder.id, data: formData });
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
        panelType: customer.panelType || "",
        panelCapacity: customer.proposedCapacity || "",
      }));
    }
  };

  const handleVendorSelect = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) {
      setFormData(prev => {
        // Use vendor-type-specific rate: siteErectionRatePerWatt for installation vendors
        const installationRate = vendor.siteErectionRatePerWatt || vendor.bestPriceQuotation || prev.siteInstallationRate;
        return {
          ...prev,
          vendorId,
          vendorName: vendor.name,
          vendorContactPerson: vendor.companyName || "",
          vendorPhone: vendor.phone || "",
          siteInstallationRate: installationRate,
        };
      });
    }
  };

  const handleDeliverySelect = (deliveryId: string) => {
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (delivery) {
      setFormData(prev => ({
        ...prev,
        deliveryId,
        customerName: delivery.customerName,
        customerPhone: delivery.customerPhone || "",
        siteAddress: delivery.deliveryAddress,
        district: delivery.district || "",
        state: delivery.state || "",
        pincode: delivery.pincode || "",
        panelType: delivery.panelType || "",
        panelCapacity: delivery.panelCapacity || "",
        inverterType: delivery.inverterType || "",
      }));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "assigned":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Assigned</Badge>;
      case "in_progress":
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge>;
      case "on_hold":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">On Hold</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredOrders = orders.filter(order => {
    const query = searchQuery.toLowerCase();
    return (
      order.customerName?.toLowerCase().includes(query) ||
      order.siteAddress?.toLowerCase().includes(query) ||
      order.vendorName?.toLowerCase().includes(query) ||
      order.orderNumber?.toLowerCase().includes(query) ||
      order.crewLeadName?.toLowerCase().includes(query)
    );
  });

  const draftCount = orders.filter(o => o.status === "draft").length;
  const assignedCount = orders.filter(o => o.status === "assigned").length;
  const inProgressCount = orders.filter(o => o.status === "in_progress").length;
  const completedCount = orders.filter(o => o.status === "completed").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const renderForm = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic" data-testid="tab-basic">Basic Info</TabsTrigger>
        <TabsTrigger value="crew" data-testid="tab-crew">Crew & Work</TabsTrigger>
        <TabsTrigger value="safety" data-testid="tab-safety">Safety</TabsTrigger>
        <TabsTrigger value="progress" data-testid="tab-progress">Progress</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4 mt-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Link to Delivery</Label>
            <Select value={formData.deliveryId} onValueChange={handleDeliverySelect}>
              <SelectTrigger data-testid="select-delivery">
                <SelectValue placeholder="Select delivered goods" />
              </SelectTrigger>
              <SelectContent>
                {deliveries.filter(d => d.status === "delivered").map(delivery => (
                  <SelectItem key={delivery.id} value={delivery.id}>
                    {delivery.customerName} - {delivery.deliveryAddress?.substring(0, 30)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Or Select Customer</Label>
            <Select value={formData.customerId} onValueChange={handleCustomerSelect}>
              <SelectTrigger data-testid="select-customer">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Customer Name *</Label>
            <Input
              value={formData.customerName}
              onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
              placeholder="Customer name"
              data-testid="input-customer-name"
            />
          </div>
          <div className="space-y-2">
            <Label>Customer Phone</Label>
            <Input
              value={formData.customerPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
              placeholder="Customer phone"
              data-testid="input-customer-phone"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Site Address *</Label>
          <Input
            value={formData.siteAddress}
            onChange={(e) => setFormData(prev => ({ ...prev, siteAddress: e.target.value }))}
            placeholder="Full site address"
            data-testid="input-site-address"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>District</Label>
            <Input
              value={formData.district}
              onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
              placeholder="District"
              data-testid="input-district"
            />
          </div>
          <div className="space-y-2">
            <Label>State</Label>
            <Input
              value={formData.state}
              onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
              placeholder="State"
              data-testid="input-state"
            />
          </div>
          <div className="space-y-2">
            <Label>Pincode</Label>
            <Input
              value={formData.pincode}
              onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
              placeholder="Pincode"
              data-testid="input-pincode"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Select Vendor</Label>
          <Select value={formData.vendorId} onValueChange={handleVendorSelect}>
            <SelectTrigger data-testid="select-vendor">
              <SelectValue placeholder="Select vendor for installation" />
            </SelectTrigger>
            <SelectContent>
              {vendors.filter(v => v.vendorType === "solar_installation" || v.vendorType === "electrical").map(vendor => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  {vendor.name} - {vendor.district || vendor.state}
                  {vendor.bestPriceQuotation && ` (Rs ${vendor.bestPriceQuotation}/${vendor.quotationUnit?.replace("_", "") || "unit"})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Vendor Name</Label>
            <Input
              value={formData.vendorName}
              onChange={(e) => setFormData(prev => ({ ...prev, vendorName: e.target.value }))}
              placeholder="Vendor name"
              data-testid="input-vendor-name"
            />
          </div>
          <div className="space-y-2">
            <Label>Contact Person</Label>
            <Input
              value={formData.vendorContactPerson}
              onChange={(e) => setFormData(prev => ({ ...prev, vendorContactPerson: e.target.value }))}
              placeholder="Contact person"
              data-testid="input-vendor-contact"
            />
          </div>
          <div className="space-y-2">
            <Label>Vendor Phone</Label>
            <Input
              value={formData.vendorPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, vendorPhone: e.target.value }))}
              placeholder="Vendor phone"
              data-testid="input-vendor-phone"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Scheduled Start Date *</Label>
            <Input
              type="date"
              value={formData.scheduledStartDate}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduledStartDate: e.target.value }))}
              data-testid="input-scheduled-start"
            />
          </div>
          <div className="space-y-2">
            <Label>Scheduled End Date</Label>
            <Input
              type="date"
              value={formData.scheduledEndDate}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduledEndDate: e.target.value }))}
              data-testid="input-scheduled-end"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
            <SelectTrigger data-testid="select-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {executionStatuses.map(status => (
                <SelectItem key={status} value={status}>
                  {status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </TabsContent>

      <TabsContent value="crew" className="space-y-4 mt-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Crew Lead Name</Label>
            <Input
              value={formData.crewLeadName}
              onChange={(e) => setFormData(prev => ({ ...prev, crewLeadName: e.target.value }))}
              placeholder="Crew lead name"
              data-testid="input-crew-lead"
            />
          </div>
          <div className="space-y-2">
            <Label>Crew Lead Phone</Label>
            <Input
              value={formData.crewLeadPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, crewLeadPhone: e.target.value }))}
              placeholder="Crew lead phone"
              data-testid="input-crew-phone"
            />
          </div>
          <div className="space-y-2">
            <Label>Crew Size</Label>
            <Input
              type="number"
              value={formData.crewSize}
              onChange={(e) => setFormData(prev => ({ ...prev, crewSize: e.target.value }))}
              placeholder="Number of workers"
              data-testid="input-crew-size"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Estimated Duration (hours)</Label>
          <Input
            type="number"
            value={formData.estimatedDuration}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
            placeholder="Estimated hours"
            data-testid="input-duration"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Panel Type</Label>
            <Select value={formData.panelType} onValueChange={(value) => setFormData(prev => ({ ...prev, panelType: value }))}>
              <SelectTrigger data-testid="select-panel-type">
                <SelectValue placeholder="Select panel type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dcr">DCR (Domestic)</SelectItem>
                <SelectItem value="non_dcr">Non-DCR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Panel Capacity (kW)</Label>
            <Input
              value={formData.panelCapacity}
              onChange={(e) => setFormData(prev => ({ ...prev, panelCapacity: e.target.value }))}
              placeholder="e.g., 3"
              data-testid="input-capacity"
            />
          </div>
          <div className="space-y-2">
            <Label>Number of Panels</Label>
            <Input
              type="number"
              value={formData.numberOfPanels}
              onChange={(e) => setFormData(prev => ({ ...prev, numberOfPanels: e.target.value }))}
              placeholder="Panel count"
              data-testid="input-panel-count"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Inverter Type</Label>
            <Select value={formData.inverterType} onValueChange={(value) => setFormData(prev => ({ ...prev, inverterType: value }))}>
              <SelectTrigger data-testid="select-inverter">
                <SelectValue placeholder="Select inverter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ongrid">On-Grid Inverter</SelectItem>
                <SelectItem value="hybrid">3-in-1 Hybrid Inverter</SelectItem>
                <SelectItem value="offgrid">Off-Grid Inverter</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Site Installation Rate (Rs/watt)</Label>
            <Select value={formData.siteInstallationRate} onValueChange={(value) => setFormData(prev => ({ ...prev, siteInstallationRate: value }))}>
              <SelectTrigger data-testid="select-installation-rate">
                <SelectValue placeholder="Select rate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2.5">Rs 2.5/watt</SelectItem>
                <SelectItem value="2.75">Rs 2.75/watt</SelectItem>
                <SelectItem value="3">Rs 3/watt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Scope of Work</Label>
          <Textarea
            value={formData.scopeOfWork}
            onChange={(e) => setFormData(prev => ({ ...prev, scopeOfWork: e.target.value }))}
            placeholder="Brief scope description"
            data-testid="input-scope"
          />
        </div>

        <div className="space-y-2">
          <Label>Work Description</Label>
          <Textarea
            value={formData.workDescription}
            onChange={(e) => setFormData(prev => ({ ...prev, workDescription: e.target.value }))}
            placeholder="Detailed work description"
            data-testid="input-work-desc"
          />
        </div>

        <div className="space-y-2">
          <Label>Special Instructions</Label>
          <Textarea
            value={formData.specialInstructions}
            onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
            placeholder="Any special instructions for the crew"
            data-testid="input-instructions"
          />
        </div>
      </TabsContent>

      <TabsContent value="safety" className="space-y-4 mt-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="safetyChecklist"
            checked={formData.safetyChecklistCompleted}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, safetyChecklistCompleted: checked === true }))}
            data-testid="checkbox-safety"
          />
          <Label htmlFor="safetyChecklist">Safety Checklist Completed</Label>
        </div>

        <div className="space-y-2">
          <Label>Safety Notes</Label>
          <Textarea
            value={formData.safetyNotes}
            onChange={(e) => setFormData(prev => ({ ...prev, safetyNotes: e.target.value }))}
            placeholder="Safety observations and notes"
            data-testid="input-safety-notes"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="permits"
            checked={formData.permitsObtained}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, permitsObtained: checked === true }))}
            data-testid="checkbox-permits"
          />
          <Label htmlFor="permits">Required Permits Obtained</Label>
        </div>

        <div className="space-y-2">
          <Label>Remarks</Label>
          <Textarea
            value={formData.remarks}
            onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
            placeholder="Additional remarks"
            data-testid="input-remarks"
          />
        </div>

        {formData.status === "on_hold" && (
          <div className="space-y-2">
            <Label>Hold Reason</Label>
            <Textarea
              value={formData.holdReason}
              onChange={(e) => setFormData(prev => ({ ...prev, holdReason: e.target.value }))}
              placeholder="Why is the order on hold?"
              data-testid="input-hold-reason"
            />
          </div>
        )}

        {formData.status === "cancelled" && (
          <div className="space-y-2">
            <Label>Cancel Reason</Label>
            <Textarea
              value={formData.cancelReason}
              onChange={(e) => setFormData(prev => ({ ...prev, cancelReason: e.target.value }))}
              placeholder="Why was the order cancelled?"
              data-testid="input-cancel-reason"
            />
          </div>
        )}
      </TabsContent>

      <TabsContent value="progress" className="space-y-4 mt-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Actual Start Date</Label>
            <Input
              type="date"
              value={formData.actualStartDate}
              onChange={(e) => setFormData(prev => ({ ...prev, actualStartDate: e.target.value }))}
              data-testid="input-actual-start"
            />
          </div>
          <div className="space-y-2">
            <Label>Actual End Date</Label>
            <Input
              type="date"
              value={formData.actualEndDate}
              onChange={(e) => setFormData(prev => ({ ...prev, actualEndDate: e.target.value }))}
              data-testid="input-actual-end"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Progress Percentage</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={formData.progressPercentage}
            onChange={(e) => setFormData(prev => ({ ...prev, progressPercentage: e.target.value }))}
            placeholder="0-100"
            data-testid="input-progress"
          />
        </div>

        <div className="space-y-2">
          <Label>Progress Notes</Label>
          <Textarea
            value={formData.progressNotes}
            onChange={(e) => setFormData(prev => ({ ...prev, progressNotes: e.target.value }))}
            placeholder="Progress updates and notes"
            data-testid="input-progress-notes"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="qualityCheck"
            checked={formData.qualityCheckCompleted}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, qualityCheckCompleted: checked === true }))}
            data-testid="checkbox-quality"
          />
          <Label htmlFor="qualityCheck">Quality Check Completed</Label>
        </div>

        <div className="space-y-2">
          <Label>Quality Check Notes</Label>
          <Textarea
            value={formData.qualityCheckNotes}
            onChange={(e) => setFormData(prev => ({ ...prev, qualityCheckNotes: e.target.value }))}
            placeholder="Quality check observations"
            data-testid="input-quality-notes"
          />
        </div>

        <div className="space-y-2">
          <Label>Customer Feedback</Label>
          <Textarea
            value={formData.customerFeedback}
            onChange={(e) => setFormData(prev => ({ ...prev, customerFeedback: e.target.value }))}
            placeholder="Customer feedback after completion"
            data-testid="input-feedback"
          />
        </div>

        <div className="space-y-2">
          <Label>Customer Rating (1-5)</Label>
          <Select value={formData.customerRating} onValueChange={(value) => setFormData(prev => ({ ...prev, customerRating: value }))}>
            <SelectTrigger data-testid="select-rating">
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 - Poor</SelectItem>
              <SelectItem value="2">2 - Fair</SelectItem>
              <SelectItem value="3">3 - Good</SelectItem>
              <SelectItem value="4">4 - Very Good</SelectItem>
              <SelectItem value="5">5 - Excellent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Site Execution Orders</h1>
          <p className="text-muted-foreground">Manage installation work orders to vendors (Step 7)</p>
        </div>
        <Button onClick={handleAddOpen} data-testid="button-create-order">
          <Plus className="mr-2 h-4 w-4" />
          Create Execution Order
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-orders">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft/Assigned</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-draft-count">
              {draftCount + assignedCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <PlayCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600" data-testid="text-progress-count">
              {inProgressCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-completed-count">
              {completedCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Execution Orders</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by customer, vendor, order..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No execution orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>
                        <div>{order.customerName}</div>
                        <div className="text-sm text-muted-foreground">{order.district}, {order.state}</div>
                      </TableCell>
                      <TableCell>
                        <div>{order.vendorName || "-"}</div>
                        <div className="text-sm text-muted-foreground">{order.crewLeadName || ""}</div>
                      </TableCell>
                      <TableCell>
                        {order.scheduledStartDate ? format(new Date(order.scheduledStartDate), "dd MMM yyyy") : "-"}
                      </TableCell>
                      <TableCell>Rs {order.siteInstallationRate || "2.5"}/W</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${order.progressPercentage || 0}%` }}
                            />
                          </div>
                          <span className="text-sm">{order.progressPercentage || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status || "draft")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(order)}
                            data-testid={`button-edit-${order.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this execution order?")) {
                                deleteMutation.mutate(order.id);
                              }
                            }}
                            data-testid={`button-delete-${order.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Execution Order</DialogTitle>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} data-testid="button-cancel-add">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} data-testid="button-confirm-add">
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Execution Order</DialogTitle>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending} data-testid="button-confirm-edit">
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
