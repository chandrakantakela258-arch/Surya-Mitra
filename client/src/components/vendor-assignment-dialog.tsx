import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building2, MapPin, Phone, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Vendor } from "@shared/schema";

export type VendorAssignmentType = "discom" | "bank_loan";

interface VendorAssignmentConfig {
  title: string;
  description: string;
  vendorLabel: string;
  apiEndpoint: string;
  jobRole: string;
  journeyStage: string;
  defaultNotes: string;
  emptyStateMessage: string;
}

const vendorConfigs: Record<VendorAssignmentType, VendorAssignmentConfig> = {
  discom: {
    title: "Assign DISCOM Vendor",
    description: "Optionally assign a DISCOM net metering vendor to handle the liaison with the electricity distribution company.",
    vendorLabel: "DISCOM Net Metering Vendor",
    apiEndpoint: "/api/admin/vendors/discom",
    jobRole: "discom_net_metering",
    journeyStage: "pre_installation",
    defaultNotes: "File submitted to PM Surya Ghar portal",
    emptyStateMessage: "No approved DISCOM vendors available for this state.",
  },
  bank_loan: {
    title: "Assign Bank Loan Vendor",
    description: "Optionally assign a Bank Loan vendor to arrange bank official site visits and expedite loan approval.",
    vendorLabel: "Bank Loan Vendor",
    apiEndpoint: "/api/admin/vendors/bank-loan",
    jobRole: "bank_loan_facilitation",
    journeyStage: "pre_installation",
    defaultNotes: "Bank loan file submitted for processing",
    emptyStateMessage: "No approved Bank Loan vendors available for this state.",
  },
};

interface VendorAssignmentDialogProps {
  customerId: string;
  customerName: string;
  customerState?: string;
  milestoneId: string;
  assignmentType: VendorAssignmentType;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function VendorAssignmentDialog({
  customerId,
  customerName,
  customerState,
  milestoneId,
  assignmentType,
  isOpen,
  onClose,
  onSuccess,
}: VendorAssignmentDialogProps) {
  const { toast } = useToast();
  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [notes, setNotes] = useState("");

  const config = vendorConfigs[assignmentType];

  const { data: vendors = [], isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: [config.apiEndpoint],
    enabled: isOpen,
  });

  // Prioritize vendors from the same state as the customer
  const sortedVendors = useMemo(() => {
    if (!customerState) return vendors;
    
    return [...vendors].sort((a, b) => {
      const aMatch = a.state?.toLowerCase() === customerState.toLowerCase() ? 1 : 0;
      const bMatch = b.state?.toLowerCase() === customerState.toLowerCase() ? 1 : 0;
      return bMatch - aMatch;
    });
  }, [vendors, customerState]);

  const assignMutation = useMutation({
    mutationFn: async () => {
      // First, assign the vendor (if selected) - this must succeed before completing milestone
      if (selectedVendor) {
        await apiRequest("POST", "/api/admin/vendor-assignments", {
          customerId,
          vendorId: selectedVendor,
          journeyStage: config.journeyStage,
          jobRole: config.jobRole,
          notes: `Assigned for ${config.vendorLabel.toLowerCase()} - ${customerName}`,
        });
      }

      // Only complete milestone after vendor assignment succeeds
      await apiRequest("PATCH", `/api/milestones/${milestoneId}/complete`, {
        notes: notes || config.defaultNotes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "milestones"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "vendor-assignments"] });
      toast({
        title: "Milestone completed",
        description: selectedVendor 
          ? `${config.vendorLabel} assigned and milestone marked as complete.`
          : "Milestone marked as complete without vendor assignment.",
      });
      onSuccess?.();
      onClose();
      setSelectedVendor("");
      setNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete milestone",
        variant: "destructive",
      });
    },
  });

  const handleComplete = () => {
    assignMutation.mutate();
  };

  const selectedVendorData = vendors.find(v => v.id === selectedVendor);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {config.title}
          </DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{config.vendorLabel} (Optional)</Label>
            {vendorsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading vendors...
              </div>
            ) : sortedVendors.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
                {config.emptyStateMessage}
              </div>
            ) : (
              <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger data-testid={`select-${assignmentType}-vendor`}>
                  <SelectValue placeholder="Select a vendor (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {sortedVendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{vendor.vendorCode}</span>
                        <span>{vendor.name}</span>
                        {vendor.state?.toLowerCase() === customerState?.toLowerCase() && (
                          <Badge variant="secondary" className="text-xs">Same State</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedVendorData && (
            <div className="p-3 rounded-md bg-muted/50 space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{selectedVendorData.name}</span>
              </div>
              {selectedVendorData.state && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {selectedVendorData.district && `${selectedVendorData.district}, `}
                  {selectedVendorData.state}
                </div>
              )}
              {selectedVendorData.phone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {selectedVendorData.phone}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Add any notes for this milestone..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
              data-testid={`textarea-${assignmentType}-notes`}
            />
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={onClose} disabled={assignMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={assignMutation.isPending}
            data-testid={`button-complete-${assignmentType}-assignment`}
          >
            {assignMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>Complete Milestone</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
