import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Building2, Check, AlertCircle, MapPin, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Vendor } from "@shared/schema";

interface DiscomVendorSelectorProps {
  customerId: string;
  customerName: string;
  customerState?: string;
  milestoneId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DiscomVendorSelector({
  customerId,
  customerName,
  customerState,
  milestoneId,
  isOpen,
  onClose,
  onSuccess,
}: DiscomVendorSelectorProps) {
  const { toast } = useToast();
  const [selectedVendor, setSelectedVendor] = useState("");
  const [notes, setNotes] = useState("");

  const { data: discomVendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/admin/vendors/discom"],
    enabled: isOpen,
  });

  const filteredVendors = customerState
    ? discomVendors.filter(v => v.state === customerState || !customerState)
    : discomVendors;

  const prioritizedVendors = [...filteredVendors].sort((a, b) => {
    if (customerState) {
      if (a.state === customerState && b.state !== customerState) return -1;
      if (b.state === customerState && a.state !== customerState) return 1;
    }
    return 0;
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      // First, assign the vendor (if selected) - this must succeed before completing milestone
      if (selectedVendor) {
        await apiRequest("POST", "/api/admin/vendor-assignments", {
          customerId,
          vendorId: selectedVendor,
          journeyStage: "pre_installation",
          jobRole: "discom_net_metering",
          notes: `Assigned for DISCOM net metering liaison - ${customerName}`,
        });
      }

      // Only complete milestone after vendor assignment succeeds
      await apiRequest("PATCH", `/api/milestones/${milestoneId}/complete`, {
        notes: notes || "File submitted to PM Surya Ghar portal",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "milestones"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "vendor-assignments"] });
      toast({
        title: "File Submission Completed",
        description: selectedVendor 
          ? "Milestone completed and DISCOM vendor assigned successfully."
          : "Milestone completed. You can assign DISCOM vendor later.",
      });
      resetForm();
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete milestone",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedVendor("");
    setNotes("");
  };

  const handleSubmit = () => {
    assignMutation.mutate();
  };

  const selectedVendorData = prioritizedVendors.find(v => v.id === selectedVendor);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Complete File Submission
          </DialogTitle>
          <DialogDescription>
            Mark file submission as complete and optionally assign a DISCOM Net Metering Liaison vendor for {customerName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="vendor">DISCOM Vendor (Optional)</Label>
            <Select value={selectedVendor} onValueChange={setSelectedVendor}>
              <SelectTrigger data-testid="select-discom-vendor">
                <SelectValue placeholder="Select DISCOM vendor for net metering" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <div className="p-2 text-center text-muted-foreground">Loading vendors...</div>
                ) : prioritizedVendors.length === 0 ? (
                  <div className="p-2 text-center text-muted-foreground">
                    <AlertCircle className="h-4 w-4 mx-auto mb-1" />
                    No DISCOM vendors available
                  </div>
                ) : (
                  prioritizedVendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{vendor.vendorCode || "N/A"}</span>
                        <span className="text-muted-foreground">-</span>
                        <span>{vendor.name}</span>
                        {vendor.state === customerState && (
                          <Badge variant="outline" className="ml-1 text-xs bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                            Same State
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {prioritizedVendors.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {customerState 
                  ? `Vendors from ${customerState} are shown first`
                  : "Select a vendor to handle DISCOM net metering process"}
              </p>
            )}
          </div>

          {selectedVendorData && (
            <div className="rounded-lg border p-3 bg-muted/30 space-y-2">
              <h4 className="font-medium text-sm">Selected Vendor Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <User className="h-3 w-3" />
                  {selectedVendorData.name}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {selectedVendorData.phone}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground col-span-2">
                  <MapPin className="h-3 w-3" />
                  {selectedVendorData.district}, {selectedVendorData.state}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about file submission or vendor assignment..."
              className="resize-none"
              rows={3}
              data-testid="input-discom-notes"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-discom">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={assignMutation.isPending}
            data-testid="button-confirm-discom"
          >
            {assignMutation.isPending ? (
              "Processing..."
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" />
                Complete File Submission
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
