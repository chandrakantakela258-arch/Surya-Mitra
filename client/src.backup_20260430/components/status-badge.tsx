import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  verified: { label: "Verified", variant: "outline" },
  approved: { label: "Approved", variant: "default" },
  installation_scheduled: { label: "Installation Scheduled", variant: "outline" },
  completed: { label: "Completed", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: "secondary" as const };

  return (
    <Badge 
      variant={config.variant} 
      className={cn(
        "text-xs font-medium",
        status === "completed" && "bg-primary text-primary-foreground",
        status === "approved" && "bg-primary/80 text-primary-foreground",
        status === "installation_scheduled" && "bg-accent text-accent-foreground",
        status === "verified" && "border-primary text-primary",
        className
      )}
      data-testid={`badge-status-${status}`}
    >
      {config.label}
    </Badge>
  );
}

export function RoleBadge({ role, className }: { role: string; className?: string }) {
  const roleLabels: Record<string, string> = {
    admin: "Admin",
    bdp: "BDP",
    ddp: "DDP",
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-xs font-medium",
        role === "bdp" && "border-accent text-accent-foreground bg-accent/10",
        role === "ddp" && "border-primary text-primary bg-primary/10",
        role === "admin" && "border-destructive text-destructive bg-destructive/10",
        className
      )}
      data-testid={`badge-role-${role}`}
    >
      {roleLabels[role] || role}
    </Badge>
  );
}
