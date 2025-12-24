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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Truck, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import type { GoodsDelivery, Customer, Vendor, VendorPurchaseOrder } from "@shared/schema";

const deliveryStatuses = ["scheduled", "in_transit", "delivered", "partially_delivered", "failed", "rescheduled"] as const;
const timeSlots = ["morning", "afternoon", "evening"] as const;
const vehicleTypes = ["two_wheeler", "three_wheeler", "pickup_truck", "mini_truck", "large_truck"] as const;

export default function AdminGoodsDeliveries() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<GoodsDelivery | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("delivery");
  const [formData, setFormData] = useState({
    customerId: "",
    purchaseOrderId: "",
    vendorId: "",
    customerName: "",
    customerPhone: "",
    deliveryAddress: "",
    district: "",
    state: "",
    pincode: "",
    scheduledDate: format(new Date(), "yyyy-MM-dd"),
    scheduledTimeSlot: "",
    actualDeliveryDate: "",
    status: "scheduled",
    deliveredBy: "",
    vehicleNumber: "",
    vehicleType: "",
    panelType: "",
    panelCapacity: "",
    inverterType: "",
    quantityOrdered: "1",
    quantityDelivered: "",
    logisticRate: "20",
    deliveryDistanceKm: "",
    receiverName: "",
    receiverPhone: "",
    verificationNotes: "",
    poNumber: "",
    vendorName: "",
    remarks: "",
    failureReason: "",
    rescheduleReason: "",
  });

  const { data: deliveries = [], isLoading } = useQuery<GoodsDelivery[]>({
    queryKey: ["/api/admin/goods-deliveries"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/admin/vendors"],
  });

  const { data: purchaseOrders = [] } = useQuery<VendorPurchaseOrder[]>({
    queryKey: ["/api/admin/vendor-purchase-orders"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/admin/goods-deliveries", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/goods-deliveries"] });
      toast({ title: "Delivery scheduled successfully" });
      setIsAddOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to schedule delivery", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return await apiRequest("PATCH", `/api/admin/goods-deliveries/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/goods-deliveries"] });
      toast({ title: "Delivery updated successfully" });
      setIsEditOpen(false);
      setSelectedDelivery(null);
    },
    onError: () => {
      toast({ title: "Failed to update delivery", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/goods-deliveries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/goods-deliveries"] });
      toast({ title: "Delivery deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete delivery", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      customerId: "",
      purchaseOrderId: "",
      vendorId: "",
      customerName: "",
      customerPhone: "",
      deliveryAddress: "",
      district: "",
      state: "",
      pincode: "",
      scheduledDate: format(new Date(), "yyyy-MM-dd"),
      scheduledTimeSlot: "",
      actualDeliveryDate: "",
      status: "scheduled",
      deliveredBy: "",
      vehicleNumber: "",
      vehicleType: "",
      panelType: "",
      panelCapacity: "",
      inverterType: "",
      quantityOrdered: "1",
      quantityDelivered: "",
      logisticRate: "20",
      deliveryDistanceKm: "",
      receiverName: "",
      receiverPhone: "",
      verificationNotes: "",
      poNumber: "",
      vendorName: "",
      remarks: "",
      failureReason: "",
      rescheduleReason: "",
    });
    setActiveTab("delivery");
  };

  const handleAddOpen = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleEdit = (delivery: GoodsDelivery) => {
    setSelectedDelivery(delivery);
    setFormData({
      customerId: delivery.customerId || "",
      purchaseOrderId: delivery.purchaseOrderId || "",
      vendorId: delivery.vendorId || "",
      customerName: delivery.customerName,
      customerPhone: delivery.customerPhone || "",
      deliveryAddress: delivery.deliveryAddress,
      district: delivery.district || "",
      state: delivery.state || "",
      pincode: delivery.pincode || "",
      scheduledDate: delivery.scheduledDate ? format(new Date(delivery.scheduledDate), "yyyy-MM-dd") : "",
      scheduledTimeSlot: delivery.scheduledTimeSlot || "",
      actualDeliveryDate: delivery.actualDeliveryDate ? format(new Date(delivery.actualDeliveryDate), "yyyy-MM-dd") : "",
      status: delivery.status || "scheduled",
      deliveredBy: delivery.deliveredBy || "",
      vehicleNumber: delivery.vehicleNumber || "",
      vehicleType: delivery.vehicleType || "",
      panelType: delivery.panelType || "",
      panelCapacity: delivery.panelCapacity || "",
      inverterType: delivery.inverterType || "",
      quantityOrdered: String(delivery.quantityOrdered || 1),
      quantityDelivered: String(delivery.quantityDelivered || ""),
      logisticRate: delivery.logisticRate || "20",
      deliveryDistanceKm: delivery.deliveryDistanceKm || "",
      receiverName: delivery.receiverName || "",
      receiverPhone: delivery.receiverPhone || "",
      verificationNotes: delivery.verificationNotes || "",
      poNumber: delivery.poNumber || "",
      vendorName: delivery.vendorName || "",
      remarks: delivery.remarks || "",
      failureReason: delivery.failureReason || "",
      rescheduleReason: delivery.rescheduleReason || "",
    });
    setIsEditOpen(true);
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId,
        customerName: customer.name,
        customerPhone: customer.phone || "",
        deliveryAddress: customer.address || "",
        district: customer.district || "",
        state: customer.state || "",
        pincode: customer.pincode || "",
        panelType: customer.panelType || "",
        panelCapacity: customer.proposedCapacity || "",
      }));
    }
  };

  const handlePurchaseOrderSelect = (poId: string) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (po) {
      const customer = customers.find((c) => c.id === po.customerId);
      const vendor = vendors.find((v) => v.id === po.vendorId);
      setFormData(prev => ({
        ...prev,
        purchaseOrderId: poId,
        customerId: po.customerId || "",
        customerName: po.customerName,
        vendorId: po.vendorId || "",
        vendorName: po.vendorName,
        poNumber: po.poNumber,
        panelType: po.panelType || "",
        panelCapacity: po.panelCapacity || "",
        inverterType: po.inverterType || "",
        quantityOrdered: String(po.quantity || 1),
        deliveryAddress: customer?.address || "",
        district: customer?.district || "",
        state: customer?.state || "",
        pincode: customer?.pincode || "",
        customerPhone: customer?.phone || "",
      }));
    }
  };

  const handleVendorSelect = (vendorId: string) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    if (vendor) {
      setFormData(prev => {
        // Use vendor-type-specific rate: logisticRatePerKm for logistic vendors
        const logisticRate = vendor.logisticRatePerKm || vendor.bestPriceQuotation || prev.logisticRate;
        return {
          ...prev,
          vendorId,
          vendorName: vendor.companyName || vendor.name,
          logisticRate,
        };
      });
    }
  };

  const handleCreate = () => {
    if (!formData.customerName || !formData.deliveryAddress || !formData.scheduledDate) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedDelivery) return;
    updateMutation.mutate({
      id: selectedDelivery.id,
      data: formData,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: any }> = {
      scheduled: { variant: "secondary", label: "Scheduled", icon: Clock },
      in_transit: { variant: "outline", label: "In Transit", icon: Truck },
      delivered: { variant: "default", label: "Delivered", icon: CheckCircle },
      partially_delivered: { variant: "outline", label: "Partial", icon: Package },
      failed: { variant: "destructive", label: "Failed", icon: XCircle },
      rescheduled: { variant: "secondary", label: "Rescheduled", icon: RefreshCw },
    };
    const config = statusConfig[status] || { variant: "secondary", label: status, icon: Clock };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTimeSlotLabel = (slot: string) => {
    const labels: Record<string, string> = {
      morning: "Morning (8AM - 12PM)",
      afternoon: "Afternoon (12PM - 4PM)",
      evening: "Evening (4PM - 8PM)",
    };
    return labels[slot] || slot;
  };

  const getVehicleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      two_wheeler: "Two Wheeler",
      three_wheeler: "Three Wheeler",
      pickup_truck: "Pickup Truck",
      mini_truck: "Mini Truck",
      large_truck: "Large Truck",
    };
    return labels[type] || type;
  };

  const filteredDeliveries = deliveries.filter((delivery) => {
    const customerName = delivery.customerName.toLowerCase();
    const address = (delivery.deliveryAddress || "").toLowerCase();
    const poNumber = (delivery.poNumber || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return customerName.includes(query) || address.includes(query) || poNumber.includes(query);
  });

  const scheduledCount = deliveries.filter(d => d.status === "scheduled").length;
  const inTransitCount = deliveries.filter(d => d.status === "in_transit").length;
  const deliveredCount = deliveries.filter(d => d.status === "delivered").length;
  const failedCount = deliveries.filter(d => d.status === "failed" || d.status === "partially_delivered").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderForm = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="delivery" data-testid="tab-delivery">Delivery Info</TabsTrigger>
        <TabsTrigger value="logistics" data-testid="tab-logistics">Logistics</TabsTrigger>
        <TabsTrigger value="verification" data-testid="tab-verification">Verification</TabsTrigger>
      </TabsList>

      <TabsContent value="delivery" className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Link to Purchase Order</Label>
            <Select value={formData.purchaseOrderId} onValueChange={handlePurchaseOrderSelect}>
              <SelectTrigger data-testid="select-purchase-order">
                <SelectValue placeholder="Select PO (optional)" />
              </SelectTrigger>
              <SelectContent>
                {purchaseOrders.map((po) => (
                  <SelectItem key={po.id} value={po.id}>
                    {po.poNumber} - {po.customerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Link to Customer</Label>
            <Select value={formData.customerId} onValueChange={handleCustomerSelect}>
              <SelectTrigger data-testid="select-customer">
                <SelectValue placeholder="Select customer (optional)" />
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
        </div>

        <div className="grid grid-cols-2 gap-4">
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
              placeholder="Phone number"
              data-testid="input-customer-phone"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Delivery Address *</Label>
          <Textarea
            value={formData.deliveryAddress}
            onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
            placeholder="Full delivery address"
            data-testid="input-delivery-address"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
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

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Scheduled Date *</Label>
            <Input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
              data-testid="input-scheduled-date"
            />
          </div>
          <div className="space-y-2">
            <Label>Time Slot</Label>
            <Select value={formData.scheduledTimeSlot} onValueChange={(v) => setFormData(prev => ({ ...prev, scheduledTimeSlot: v }))}>
              <SelectTrigger data-testid="select-time-slot">
                <SelectValue placeholder="Select slot" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {getTimeSlotLabel(slot)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
              <SelectTrigger data-testid="select-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {deliveryStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="logistics" className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Vendor</Label>
            <Select value={formData.vendorId} onValueChange={handleVendorSelect}>
              <SelectTrigger data-testid="select-vendor">
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.companyName || vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>PO Number</Label>
            <Input
              value={formData.poNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
              placeholder="Purchase order number"
              data-testid="input-po-number"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Panel Type</Label>
            <Select value={formData.panelType} onValueChange={(v) => setFormData(prev => ({ ...prev, panelType: v }))}>
              <SelectTrigger data-testid="select-panel-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dcr">DCR Panel</SelectItem>
                <SelectItem value="non_dcr">Non-DCR Panel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Panel Capacity</Label>
            <Input
              value={formData.panelCapacity}
              onChange={(e) => setFormData(prev => ({ ...prev, panelCapacity: e.target.value }))}
              placeholder="e.g., 3 kW"
              data-testid="input-panel-capacity"
            />
          </div>
          <div className="space-y-2">
            <Label>Inverter Type</Label>
            <Select value={formData.inverterType} onValueChange={(v) => setFormData(prev => ({ ...prev, inverterType: v }))}>
              <SelectTrigger data-testid="select-inverter-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ongrid">On-Grid Inverter</SelectItem>
                <SelectItem value="hybrid_3in1">3-in-1 Hybrid Inverter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Quantity Ordered</Label>
            <Input
              type="number"
              value={formData.quantityOrdered}
              onChange={(e) => setFormData(prev => ({ ...prev, quantityOrdered: e.target.value }))}
              placeholder="1"
              data-testid="input-quantity-ordered"
            />
          </div>
          <div className="space-y-2">
            <Label>Quantity Delivered</Label>
            <Input
              type="number"
              value={formData.quantityDelivered}
              onChange={(e) => setFormData(prev => ({ ...prev, quantityDelivered: e.target.value }))}
              placeholder="Delivered quantity"
              data-testid="input-quantity-delivered"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Delivered By</Label>
            <Input
              value={formData.deliveredBy}
              onChange={(e) => setFormData(prev => ({ ...prev, deliveredBy: e.target.value }))}
              placeholder="Driver name"
              data-testid="input-delivered-by"
            />
          </div>
          <div className="space-y-2">
            <Label>Vehicle Number</Label>
            <Input
              value={formData.vehicleNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, vehicleNumber: e.target.value }))}
              placeholder="e.g., BR01AB1234"
              data-testid="input-vehicle-number"
            />
          </div>
          <div className="space-y-2">
            <Label>Vehicle Type</Label>
            <Select value={formData.vehicleType} onValueChange={(v) => setFormData(prev => ({ ...prev, vehicleType: v }))}>
              <SelectTrigger data-testid="select-vehicle-type">
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicleTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getVehicleTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Logistic Rate (Rs/kW)</Label>
            <Input
              type="number"
              value={formData.logisticRate}
              onChange={(e) => setFormData(prev => ({ ...prev, logisticRate: e.target.value }))}
              placeholder="Rate per kW"
              data-testid="input-logistic-rate"
            />
          </div>
          <div className="space-y-2">
            <Label>Distance (km)</Label>
            <Input
              type="number"
              value={formData.deliveryDistanceKm}
              onChange={(e) => setFormData(prev => ({ ...prev, deliveryDistanceKm: e.target.value }))}
              placeholder="One-way distance"
              data-testid="input-delivery-distance"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Actual Delivery Date</Label>
          <Input
            type="date"
            value={formData.actualDeliveryDate}
            onChange={(e) => setFormData(prev => ({ ...prev, actualDeliveryDate: e.target.value }))}
            data-testid="input-actual-delivery-date"
          />
        </div>
      </TabsContent>

      <TabsContent value="verification" className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Receiver Name</Label>
            <Input
              value={formData.receiverName}
              onChange={(e) => setFormData(prev => ({ ...prev, receiverName: e.target.value }))}
              placeholder="Person who received goods"
              data-testid="input-receiver-name"
            />
          </div>
          <div className="space-y-2">
            <Label>Receiver Phone</Label>
            <Input
              value={formData.receiverPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, receiverPhone: e.target.value }))}
              placeholder="Receiver phone number"
              data-testid="input-receiver-phone"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Verification Notes</Label>
          <Textarea
            value={formData.verificationNotes}
            onChange={(e) => setFormData(prev => ({ ...prev, verificationNotes: e.target.value }))}
            placeholder="Notes about site condition, delivery status, etc."
            data-testid="input-verification-notes"
          />
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

        {formData.status === "failed" && (
          <div className="space-y-2">
            <Label>Failure Reason</Label>
            <Textarea
              value={formData.failureReason}
              onChange={(e) => setFormData(prev => ({ ...prev, failureReason: e.target.value }))}
              placeholder="Why did the delivery fail?"
              data-testid="input-failure-reason"
            />
          </div>
        )}

        {formData.status === "rescheduled" && (
          <div className="space-y-2">
            <Label>Reschedule Reason</Label>
            <Textarea
              value={formData.rescheduleReason}
              onChange={(e) => setFormData(prev => ({ ...prev, rescheduleReason: e.target.value }))}
              placeholder="Why was delivery rescheduled?"
              data-testid="input-reschedule-reason"
            />
          </div>
        )}
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Goods Delivery</h1>
          <p className="text-muted-foreground">Track delivery of solar equipment to customer sites (Step 6)</p>
        </div>
        <Button onClick={handleAddOpen} data-testid="button-schedule-delivery">
          <Plus className="mr-2 h-4 w-4" />
          Schedule Delivery
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-deliveries">{deliveries.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-scheduled-count">
              {scheduledCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-delivered-count">
              {deliveredCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600" data-testid="text-in-transit-count">
              {inTransitCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Deliveries</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by customer, address, PO..."
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
                  <TableHead>Customer</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Panel</TableHead>
                  <TableHead>Rate/km</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>PO Number</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeliveries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      No deliveries found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDeliveries.map((delivery) => (
                    <TableRow key={delivery.id} data-testid={`row-delivery-${delivery.id}`}>
                      <TableCell>
                        <div className="font-medium">{delivery.customerName}</div>
                        <div className="text-sm text-muted-foreground">{delivery.customerPhone}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate">{delivery.deliveryAddress}</div>
                        <div className="text-sm text-muted-foreground">
                          {[delivery.district, delivery.state].filter(Boolean).join(", ")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {delivery.scheduledDate ? format(new Date(delivery.scheduledDate), "dd MMM yyyy") : "-"}
                        {delivery.scheduledTimeSlot && (
                          <div className="text-sm text-muted-foreground">{getTimeSlotLabel(delivery.scheduledTimeSlot)}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>{delivery.panelCapacity || "-"}</div>
                        <div className="text-sm text-muted-foreground">
                          {delivery.panelType === "dcr" ? "DCR" : delivery.panelType === "non_dcr" ? "Non-DCR" : "-"}
                        </div>
                      </TableCell>
                      <TableCell>Rs {delivery.logisticRate || "20"}/kW</TableCell>
                      <TableCell>{delivery.deliveryDistanceKm ? `${delivery.deliveryDistanceKm} km` : "-"}</TableCell>
                      <TableCell>{getStatusBadge(delivery.status || "scheduled")}</TableCell>
                      <TableCell>{delivery.poNumber || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(delivery)}
                            data-testid={`button-edit-${delivery.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this delivery?")) {
                                deleteMutation.mutate(delivery.id);
                              }
                            }}
                            data-testid={`button-delete-${delivery.id}`}
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
            <DialogTitle>Schedule Delivery</DialogTitle>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} data-testid="button-cancel-add">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} data-testid="button-confirm-add">
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Schedule Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Delivery</DialogTitle>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending} data-testid="button-confirm-edit">
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
