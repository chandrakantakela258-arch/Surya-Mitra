import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, User, Truck, Building2, Wrench, Package, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Vendor, CustomerVendorAssignment } from "@shared/schema";

const journeyStages = [
  { value: "pre_installation", label: "Pre-Installation", description: "Survey, documentation, approvals" },
  { value: "installation", label: "Installation", description: "Panel mounting, wiring, inverter setup" },
  { value: "post_installation", label: "Post-Installation", description: "Meter installation, subsidy, commissioning" },
];

const vendorTypeLabels: Record<string, string> = {
  logistic: "Logistic",
  bank_loan_liaison: "Bank Loan Liaison",
  discom_net_metering: "Discom Net Metering",
  electrical: "Electrical",
  solar_installation: "Solar Installation",
  solar_panel_supplier: "Solar Panel Supplier",
  inverter_supplier: "Inverter Supplier",
  structure_material_supplier: "Structure Material",
  electrical_supplier: "Electrical Supplier",
  civil_material_supplier: "Civil Material",
  other_accessory_supplier: "Accessory Supplier",
  lithium_ion_battery_supplier: "Li-ion Battery",
  tubular_gel_battery_supplier: "Tubular/Gel Battery",
};

interface VendorAssignmentProps {
  customerId: string;
  customerName: string;
}

interface EnrichedAssignment extends CustomerVendorAssignment {
  vendor?: Vendor;
}

export function VendorAssignment({ customerId, customerName }: VendorAssignmentProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [notes, setNotes] = useState("");

  const { data: approvedVendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/admin/vendors/approved"],
  });

  const { data: assignments = [], isLoading } = useQuery<EnrichedAssignment[]>({
    queryKey: ["/api/customers", customerId, "vendor-assignments"],
  });

  const assignVendorMutation = useMutation({
    mutationFn: async (data: { vendorId: string; journeyStage: string; jobRole: string; notes?: string }) => {
      await apiRequest("POST", "/api/admin/vendor-assignments", {
        customerId,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "vendor-assignments"] });
      toast({
        title: "Vendor Assigned",
        description: "The vendor has been assigned to this customer's job.",
      });
      resetForm();
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign vendor",
        variant: "destructive",
      });
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/admin/vendor-assignments/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "vendor-assignments"] });
      toast({
        title: "Assignment Updated",
        description: "The vendor assignment status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update assignment",
        variant: "destructive",
      });
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/vendor-assignments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "vendor-assignments"] });
      toast({
        title: "Assignment Removed",
        description: "The vendor assignment has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove assignment",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedVendor("");
    setSelectedStage("");
    setJobRole("");
    setNotes("");
  };

  const handleAssign = () => {
    if (!selectedVendor || !selectedStage) {
      toast({
        title: "Missing Information",
        description: "Please select both a vendor and a journey stage.",
        variant: "destructive",
      });
      return;
    }
    const selectedVendorData = approvedVendors.find(v => v.id === selectedVendor);
    const effectiveJobRole = jobRole.trim() || selectedVendorData?.vendorType || "solar_installation";
    assignVendorMutation.mutate({
      vendorId: selectedVendor,
      journeyStage: selectedStage,
      jobRole: effectiveJobRole,
      notes: notes.trim() || undefined,
    });
  };

  const getVendorIcon = (vendorType?: string) => {
    if (!vendorType) return User;
    if (vendorType.includes("supplier")) return Package;
    if (vendorType === "logistic") return Truck;
    if (vendorType === "electrical") return Wrench;
    return Building2;
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">In Progress</Badge>;
      default:
        return <Badge variant="secondary">Assigned</Badge>;
    }
  };

  const groupedAssignments = journeyStages.map(stage => ({
    ...stage,
    assignments: assignments.filter(a => a.journeyStage === stage.value),
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Vendor Assignments
            </CardTitle>
            <CardDescription>
              Assign vendors to different stages of {customerName}'s installation
            </CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-assign-vendor">
                <Plus className="h-4 w-4 mr-1" />
                Assign Vendor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Vendor to Job</DialogTitle>
                <DialogDescription>
                  Select a vendor to assign to {customerName}'s solar installation project.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor</Label>
                  <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                    <SelectTrigger data-testid="select-vendor">
                      <SelectValue placeholder="Select a vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvedVendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{vendor.vendorCode || "N/A"}</span>
                            <span className="text-muted-foreground">-</span>
                            <span>{vendor.name}</span>
                            <Badge variant="outline" className="ml-1 text-xs">
                              {vendorTypeLabels[vendor.vendorType || ""] || vendor.vendorType}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stage">Journey Stage</Label>
                  <Select value={selectedStage} onValueChange={setSelectedStage}>
                    <SelectTrigger data-testid="select-stage">
                      <SelectValue placeholder="Select a stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {journeyStages.map((stage) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          <div>
                            <span className="font-medium">{stage.label}</span>
                            <span className="text-xs text-muted-foreground ml-2">{stage.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Job Role (Optional)</Label>
                  <Textarea
                    id="role"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder="e.g., Deliver panels to site, Install mounting structure..."
                    data-testid="input-job-role"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes..."
                    data-testid="input-notes"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAssign}
                  disabled={assignVendorMutation.isPending}
                  data-testid="button-confirm-assign"
                >
                  {assignVendorMutation.isPending ? "Assigning..." : "Assign Vendor"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No vendors assigned yet</p>
            <p className="text-sm">Click "Assign Vendor" to add vendors to this job</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedAssignments.map((stage) => (
              stage.assignments.length > 0 && (
                <div key={stage.value}>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Badge variant="outline">{stage.label}</Badge>
                    <span className="text-muted-foreground text-xs">{stage.description}</span>
                  </h4>
                  <div className="space-y-2">
                    {stage.assignments.map((assignment) => {
                      const VendorIcon = getVendorIcon(assignment.vendor?.vendorType);
                      return (
                        <div 
                          key={assignment.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card"
                          data-testid={`vendor-assignment-${assignment.id}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-md bg-muted">
                              <VendorIcon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">
                                  {assignment.vendor?.vendorCode || "N/A"}
                                </span>
                                <span className="text-sm">{assignment.vendor?.name || "Unknown Vendor"}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                                <Badge variant="secondary" className="text-xs">
                                  {vendorTypeLabels[assignment.vendor?.vendorType || ""] || "Vendor"}
                                </Badge>
                                {assignment.jobRole && (
                                  <span>{vendorTypeLabels[assignment.jobRole] || assignment.jobRole}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(assignment.status)}
                            {assignment.status !== "completed" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => updateAssignmentMutation.mutate({ 
                                  id: assignment.id, 
                                  status: "completed" 
                                })}
                                data-testid={`button-complete-assignment-${assignment.id}`}
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteAssignmentMutation.mutate(assignment.id)}
                              data-testid={`button-delete-assignment-${assignment.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Users(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
