import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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
  ShoppingCart, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2,
  Calendar,
  IndianRupee,
  Package,
  Truck,
  CheckCircle,
  Clock,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import type { VendorPurchaseOrder, Customer, Vendor, LoanDisbursement } from "@shared/schema";
import { vendorPurchaseOrderStatuses, vendorPaymentStatuses } from "@shared/schema";

export default function AdminVendorPurchaseOrders() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<VendorPurchaseOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("order");
  const [formData, setFormData] = useState({
    customerId: "",
    vendorId: "",
    loanDisbursementId: "",
    poNumber: "",
    customerName: "",
    vendorName: "",
    orderDate: format(new Date(), "yyyy-MM-dd"),
    expectedDeliveryDate: "",
    panelType: "",
    panelCapacity: "",
    inverterType: "",
    quantity: "1",
    orderAmount: "",
    gstAmount: "",
    totalAmount: "",
    advanceAmount: "",
    advanceDate: "",
    advanceReference: "",
    balanceAmount: "",
    balancePaidDate: "",
    balanceReference: "",
    paymentStatus: "pending",
    orderStatus: "draft",
    deliveryDate: "",
    deliveryNotes: "",
    remarks: "",
  });

  const { data: orders = [], isLoading } = useQuery<VendorPurchaseOrder[]>({
    queryKey: ["/api/admin/vendor-purchase-orders"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/admin/vendors"],
  });

  const { data: disbursements = [] } = useQuery<LoanDisbursement[]>({
    queryKey: ["/api/admin/loan-disbursements"],
  });

  useEffect(() => {
    const orderAmt = parseFloat(formData.orderAmount) || 0;
    const gstAmt = parseFloat(formData.gstAmount) || 0;
    const total = orderAmt + gstAmt;
    setFormData(prev => ({ ...prev, totalAmount: total.toString() }));
  }, [formData.orderAmount, formData.gstAmount]);

  useEffect(() => {
    const totalAmt = parseFloat(formData.totalAmount) || 0;
    const advanceAmt = parseFloat(formData.advanceAmount) || 0;
    const balance = totalAmt - advanceAmt;
    setFormData(prev => ({ ...prev, balanceAmount: balance > 0 ? balance.toString() : "0" }));
  }, [formData.totalAmount, formData.advanceAmount]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/admin/vendor-purchase-orders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendor-purchase-orders"] });
      toast({ title: "Purchase order created successfully" });
      setIsAddOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create purchase order", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return await apiRequest("PATCH", `/api/admin/vendor-purchase-orders/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendor-purchase-orders"] });
      toast({ title: "Purchase order updated successfully" });
      setIsEditOpen(false);
      setSelectedOrder(null);
    },
    onError: () => {
      toast({ title: "Failed to update purchase order", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/vendor-purchase-orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendor-purchase-orders"] });
      toast({ title: "Purchase order deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete purchase order", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      customerId: "",
      vendorId: "",
      loanDisbursementId: "",
      poNumber: "",
      customerName: "",
      vendorName: "",
      orderDate: format(new Date(), "yyyy-MM-dd"),
      expectedDeliveryDate: "",
      panelType: "",
      panelCapacity: "",
      inverterType: "",
      quantity: "1",
      orderAmount: "",
      gstAmount: "",
      totalAmount: "",
      advanceAmount: "",
      advanceDate: "",
      advanceReference: "",
      balanceAmount: "",
      balancePaidDate: "",
      balanceReference: "",
      paymentStatus: "pending",
      orderStatus: "draft",
      deliveryDate: "",
      deliveryNotes: "",
      remarks: "",
    });
    setActiveTab("order");
  };

  const generatePoNumber = async () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = orders.length + 1;
    return `PO-${year}${month}-${String(count).padStart(4, '0')}`;
  };

  const handleAddOpen = async () => {
    const poNumber = await generatePoNumber();
    setFormData(prev => ({ ...prev, poNumber }));
    setIsAddOpen(true);
  };

  const handleEdit = (order: VendorPurchaseOrder) => {
    setSelectedOrder(order);
    setFormData({
      customerId: order.customerId || "",
      vendorId: order.vendorId || "",
      loanDisbursementId: order.loanDisbursementId || "",
      poNumber: order.poNumber,
      customerName: order.customerName,
      vendorName: order.vendorName,
      orderDate: order.orderDate ? format(new Date(order.orderDate), "yyyy-MM-dd") : "",
      expectedDeliveryDate: order.expectedDeliveryDate ? format(new Date(order.expectedDeliveryDate), "yyyy-MM-dd") : "",
      panelType: order.panelType || "",
      panelCapacity: order.panelCapacity || "",
      inverterType: order.inverterType || "",
      quantity: String(order.quantity || 1),
      orderAmount: order.orderAmount || "",
      gstAmount: order.gstAmount || "",
      totalAmount: order.totalAmount || "",
      advanceAmount: order.advanceAmount || "",
      advanceDate: order.advanceDate ? format(new Date(order.advanceDate), "yyyy-MM-dd") : "",
      advanceReference: order.advanceReference || "",
      balanceAmount: order.balanceAmount || "",
      balancePaidDate: order.balancePaidDate ? format(new Date(order.balancePaidDate), "yyyy-MM-dd") : "",
      balanceReference: order.balanceReference || "",
      paymentStatus: order.paymentStatus || "pending",
      orderStatus: order.orderStatus || "draft",
      deliveryDate: order.deliveryDate ? format(new Date(order.deliveryDate), "yyyy-MM-dd") : "",
      deliveryNotes: order.deliveryNotes || "",
      remarks: order.remarks || "",
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
        panelType: customer.panelType || "",
        panelCapacity: customer.proposedCapacity || "",
      }));
    }
  };

  const handleVendorSelect = (vendorId: string) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    if (vendor) {
      setFormData(prev => ({
        ...prev,
        vendorId,
        vendorName: vendor.companyName || vendor.name,
      }));
    }
  };

  const handleDisbursementSelect = (disbursementId: string) => {
    const disbursement = disbursements.find((d) => d.id === disbursementId);
    if (disbursement) {
      const customer = customers.find((c) => c.id === disbursement.customerId);
      setFormData(prev => ({
        ...prev,
        loanDisbursementId: disbursementId,
        customerId: disbursement.customerId || "",
        customerName: customer?.name || disbursement.customerName,
      }));
    }
  };

  const handleCreate = () => {
    if (!formData.poNumber || !formData.customerName || !formData.vendorName || !formData.orderDate || !formData.orderAmount || !formData.totalAmount) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedOrder) return;
    updateMutation.mutate({
      id: selectedOrder.id,
      data: formData,
    });
  };

  const getOrderStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      draft: { variant: "secondary", label: "Draft" },
      sent: { variant: "outline", label: "Sent to Vendor" },
      acknowledged: { variant: "outline", label: "Acknowledged" },
      in_progress: { variant: "default", label: "In Progress" },
      delivered: { variant: "default", label: "Delivered" },
      completed: { variant: "default", label: "Completed" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };
    const config = statusConfig[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      partial: { variant: "outline", label: "Partial" },
      paid: { variant: "default", label: "Paid" },
      refunded: { variant: "destructive", label: "Refunded" },
    };
    const config = statusConfig[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (value: string | null | undefined) => {
    if (!value) return "-";
    const num = Number(value);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const filteredOrders = orders.filter((order) => {
    const customerName = order.customerName.toLowerCase();
    const vendorName = order.vendorName.toLowerCase();
    const poNumber = order.poNumber.toLowerCase();
    const query = searchQuery.toLowerCase();
    return customerName.includes(query) || vendorName.includes(query) || poNumber.includes(query);
  });

  const totalOrderAmount = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const totalAdvancePaid = orders.reduce((sum, o) => sum + Number(o.advanceAmount || 0), 0);
  const completedOrders = orders.filter(o => o.orderStatus === "completed" || o.orderStatus === "delivered").length;

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
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Vendor Purchase Orders</h1>
          <p className="text-muted-foreground">Create and track purchase orders to vendors with payment details (Step 5)</p>
        </div>
        <Button onClick={handleAddOpen} data-testid="button-add-purchase-order">
          <Plus className="mr-2 h-4 w-4" />
          Create Purchase Order
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-orders">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed/Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-completed-count">
              {completedOrders}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Order Value</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-value">
              {formatCurrency(String(totalOrderAmount))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Advance Paid</CardTitle>
            <IndianRupee className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-advance-paid">
              {formatCurrency(String(totalAdvancePaid))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Purchase Orders</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by customer, vendor, PO number..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No purchase orders found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Order Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono font-medium">{order.poNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customerName}</div>
                          {order.panelCapacity && (
                            <div className="text-sm text-muted-foreground">{order.panelCapacity} - {order.panelType}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.vendorName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {order.orderDate 
                            ? format(new Date(order.orderDate), "dd MMM yyyy")
                            : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-4 w-4 text-muted-foreground" />
                          {formatCurrency(order.totalAmount)}
                        </div>
                      </TableCell>
                      <TableCell>{getPaymentStatusBadge(order.paymentStatus || "pending")}</TableCell>
                      <TableCell>{getOrderStatusBadge(order.orderStatus || "draft")}</TableCell>
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
                              if (confirm("Are you sure you want to delete this purchase order?")) {
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="order">Order Details</TabsTrigger>
              <TabsTrigger value="payment">Payment Info</TabsTrigger>
              <TabsTrigger value="delivery">Delivery</TabsTrigger>
            </TabsList>
            
            <TabsContent value="order" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="poNumber">PO Number *</Label>
                  <Input
                    id="poNumber"
                    value={formData.poNumber}
                    onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                    placeholder="PO-202412-0001"
                    data-testid="input-po-number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orderDate">Order Date *</Label>
                  <Input
                    id="orderDate"
                    type="date"
                    value={formData.orderDate}
                    onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                    data-testid="input-order-date"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Link to Disbursement (Optional)</Label>
                <Select
                  value={formData.loanDisbursementId}
                  onValueChange={handleDisbursementSelect}
                >
                  <SelectTrigger data-testid="select-disbursement">
                    <SelectValue placeholder="Select from disbursements" />
                  </SelectTrigger>
                  <SelectContent>
                    {disbursements.filter(d => d.status === "received").map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.customerName} - {formatCurrency(d.disbursedAmount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Select Customer</Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={handleCustomerSelect}
                  >
                    <SelectTrigger data-testid="select-customer">
                      <SelectValue placeholder="Select customer" />
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
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Enter customer name"
                    data-testid="input-customer-name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Select Vendor</Label>
                  <Select
                    value={formData.vendorId}
                    onValueChange={handleVendorSelect}
                  >
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
                  <Label htmlFor="vendorName">Vendor Name *</Label>
                  <Input
                    id="vendorName"
                    value={formData.vendorName}
                    onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                    placeholder="Enter vendor name"
                    data-testid="input-vendor-name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="panelType">Panel Type</Label>
                  <Select
                    value={formData.panelType}
                    onValueChange={(value) => setFormData({ ...formData, panelType: value })}
                  >
                    <SelectTrigger data-testid="select-panel-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DCR">DCR</SelectItem>
                      <SelectItem value="Non-DCR">Non-DCR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panelCapacity">Capacity</Label>
                  <Select
                    value={formData.panelCapacity}
                    onValueChange={(value) => setFormData({ ...formData, panelCapacity: value })}
                  >
                    <SelectTrigger data-testid="select-capacity">
                      <SelectValue placeholder="Select capacity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1kW">1 kW</SelectItem>
                      <SelectItem value="2kW">2 kW</SelectItem>
                      <SelectItem value="3kW">3 kW</SelectItem>
                      <SelectItem value="5kW">5 kW</SelectItem>
                      <SelectItem value="6kW">6 kW</SelectItem>
                      <SelectItem value="7kW">7 kW</SelectItem>
                      <SelectItem value="8kW">8 kW</SelectItem>
                      <SelectItem value="10kW">10 kW</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inverterType">Inverter Type</Label>
                  <Select
                    value={formData.inverterType}
                    onValueChange={(value) => setFormData({ ...formData, inverterType: value })}
                  >
                    <SelectTrigger data-testid="select-inverter">
                      <SelectValue placeholder="Select inverter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="On-grid">On-grid</SelectItem>
                      <SelectItem value="Hybrid 3-in-1">Hybrid 3-in-1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  min="1"
                  data-testid="input-quantity"
                />
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderAmount">Order Amount (INR) *</Label>
                  <Input
                    id="orderAmount"
                    type="number"
                    value={formData.orderAmount}
                    onChange={(e) => setFormData({ ...formData, orderAmount: e.target.value })}
                    placeholder="100000"
                    data-testid="input-order-amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstAmount">GST Amount</Label>
                  <Input
                    id="gstAmount"
                    type="number"
                    value={formData.gstAmount}
                    onChange={(e) => setFormData({ ...formData, gstAmount: e.target.value })}
                    placeholder="18000"
                    data-testid="input-gst-amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalAmount">Total Amount *</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                    placeholder="118000"
                    data-testid="input-total-amount"
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Advance Payment</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="advanceAmount">Amount</Label>
                    <Input
                      id="advanceAmount"
                      type="number"
                      value={formData.advanceAmount}
                      onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })}
                      placeholder="50000"
                      data-testid="input-advance-amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="advanceDate">Date</Label>
                    <Input
                      id="advanceDate"
                      type="date"
                      value={formData.advanceDate}
                      onChange={(e) => setFormData({ ...formData, advanceDate: e.target.value })}
                      data-testid="input-advance-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="advanceReference">Reference (UTR/NEFT)</Label>
                    <Input
                      id="advanceReference"
                      value={formData.advanceReference}
                      onChange={(e) => setFormData({ ...formData, advanceReference: e.target.value })}
                      placeholder="UTR123456789"
                      data-testid="input-advance-reference"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Balance Payment</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="balanceAmount">Amount</Label>
                    <Input
                      id="balanceAmount"
                      type="number"
                      value={formData.balanceAmount}
                      readOnly
                      className="bg-muted"
                      data-testid="input-balance-amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="balancePaidDate">Paid Date</Label>
                    <Input
                      id="balancePaidDate"
                      type="date"
                      value={formData.balancePaidDate}
                      onChange={(e) => setFormData({ ...formData, balancePaidDate: e.target.value })}
                      data-testid="input-balance-paid-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="balanceReference">Reference (UTR/NEFT)</Label>
                    <Input
                      id="balanceReference"
                      value={formData.balanceReference}
                      onChange={(e) => setFormData({ ...formData, balanceReference: e.target.value })}
                      placeholder="UTR987654321"
                      data-testid="input-balance-reference"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select
                  value={formData.paymentStatus}
                  onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}
                >
                  <SelectTrigger data-testid="select-payment-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vendorPaymentStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="delivery" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expectedDeliveryDate">Expected Delivery Date</Label>
                  <Input
                    id="expectedDeliveryDate"
                    type="date"
                    value={formData.expectedDeliveryDate}
                    onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                    data-testid="input-expected-delivery"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryDate">Actual Delivery Date</Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    data-testid="input-delivery-date"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orderStatus">Order Status</Label>
                <Select
                  value={formData.orderStatus}
                  onValueChange={(value) => setFormData({ ...formData, orderStatus: value })}
                >
                  <SelectTrigger data-testid="select-order-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vendorPurchaseOrderStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryNotes">Delivery Notes</Label>
                <Textarea
                  id="deliveryNotes"
                  value={formData.deliveryNotes}
                  onChange={(e) => setFormData({ ...formData, deliveryNotes: e.target.value })}
                  placeholder="Notes about delivery..."
                  data-testid="input-delivery-notes"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Any additional notes..."
                  data-testid="input-remarks"
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} data-testid="button-cancel-create">
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={createMutation.isPending}
              data-testid="button-submit-create"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Purchase Order"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Purchase Order - {selectedOrder?.poNumber}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="order">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="order">Order Details</TabsTrigger>
              <TabsTrigger value="payment">Payment Info</TabsTrigger>
              <TabsTrigger value="delivery">Delivery</TabsTrigger>
            </TabsList>
            
            <TabsContent value="order" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-poNumber">PO Number</Label>
                  <Input
                    id="edit-poNumber"
                    value={formData.poNumber}
                    onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                    data-testid="input-edit-po-number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-orderDate">Order Date</Label>
                  <Input
                    id="edit-orderDate"
                    type="date"
                    value={formData.orderDate}
                    onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                    data-testid="input-edit-order-date"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-customerName">Customer Name</Label>
                  <Input
                    id="edit-customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    data-testid="input-edit-customer-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-vendorName">Vendor Name</Label>
                  <Input
                    id="edit-vendorName"
                    value={formData.vendorName}
                    onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                    data-testid="input-edit-vendor-name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-panelType">Panel Type</Label>
                  <Select
                    value={formData.panelType}
                    onValueChange={(value) => setFormData({ ...formData, panelType: value })}
                  >
                    <SelectTrigger data-testid="select-edit-panel-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DCR">DCR</SelectItem>
                      <SelectItem value="Non-DCR">Non-DCR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-panelCapacity">Capacity</Label>
                  <Input
                    id="edit-panelCapacity"
                    value={formData.panelCapacity}
                    onChange={(e) => setFormData({ ...formData, panelCapacity: e.target.value })}
                    data-testid="input-edit-capacity"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-inverterType">Inverter Type</Label>
                  <Select
                    value={formData.inverterType}
                    onValueChange={(value) => setFormData({ ...formData, inverterType: value })}
                  >
                    <SelectTrigger data-testid="select-edit-inverter">
                      <SelectValue placeholder="Select inverter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="On-grid">On-grid</SelectItem>
                      <SelectItem value="Hybrid 3-in-1">Hybrid 3-in-1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-orderAmount">Order Amount</Label>
                  <Input
                    id="edit-orderAmount"
                    type="number"
                    value={formData.orderAmount}
                    onChange={(e) => setFormData({ ...formData, orderAmount: e.target.value })}
                    data-testid="input-edit-order-amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-gstAmount">GST Amount</Label>
                  <Input
                    id="edit-gstAmount"
                    type="number"
                    value={formData.gstAmount}
                    onChange={(e) => setFormData({ ...formData, gstAmount: e.target.value })}
                    data-testid="input-edit-gst-amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-totalAmount">Total Amount</Label>
                  <Input
                    id="edit-totalAmount"
                    type="number"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                    data-testid="input-edit-total-amount"
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Advance Payment</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={formData.advanceAmount}
                      onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })}
                      data-testid="input-edit-advance-amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={formData.advanceDate}
                      onChange={(e) => setFormData({ ...formData, advanceDate: e.target.value })}
                      data-testid="input-edit-advance-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reference</Label>
                    <Input
                      value={formData.advanceReference}
                      onChange={(e) => setFormData({ ...formData, advanceReference: e.target.value })}
                      data-testid="input-edit-advance-reference"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Balance Payment</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={formData.balanceAmount}
                      onChange={(e) => setFormData({ ...formData, balanceAmount: e.target.value })}
                      data-testid="input-edit-balance-amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Paid Date</Label>
                    <Input
                      type="date"
                      value={formData.balancePaidDate}
                      onChange={(e) => setFormData({ ...formData, balancePaidDate: e.target.value })}
                      data-testid="input-edit-balance-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reference</Label>
                    <Input
                      value={formData.balanceReference}
                      onChange={(e) => setFormData({ ...formData, balanceReference: e.target.value })}
                      data-testid="input-edit-balance-reference"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Status</Label>
                <Select
                  value={formData.paymentStatus}
                  onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}
                >
                  <SelectTrigger data-testid="select-edit-payment-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vendorPaymentStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="delivery" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expected Delivery Date</Label>
                  <Input
                    type="date"
                    value={formData.expectedDeliveryDate}
                    onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                    data-testid="input-edit-expected-delivery"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Actual Delivery Date</Label>
                  <Input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    data-testid="input-edit-delivery-date"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Order Status</Label>
                <Select
                  value={formData.orderStatus}
                  onValueChange={(value) => setFormData({ ...formData, orderStatus: value })}
                >
                  <SelectTrigger data-testid="select-edit-order-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vendorPurchaseOrderStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Delivery Notes</Label>
                <Textarea
                  value={formData.deliveryNotes}
                  onChange={(e) => setFormData({ ...formData, deliveryNotes: e.target.value })}
                  data-testid="input-edit-delivery-notes"
                />
              </div>

              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  data-testid="input-edit-remarks"
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} data-testid="button-cancel-update">
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate} 
              disabled={updateMutation.isPending}
              data-testid="button-submit-update"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Purchase Order"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
