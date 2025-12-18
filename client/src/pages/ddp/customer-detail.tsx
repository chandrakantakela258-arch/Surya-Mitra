import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation, Link } from "wouter";
import { ArrowLeft, User, MapPin, Zap, Home, Phone, Mail, FileText, CheckCircle, Circle, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { StatusBadge } from "@/components/status-badge";
import { calculateSubsidy, formatINR } from "@/components/subsidy-calculator";
import { installationMilestones, type Customer, type Milestone } from "@shared/schema";
import { useState } from "react";

function MilestoneTimeline({ customerId }: { customerId: string }) {
  const { toast } = useToast();
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [notes, setNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { data: milestones, isLoading } = useQuery<Milestone[]>({
    queryKey: ["/api/customers", customerId, "milestones"],
  });
  
  const completeMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      return apiRequest("PATCH", `/api/milestones/${id}/complete`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "milestones"] });
      toast({ title: "Milestone completed successfully" });
      setDialogOpen(false);
      setSelectedMilestone(null);
      setNotes("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to complete milestone", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  function getMilestoneInfo(key: string) {
    return installationMilestones.find(m => m.key === key) || { label: key, description: "" };
  }
  
  function handleComplete(milestone: Milestone) {
    setSelectedMilestone(milestone);
    setNotes("");
    setDialogOpen(true);
  }
  
  function confirmComplete() {
    if (selectedMilestone) {
      completeMutation.mutate({ id: selectedMilestone.id, notes });
    }
  }
  
  const completedCount = milestones?.filter(m => m.status === "completed").length || 0;
  const totalCount = milestones?.length || installationMilestones.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-semibold">Installation Progress</h3>
          <p className="text-sm text-muted-foreground">
            {completedCount} of {totalCount} milestones completed
          </p>
        </div>
        <Badge variant="outline" className="text-lg font-mono">
          {progressPercent}%
        </Badge>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      
      <div className="relative space-y-0">
        {milestones?.map((milestone, index) => {
          const info = getMilestoneInfo(milestone.milestone);
          const isCompleted = milestone.status === "completed";
          const isLast = index === milestones.length - 1;
          const prevCompleted = index === 0 || milestones[index - 1].status === "completed";
          const canComplete = !isCompleted && prevCompleted;
          
          return (
            <div key={milestone.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                  ${isCompleted 
                    ? "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400" 
                    : canComplete 
                      ? "bg-primary/10 text-primary border-2 border-primary"
                      : "bg-muted text-muted-foreground"
                  }
                `}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : canComplete ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </div>
                {!isLast && (
                  <div className={`w-0.5 h-12 ${isCompleted ? "bg-green-300 dark:bg-green-700" : "bg-muted"}`} />
                )}
              </div>
              
              <div className={`flex-1 pb-6 ${isLast ? "pb-0" : ""}`}>
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className={`font-medium ${isCompleted ? "text-green-600 dark:text-green-400" : ""}`}>
                      {info.label}
                    </p>
                    <p className="text-sm text-muted-foreground">{info.description}</p>
                    {milestone.completedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Completed: {new Date(milestone.completedAt).toLocaleDateString()}
                      </p>
                    )}
                    {milestone.notes && (
                      <p className="text-sm text-muted-foreground mt-1 italic">
                        Note: {milestone.notes}
                      </p>
                    )}
                  </div>
                  
                  {canComplete && (
                    <Button 
                      size="sm" 
                      onClick={() => handleComplete(milestone)}
                      data-testid={`button-complete-${milestone.milestone}`}
                    >
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Milestone</DialogTitle>
            <DialogDescription>
              Mark "{selectedMilestone && getMilestoneInfo(selectedMilestone.milestone).label}" as completed
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea 
                id="notes"
                placeholder="Add any notes about this milestone..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="input-milestone-notes"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmComplete} 
              disabled={completeMutation.isPending}
              data-testid="button-confirm-complete"
            >
              {completeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                "Complete Milestone"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CustomerDetail() {
  const [, params] = useRoute("/ddp/customers/:id");
  const [, setLocation] = useLocation();
  const customerId = params?.id;
  
  const { data: customer, isLoading } = useQuery<Customer>({
    queryKey: ["/api/customers", customerId],
    enabled: !!customerId,
  });
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }
  
  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Customer not found</p>
        <Button variant="ghost" onClick={() => setLocation("/ddp/customers")}>
          Back to customers
        </Button>
      </div>
    );
  }
  
  const capacityNum = parseFloat(customer.proposedCapacity || "0") || 0;
  const subsidyInfo = capacityNum > 0 ? calculateSubsidy(Math.min(capacityNum, 10)) : null;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/ddp/customers")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold" data-testid="text-customer-name">{customer.name}</h1>
            <StatusBadge status={customer.status} />
          </div>
          <p className="text-muted-foreground">{customer.district}, {customer.state}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono">{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{customer.email}</span>
                </div>
              )}
              <Separator />
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p>{customer.address}</p>
                  <p className="text-muted-foreground">
                    {customer.district}, {customer.state} - {customer.pincode}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Electricity Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">DISCOM</dt>
                  <dd className="font-medium">{customer.electricityBoard || "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Consumer No.</dt>
                  <dd className="font-medium font-mono">{customer.consumerNumber || "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Sanctioned Load</dt>
                  <dd className="font-medium">{customer.sanctionedLoad || "-"} kW</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Avg. Monthly Bill</dt>
                  <dd className="font-medium">{customer.avgMonthlyBill ? formatINR(customer.avgMonthlyBill) : "-"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5 text-primary" />
                Roof & Installation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Roof Type</dt>
                  <dd className="font-medium">{customer.roofType || "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Roof Area</dt>
                  <dd className="font-medium">{customer.roofArea || "-"} sq ft</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Proposed Capacity</dt>
                  <dd className="text-2xl font-bold text-primary">{customer.proposedCapacity || "-"} kW</dd>
                </div>
              </dl>
              
              {subsidyInfo && (
                <>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">System Cost</p>
                      <p className="font-semibold font-mono">{formatINR(subsidyInfo.totalCost)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400">Subsidy</p>
                      <p className="font-semibold font-mono text-green-600 dark:text-green-400">
                        -{formatINR(subsidyInfo.totalSubsidy)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Net Cost</p>
                      <p className="font-semibold font-mono text-primary">{formatINR(subsidyInfo.netCost)}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Customer Journey
            </CardTitle>
            <CardDescription>
              Track installation progress and milestones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MilestoneTimeline customerId={customer.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
