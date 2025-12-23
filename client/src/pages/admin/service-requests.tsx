import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Wrench,
  Search,
  Eye,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Clock,
  Phone,
  MapPin,
  Calendar,
  Star,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ServiceRequest, Vendor } from "@shared/schema";

const issueTypeLabels: Record<string, string> = {
  electrical: "Electrical",
  inverter: "Inverter",
  power_generation: "Power Generation",
  panel_damage: "Panel Damage",
  wiring: "Wiring",
  meter: "Meter",
  other: "Other",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500 text-white",
  assigned: "bg-blue-500 text-white",
  in_progress: "bg-purple-500 text-white",
  resolved: "bg-green-500 text-white",
  closed: "bg-gray-500 text-white",
};

const urgencyColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  normal: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function AdminServiceRequests() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");

  const { data: serviceRequests, isLoading } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/admin/service-requests"],
  });

  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ["/api/admin/vendors"],
  });

  const approvedVendors = vendors?.filter(v => v.status === "approved") || [];

  const assignMutation = useMutation({
    mutationFn: async ({ id, vendorId, scheduledVisitDate }: { id: string; vendorId: string; scheduledVisitDate?: string }) => {
      return apiRequest("POST", `/api/admin/service-requests/${id}/assign`, { vendorId, scheduledVisitDate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/service-requests"] });
      toast({ title: "Vendor assigned successfully" });
      setShowAssignDialog(false);
      setSelectedRequest(null);
      setSelectedVendorId("");
      setScheduledDate("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to assign vendor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/admin/service-requests/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/service-requests"] });
      toast({ title: "Status updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredRequests = serviceRequests?.filter((item) => {
    const matchesSearch =
      item.requestNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.issueTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customerPhone?.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesUrgency = urgencyFilter === "all" || item.urgency === urgencyFilter;
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  const handleAssignVendor = () => {
    if (selectedRequest && selectedVendorId) {
      assignMutation.mutate({
        id: selectedRequest.id,
        vendorId: selectedVendorId,
        scheduledVisitDate: scheduledDate || undefined,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const pendingCount = serviceRequests?.filter((r) => r.status === "pending").length || 0;
  const assignedCount = serviceRequests?.filter((r) => r.status === "assigned").length || 0;
  const resolvedCount = serviceRequests?.filter((r) => r.status === "resolved" || r.status === "closed").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            Service Requests
          </h1>
          <p className="text-muted-foreground">Manage customer service requests and assign vendors</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assignedCount}</p>
                <p className="text-sm text-muted-foreground">Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resolvedCount}</p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Service Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by request number, title, customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-requests"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-urgency-filter">
                <SelectValue placeholder="Filter by urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!filteredRequests || filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No service requests found</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id} data-testid={`row-request-${request.id}`}>
                      <TableCell className="font-mono text-sm">{request.requestNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.customerName}</p>
                          <p className="text-xs text-muted-foreground">{request.customerPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge variant="outline">{issueTypeLabels[request.issueType] || request.issueType}</Badge>
                          <p className="text-sm mt-1 truncate max-w-[200px]">{request.issueTitle}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={urgencyColors[request.urgency || "normal"]}>
                          {request.urgency}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[request.status]}>
                          {request.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(request.createdAt!).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedRequest(request)}
                            data-testid={`button-view-${request.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {request.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowAssignDialog(true);
                              }}
                              data-testid={`button-assign-${request.id}`}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
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

      <Dialog open={!!selectedRequest && !showAssignDialog} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Service Request Details
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.requestNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge className={statusColors[selectedRequest.status]}>
                  {selectedRequest.status.replace(/_/g, " ")}
                </Badge>
                <Badge className={urgencyColors[selectedRequest.urgency || "normal"]}>
                  {selectedRequest.urgency}
                </Badge>
                <Badge variant="outline">{issueTypeLabels[selectedRequest.issueType]}</Badge>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">{selectedRequest.issueTitle}</h4>
                <p className="text-sm text-muted-foreground">{selectedRequest.issueDescription}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{selectedRequest.customerName}</p>
                    <p className="text-sm text-muted-foreground">{selectedRequest.customerPhone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm">{selectedRequest.customerAddress}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm">Created: {new Date(selectedRequest.createdAt!).toLocaleString("en-IN")}</p>
                </div>
                {selectedRequest.resolvedAt && (
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <p className="text-sm">Resolved: {new Date(selectedRequest.resolvedAt).toLocaleString("en-IN")}</p>
                  </div>
                )}
              </div>
              {selectedRequest.vendorNotes && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <p className="text-sm font-medium">Vendor Notes:</p>
                  <p className="text-sm">{selectedRequest.vendorNotes}</p>
                </div>
              )}
              {selectedRequest.resolutionNotes && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                  <p className="text-sm font-medium">Resolution:</p>
                  <p className="text-sm">{selectedRequest.resolutionNotes}</p>
                </div>
              )}
              {selectedRequest.vendorSelfieWithCustomer && (
                <div>
                  <p className="text-sm font-medium mb-2">Vendor Selfie with Customer:</p>
                  <img
                    src={selectedRequest.vendorSelfieWithCustomer}
                    alt="Vendor selfie"
                    className="w-32 h-32 object-cover rounded-md"
                  />
                </div>
              )}
              {selectedRequest.customerFeedbackRating && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < selectedRequest.customerFeedbackRating! ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`}
                      />
                    ))}
                  </div>
                  {selectedRequest.customerFeedbackText && (
                    <p className="text-sm text-muted-foreground ml-2">"{selectedRequest.customerFeedbackText}"</p>
                  )}
                </div>
              )}
              {selectedRequest.status === "pending" && (
                <Button
                  className="w-full"
                  onClick={() => setShowAssignDialog(true)}
                  data-testid="button-assign-vendor"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Assign Vendor
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Vendor</DialogTitle>
            <DialogDescription>
              Select a vendor to handle this service request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Vendor</Label>
              <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                <SelectTrigger data-testid="select-vendor">
                  <SelectValue placeholder="Choose a vendor" />
                </SelectTrigger>
                <SelectContent>
                  {approvedVendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.companyName} - {vendor.contactPerson}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Scheduled Visit Date (Optional)</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                data-testid="input-scheduled-date"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleAssignVendor}
              disabled={!selectedVendorId || assignMutation.isPending}
              data-testid="button-confirm-assign"
            >
              {assignMutation.isPending ? "Assigning..." : "Assign Vendor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
