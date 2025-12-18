import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { installationMilestones, type Milestone } from "@shared/schema";

interface CustomerJourneyTrackerProps {
  customerId: string;
  customerName: string;
  showActions?: boolean;
}

export function CustomerJourneyTracker({ 
  customerId, 
  customerName,
  showActions = true 
}: CustomerJourneyTrackerProps) {
  const { toast } = useToast();

  const { data: milestones = [], isLoading } = useQuery<Milestone[]>({
    queryKey: ["/api/customers", customerId, "milestones"],
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
                        onClick={() => completeMilestoneMutation.mutate(milestoneData.id)}
                        disabled={completeMilestoneMutation.isPending}
                        data-testid={`button-complete-${milestone.key}`}
                      >
                        Complete
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
