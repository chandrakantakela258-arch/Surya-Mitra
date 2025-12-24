import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, Clock, ChevronRight, ChevronDown, ChevronUp, Building2, Landmark, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { installationMilestones, type Milestone, type Vendor, type CustomerVendorAssignment } from "@shared/schema";
import { VendorAssignmentDialog, type VendorAssignmentType } from "./vendor-assignment-dialog";

interface EnrichedAssignment extends CustomerVendorAssignment {
  vendor?: Vendor;
}

interface CustomerJourneyTrackerProps {
  customerId: string;
  customerName: string;
  customerState?: string;
  showActions?: boolean;
}

export function CustomerJourneyTracker({ 
  customerId, 
  customerName,
  customerState,
  showActions = true 
}: CustomerJourneyTrackerProps) {
  const { toast } = useToast();
  const [pendingMilestoneId, setPendingMilestoneId] = useState<string | null>(null);
  const [vendorDialogType, setVendorDialogType] = useState<VendorAssignmentType | null>(null);

  const { data: milestones = [], isLoading } = useQuery<Milestone[]>({
    queryKey: ["/api/customers", customerId, "milestones"],
  });

  const { data: vendorAssignments = [] } = useQuery<EnrichedAssignment[]>({
    queryKey: ["/api/customers", customerId, "vendor-assignments"],
  });

  const discomAssignment = vendorAssignments.find(a => a.jobRole === "discom_net_metering");
  const bankLoanAssignment = vendorAssignments.find(a => a.jobRole === "bank_loan_facilitation");

  const completeMilestoneMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      await apiRequest("PATCH", `/api/milestones/${milestoneId}/complete`, {
        notes: `Completed by partner`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "milestones"] });
      toast({
        title: "Milestone completed",
        description: "The milestone has been marked as complete.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete milestone",
        variant: "destructive",
      });
    },
  });

  const handleMilestoneComplete = (milestoneKey: string, milestoneId: string) => {
    if (milestoneKey === "file_submission") {
      setPendingMilestoneId(milestoneId);
      setVendorDialogType("discom");
    } else if (milestoneKey === "bank_loan_file_submission") {
      setPendingMilestoneId(milestoneId);
      setVendorDialogType("bank_loan");
    } else {
      completeMilestoneMutation.mutate(milestoneId);
    }
  };

  const getButtonLabel = (milestoneKey: string) => {
    if (milestoneKey === "file_submission") return "Complete & Assign DISCOM";
    if (milestoneKey === "bank_loan_file_submission") return "Complete & Assign Bank";
    return "Complete";
  };

  const getMilestoneData = (milestoneKey: string) => {
    return milestones.find((m) => m.milestone === milestoneKey);
  };

  const completedCount = milestones.filter((m) => m.status === "completed").length;
  const progress = installationMilestones.length > 0 
    ? (completedCount / installationMilestones.length) * 100 
    : 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 h-4 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-lg">Installation Journey</CardTitle>
          <Badge variant={progress === 100 ? "default" : "secondary"}>
            {completedCount} / {installationMilestones.length} Complete
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Track progress for {customerName}
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />
          
          <div className="space-y-0">
            {installationMilestones.map((milestone, index) => {
              const milestoneData = getMilestoneData(milestone.key);
              const isCompleted = milestoneData?.status === "completed";
              const isPending = !isCompleted;
              const isNext = index === completedCount;

              return (
                <div key={milestone.key} className="relative pl-10 pb-6 last:pb-0">
                  <div
                    className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isNext
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted border-2 border-muted-foreground/20"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <span className="text-xs font-medium">{index + 1}</span>
                    )}
                  </div>
                  
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`font-medium ${isCompleted ? "text-green-700 dark:text-green-400" : ""}`}>
                          {milestone.label}
                        </h4>
                        {isCompleted && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                            Completed
                          </Badge>
                        )}
                        {isNext && !isCompleted && (
                          <Badge variant="outline" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {milestone.description}
                      </p>
                      {milestoneData?.completedAt && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(milestoneData.completedAt), { addSuffix: true })}
                        </p>
                      )}
                      {milestoneData?.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          Note: {milestoneData.notes}
                        </p>
                      )}
                    </div>
                    
                    {showActions && isNext && !isCompleted && milestoneData && (
                      <Button
                        size="sm"
                        onClick={() => handleMilestoneComplete(milestone.key, milestoneData.id)}
                        disabled={completeMilestoneMutation.isPending}
                        data-testid={`button-complete-${milestone.key}`}
                      >
                        {getButtonLabel(milestone.key)}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                    
                    {milestone.key === "file_submission" && isCompleted && discomAssignment?.vendor && (
                      <div className="mt-2 p-2 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="font-medium text-blue-700 dark:text-blue-300">DISCOM Vendor:</span>
                          <span className="text-blue-600 dark:text-blue-400">{discomAssignment.vendor.vendorCode}</span>
                          <span className="text-muted-foreground">-</span>
                          <span>{discomAssignment.vendor.name}</span>
                        </div>
                        {discomAssignment.vendor.phone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Phone className="h-3 w-3" />
                            {discomAssignment.vendor.phone}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {milestone.key === "bank_loan_file_submission" && isCompleted && bankLoanAssignment?.vendor && (
                      <div className="mt-2 p-2 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                        <div className="flex items-center gap-2 text-sm">
                          <Landmark className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="font-medium text-green-700 dark:text-green-300">Bank Loan Vendor:</span>
                          <span className="text-green-600 dark:text-green-400">{bankLoanAssignment.vendor.vendorCode}</span>
                          <span className="text-muted-foreground">-</span>
                          <span>{bankLoanAssignment.vendor.name}</span>
                        </div>
                        {bankLoanAssignment.vendor.phone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Phone className="h-3 w-3" />
                            {bankLoanAssignment.vendor.phone}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {pendingMilestoneId && vendorDialogType && (
          <VendorAssignmentDialog
            customerId={customerId}
            customerName={customerName}
            customerState={customerState}
            milestoneId={pendingMilestoneId}
            assignmentType={vendorDialogType}
            isOpen={true}
            onClose={() => {
              setVendorDialogType(null);
              setPendingMilestoneId(null);
            }}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "vendor-assignments"] });
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

export function CustomerJourneyMini({ customerId }: { customerId: string }) {
  const { data: milestones = [] } = useQuery<Milestone[]>({
    queryKey: ["/api/customers", customerId, "milestones"],
  });

  const completedCount = milestones.filter((m) => m.status === "completed").length;
  const progress = installationMilestones.length > 0 
    ? (completedCount / installationMilestones.length) * 100 
    : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-green-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {completedCount}/{installationMilestones.length}
      </span>
    </div>
  );
}

interface ExpandableSiteProgressProps {
  customerId: string;
  customerName: string;
  showActions?: boolean;
}

export function ExpandableSiteProgress({ 
  customerId, 
  customerName,
  showActions = false 
}: ExpandableSiteProgressProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const { data: miniMilestones = [] } = useQuery<Milestone[]>({
    queryKey: ["/api/customers", customerId, "milestones"],
  });

  const { data: milestones = [], isLoading } = useQuery<Milestone[]>({
    queryKey: ["/api/customers", customerId, "milestones"],
    enabled: isOpen,
  });

  const completeMilestoneMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      await apiRequest("PATCH", `/api/milestones/${milestoneId}/complete`, {
        notes: `Completed by partner`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "milestones"] });
      toast({
        title: "Milestone completed",
        description: "The milestone has been marked as complete.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete milestone",
        variant: "destructive",
      });
    },
  });

  const getMilestoneData = (milestoneKey: string) => {
    return milestones.find((m) => m.milestone === milestoneKey);
  };

  const completedCount = miniMilestones.filter((m) => m.status === "completed").length;
  const progress = installationMilestones.length > 0 
    ? (completedCount / installationMilestones.length) * 100 
    : 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[80px]">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {completedCount}/{installationMilestones.length}
          </span>
        </div>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            data-testid={`button-expand-progress-${customerId}`}
          >
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="pt-3 pb-1">
          {isLoading ? (
            <div className="animate-pulse space-y-2 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-muted" />
                  <div className="flex-1 h-3 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-muted ml-2 space-y-3">
              {installationMilestones.map((milestone, index) => {
                const milestoneData = getMilestoneData(milestone.key);
                const isCompleted = milestoneData?.status === "completed";
                const isNext = index === completedCount;

                return (
                  <div 
                    key={milestone.key} 
                    className="relative"
                    data-testid={`milestone-${milestone.key}-${customerId}`}
                  >
                    <div
                      className={`absolute -left-[25px] w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isNext
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted border border-muted-foreground/30"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-2.5 w-2.5" />
                      ) : (
                        <span className="font-medium">{index + 1}</span>
                      )}
                    </div>
                    
                    <div className="flex items-start justify-between gap-2 min-h-[20px]">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium leading-tight ${
                          isCompleted ? "text-green-600 dark:text-green-400" : ""
                        }`}>
                          {milestone.label}
                        </p>
                        {milestoneData?.completedAt && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {formatDistanceToNow(new Date(milestoneData.completedAt), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                      
                      {showActions && isNext && !isCompleted && milestoneData && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            completeMilestoneMutation.mutate(milestoneData.id);
                          }}
                          disabled={completeMilestoneMutation.isPending}
                          data-testid={`button-complete-milestone-${milestone.key}-${customerId}`}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
