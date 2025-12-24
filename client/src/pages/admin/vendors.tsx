import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Vendor, vendorServices, vendorSpecializations, vendorCertifications, vendorEquipment, vendorTypeOptions, getVendorQuotationDisplay, vendorQuotationConfig } from "@shared/schema";
import { Search, CheckCircle, XCircle, Clock, Eye, Phone, Mail, MapPin, Building2, Wrench, Users, Award, Truck, CreditCard, FileText } from "lucide-react";
import { format } from "date-fns";

export default function AdminVendors() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [actionNotes, setActionNotes] = useState("");

  const { data: vendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/admin/vendors"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/vendors/${id}/status`, { status, notes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors"] });
      toast({
        title: "Status Updated",
        description: `Vendor has been ${actionType === "approve" ? "approved" : "rejected"} successfully.`,
      });
      setShowActionDialog(false);
      setActionNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.phone.includes(searchQuery) ||
      vendor.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.state.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || vendor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = vendors.filter((v) => v.status === "pending").length;
  const approvedCount = vendors.filter((v) => v.status === "approved").length;
  const rejectedCount = vendors.filter((v) => v.status === "rejected").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const getServiceLabels = (services: string[] | null) => {
    if (!services) return "-";
    return services.map(s => vendorServices.find(vs => vs.value === s)?.label || s).join(", ");
  };

  const getVendorTypeLabel = (vendorType: string | null) => {
    if (!vendorType) return "Solar Installation";
    return vendorTypeOptions.find(opt => opt.value === vendorType)?.label || vendorType;
  };

  const handleAction = (vendor: Vendor, type: "approve" | "reject") => {
    setSelectedVendor(vendor);
    setActionType(type);
    setShowActionDialog(true);
  };

  const confirmAction = () => {
    if (!selectedVendor) return;
    updateStatusMutation.mutate({
      id: selectedVendor.id,
      status: actionType === "approve" ? "approved" : "rejected",
      notes: actionNotes,
    });
  };

  const viewDetails = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowDetailsDialog(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vendor Registrations</h1>
          <p className="text-muted-foreground">Manage site installation vendor applications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>All Vendor Applications</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-[250px]"
                  data-testid="input-search-vendors"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]" data-testid="select-vendor-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading vendors...</div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No vendors found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Best Price</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.map((vendor) => (
                    <TableRow key={vendor.id} data-testid={`row-vendor-${vendor.id}`}>
                      <TableCell>
                        {vendor.vendorCode ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            {vendor.vendorCode}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{vendor.name}</div>
                          {vendor.companyName && (
                            <div className="text-sm text-muted-foreground">{vendor.companyName}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {getVendorTypeLabel(vendor.vendorType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm max-w-[200px]">
                          <div className="font-mono text-xs break-words">{getVendorQuotationDisplay(vendor)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a href={`tel:+91${vendor.phone}`} className="text-blue-600 hover:underline">
                          +91 {vendor.phone}
                        </a>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{vendor.district}</div>
                          <div className="text-muted-foreground">{vendor.state}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(vendor.status)}</TableCell>
                      <TableCell>
                        {vendor.createdAt ? format(new Date(vendor.createdAt), "dd MMM yyyy") : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => viewDetails(vendor)}
                            data-testid={`button-view-vendor-${vendor.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {vendor.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleAction(vendor, "approve")}
                                data-testid={`button-approve-vendor-${vendor.id}`}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleAction(vendor, "reject")}
                                data-testid={`button-reject-vendor-${vendor.id}`}
                              >
                                Reject
                              </Button>
                            </>
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

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Vendor Details</DialogTitle>
            <DialogDescription>Complete information about the vendor</DialogDescription>
          </DialogHeader>
          {selectedVendor && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="experience">Experience</TabsTrigger>
                  <TabsTrigger value="equipment">Equipment</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Vendor Code</p>
                      <p className="font-medium">
                        {selectedVendor.vendorCode ? (
                          <Badge variant="outline" className="font-mono">
                            {selectedVendor.vendorCode}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Assigned on approval</span>
                        )}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Vendor Type</p>
                      <p className="font-medium">
                        <Badge variant="secondary">
                          {getVendorTypeLabel(selectedVendor.vendorType)}
                        </Badge>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">{selectedVendor.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Father's Name</p>
                      <p className="font-medium">{selectedVendor.fatherName || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">{selectedVendor.dateOfBirth || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">+91 {selectedVendor.phone}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Alternate Phone</p>
                      <p className="font-medium">{selectedVendor.alternatePhone ? `+91 ${selectedVendor.alternatePhone}` : "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedVendor.email || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Company Name</p>
                      <p className="font-medium">{selectedVendor.companyName || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Company Type</p>
                      <p className="font-medium">{selectedVendor.companyType || "-"}</p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2"><MapPin className="w-4 h-4" /> Location</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">State</p>
                        <p className="font-medium">{selectedVendor.state}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">District</p>
                        <p className="font-medium">{selectedVendor.district}</p>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium">{selectedVendor.address}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Pincode</p>
                        <p className="font-medium">{selectedVendor.pincode}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="experience" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Years of Experience</p>
                      <p className="font-medium">{selectedVendor.experienceYears || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Installations</p>
                      <p className="font-medium">{selectedVendor.totalInstallations || "-"}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Services Offered</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedVendor.services?.map((s) => (
                        <Badge key={s} variant="secondary">
                          {vendorServices.find(vs => vs.value === s)?.label || s}
                        </Badge>
                      )) || "-"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Specializations</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedVendor.specializations?.map((s) => (
                        <Badge key={s} variant="outline">
                          {vendorSpecializations.find(vs => vs.value === s)?.label || s}
                        </Badge>
                      )) || "-"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Previous Companies</p>
                    <p className="font-medium">{selectedVendor.previousCompanies || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Projects Completed</p>
                    <p className="font-medium">{selectedVendor.projectsCompleted || "-"}</p>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2"><Users className="w-4 h-4" /> Team Details</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Team Size</p>
                        <p className="font-medium">{selectedVendor.teamSize || "-"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Supervisors</p>
                        <p className="font-medium">{selectedVendor.supervisorCount || "-"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Helpers</p>
                        <p className="font-medium">{selectedVendor.helperCount || "-"}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="equipment" className="space-y-4 mt-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Equipment Owned</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedVendor.equipmentOwned?.map((e) => (
                        <Badge key={e} variant="secondary">
                          {vendorEquipment.find(ve => ve.value === e)?.label || e}
                        </Badge>
                      )) || "-"}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Has Transportation</p>
                      <p className="font-medium">{selectedVendor.hasTransportation ? "Yes" : "No"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Vehicle Details</p>
                      <p className="font-medium">{selectedVendor.vehicleDetails || "-"}</p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2"><Award className="w-4 h-4" /> Certifications</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedVendor.certifications?.map((c) => (
                        <Badge key={c} variant="outline">
                          {vendorCertifications.find(vc => vc.value === c)?.label || c}
                        </Badge>
                      )) || "-"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Training Details</p>
                    <p className="font-medium">{selectedVendor.trainingDetails || "-"}</p>
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4 mt-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Aadhar Number</p>
                      <p className="font-medium">{selectedVendor.aadharNumber || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">PAN Number</p>
                      <p className="font-medium">{selectedVendor.panNumber || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">GST Number</p>
                      <p className="font-medium">{selectedVendor.gstNumber || "-"}</p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Bank Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Account Holder Name</p>
                        <p className="font-medium">{selectedVendor.bankAccountName || "-"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Account Number</p>
                        <p className="font-medium">{selectedVendor.bankAccountNumber || "-"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">IFSC Code</p>
                        <p className="font-medium">{selectedVendor.bankIfsc || "-"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Bank Name</p>
                        <p className="font-medium">{selectedVendor.bankName || "-"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">UPI ID</p>
                        <p className="font-medium">{selectedVendor.upiId || "-"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Best Price Quotation</h4>
                    <div className="space-y-2">
                      <p className="font-mono text-sm">{getVendorQuotationDisplay(selectedVendor)}</p>
                      {vendorQuotationConfig[selectedVendor.vendorType] && (
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          {vendorQuotationConfig[selectedVendor.vendorType].fields.map((fieldConfig) => {
                            const value = selectedVendor[fieldConfig.key as keyof Vendor];
                            const displayValue = value ? String(value) : null;
                            return (
                              <div key={fieldConfig.key} className="space-y-1">
                                <p className="text-sm text-muted-foreground">{fieldConfig.label}</p>
                                <p className="font-medium font-mono">
                                  {displayValue ? (
                                    fieldConfig.key === 'electricalWireRates' ? (
                                      (() => {
                                        try {
                                          const rates = JSON.parse(displayValue);
                                          return Object.entries(rates).map(([size, rate]) => (
                                            <span key={size} className="block">
                                              {size}: ₹{String(rate)}/m
                                            </span>
                                          ));
                                        } catch {
                                          return displayValue;
                                        }
                                      })()
                                    ) : (
                                      `₹${displayValue} ${fieldConfig.unit}`
                                    )
                                  ) : '-'}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {selectedVendor.quotationDescription && (
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground">Details</p>
                          <p className="text-sm">{selectedVendor.quotationDescription}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedVendor.notes && (
                    <div className="border-t pt-4">
                      <p className="text-sm text-muted-foreground">Admin Notes</p>
                      <p className="font-medium">{selectedVendor.notes}</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
            {selectedVendor?.status === "pending" && (
              <>
                <Button onClick={() => { setShowDetailsDialog(false); handleAction(selectedVendor, "approve"); }}>
                  Approve
                </Button>
                <Button variant="destructive" onClick={() => { setShowDetailsDialog(false); handleAction(selectedVendor, "reject"); }}>
                  Reject
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionType === "approve" ? "Approve" : "Reject"} Vendor</DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "This vendor will be approved and can work on installations."
                : "This vendor application will be rejected."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Vendor</p>
              <p>{selectedVendor?.name} - {selectedVendor?.district}, {selectedVendor?.state}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Notes (Optional)</p>
              <Textarea
                placeholder={actionType === "approve" ? "Add any notes for approval..." : "Reason for rejection..."}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                data-testid="input-vendor-action-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              onClick={confirmAction}
              disabled={updateStatusMutation.isPending}
              data-testid="button-confirm-vendor-action"
            >
              {updateStatusMutation.isPending ? "Processing..." : actionType === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
