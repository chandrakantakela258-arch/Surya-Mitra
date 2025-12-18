import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { FileText, Clock, CheckCircle, Calendar, Wrench } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/status-badge";
import { DashboardSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import type { Customer } from "@shared/schema";

const statusSteps = [
  { status: "pending", label: "Pending", icon: Clock },
  { status: "verified", label: "Verified", icon: FileText },
  { status: "approved", label: "Approved", icon: CheckCircle },
  { status: "installation_scheduled", label: "Scheduled", icon: Calendar },
  { status: "completed", label: "Completed", icon: Wrench },
];

function getProgressPercentage(status: string): number {
  const index = statusSteps.findIndex((s) => s.status === status);
  if (index === -1) return 0;
  return ((index + 1) / statusSteps.length) * 100;
}

export default function DDPApplications() {
  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/ddp/customers"],
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Group customers by status
  const pendingCustomers = customers?.filter((c) => c.status === "pending") || [];
  const verifiedCustomers = customers?.filter((c) => c.status === "verified") || [];
  const approvedCustomers = customers?.filter((c) => c.status === "approved") || [];
  const scheduledCustomers = customers?.filter((c) => c.status === "installation_scheduled") || [];
  const completedCustomers = customers?.filter((c) => c.status === "completed") || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-page-title">Applications</h1>
        <p className="text-muted-foreground">Track the progress of customer applications</p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="text-center p-4" data-testid="stat-pending">
          <p className="text-2xl font-semibold font-mono">{pendingCustomers.length}</p>
          <p className="text-sm text-muted-foreground">Pending</p>
        </Card>
        <Card className="text-center p-4" data-testid="stat-verified">
          <p className="text-2xl font-semibold font-mono">{verifiedCustomers.length}</p>
          <p className="text-sm text-muted-foreground">Verified</p>
        </Card>
        <Card className="text-center p-4" data-testid="stat-approved">
          <p className="text-2xl font-semibold font-mono">{approvedCustomers.length}</p>
          <p className="text-sm text-muted-foreground">Approved</p>
        </Card>
        <Card className="text-center p-4" data-testid="stat-scheduled">
          <p className="text-2xl font-semibold font-mono">{scheduledCustomers.length}</p>
          <p className="text-sm text-muted-foreground">Scheduled</p>
        </Card>
        <Card className="text-center p-4" data-testid="stat-completed">
          <p className="text-2xl font-semibold font-mono text-primary">{completedCustomers.length}</p>
          <p className="text-sm text-muted-foreground">Completed</p>
        </Card>
      </div>

      {/* Applications List */}
      {!customers?.length ? (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              icon={FileText}
              title="No applications yet"
              description="Start by registering customers for solar panel installations."
              actionLabel="Add Customer"
              onAction={() => window.location.href = "/ddp/customers/new"}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {customers.map((customer) => {
            const progressPercentage = getProgressPercentage(customer.status);
            const currentStepIndex = statusSteps.findIndex((s) => s.status === customer.status);

            return (
              <Card key={customer.id} data-testid={`card-application-${customer.id}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-medium text-lg">{customer.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {customer.district}, {customer.state} • {customer.proposedCapacity || "-"} kW
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={customer.status} />
                      <Button variant="outline" size="sm" asChild data-testid={`button-view-${customer.id}`}>
                        <Link href={`/ddp/customers/${customer.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Progress value={progressPercentage} className="h-2" />
                    <div className="flex justify-between">
                      {statusSteps.map((step, index) => {
                        const StepIcon = step.icon;
                        const isCompleted = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex;

                        return (
                          <div
                            key={step.status}
                            className={`flex flex-col items-center gap-1 ${
                              isCompleted ? "text-primary" : "text-muted-foreground"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isCurrent
                                  ? "bg-primary text-primary-foreground"
                                  : isCompleted
                                  ? "bg-primary/20"
                                  : "bg-muted"
                              }`}
                            >
                              <StepIcon className="w-4 h-4" />
                            </div>
                            <span className="text-xs hidden sm:block">{step.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
