import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Plus, Search, Download, MoreVertical, Users, Eye, User, Camera, Sparkles, TrendingUp, AlertCircle, ThermometerSun } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/status-badge";
import { TableSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { customerStatuses } from "@shared/schema";
import type { Customer } from "@shared/schema";
import { ExpandableSiteProgress } from "@/components/customer-journey-tracker";

export default function DDPCustomers() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [scoringCustomerId, setScoringCustomerId] = useState<string | null>(null);

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/ddp/customers"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/customers/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ddp/customers"] });
      toast({ title: "Customer status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const calculateLeadScoreMutation = useMutation({
    mutationFn: async (id: string) => {
      setScoringCustomerId(id);
      return apiRequest("POST", `/api/customers/${id}/lead-score`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ddp/customers"] });
      toast({ title: "Lead score calculated using AI" });
      setScoringCustomerId(null);
    },
    onError: (error: any) => {
      console.error("Lead score error:", error);
      toast({ 
        title: "Failed to calculate lead score", 
        description: error?.message || "Please try again",
        variant: "destructive" 
      });
      setScoringCustomerId(null);
    },
  });

  function getLeadScoreBadge(score: number | null | undefined, customerId?: string) {
    if (customerId && scoringCustomerId === customerId) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground animate-pulse">
          <Sparkles className="w-3 h-3" />
          Scoring...
        </span>
      );
    }
    
    if (score === null || score === undefined) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <AlertCircle className="w-3 h-3" />
          Not scored
        </span>
      );
    }
    
    const tier = score >= 70 ? "hot" : score >= 40 ? "warm" : "cold";
    const colors = {
      hot: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
      warm: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
      cold: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    };
    const icons = {
      hot: <ThermometerSun className="w-3 h-3" />,
      warm: <TrendingUp className="w-3 h-3" />,
      cold: <AlertCircle className="w-3 h-3" />,
    };
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colors[tier]}`}>
        {icons[tier]}
        {score}
      </span>
    );
  }

  const filteredCustomers = customers?.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.district.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function exportToCSV() {
    if (!filteredCustomers?.length) return;

    const headers = ["Name", "Phone", "Email", "Address", "District", "State", "Pincode", "Consumer Number", "Proposed Capacity", "Status"];
    const rows = filteredCustomers.map((c) => [
      c.name,
      c.phone,
      c.email || "",
      c.address,
      c.district,
      c.state,
      c.pincode,
      c.consumerNumber || "",
      c.proposedCapacity || "",
      c.status,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my_customers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">My Customers</h1>
          <p className="text-muted-foreground">Manage customer applications for solar installations</p>
        </div>
        <Button asChild data-testid="button-add-customer">
          <Link href="/ddp/customers/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or district..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-customers"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {customerStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportToCSV} data-testid="button-export">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Customer List</CardTitle>
          <CardDescription>
            {filteredCustomers?.length || 0} customers found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} />
          ) : !filteredCustomers?.length ? (
            <EmptyState
              icon={Users}
              title="No customers found"
              description={searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Start by registering your first customer for solar installation"}
              actionLabel={!searchQuery && statusFilter === "all" ? "Add Customer" : undefined}
              onAction={!searchQuery && statusFilter === "all" ? () => window.location.href = "/ddp/customers/new" : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Site Progress</TableHead>
                    <TableHead>Lead Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow 
                      key={customer.id} 
                      data-testid={`row-customer-${customer.id}`}
                      className="cursor-pointer hover-elevate"
                      onClick={() => setLocation(`/ddp/customers/${customer.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <p className="font-medium">{customer.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-mono text-sm">{customer.phone}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-[150px]">{customer.email || "-"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{customer.district}</p>
                          <p className="text-sm text-muted-foreground">{customer.pincode}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {customer.proposedCapacity || "-"} kW
                      </TableCell>
                      <TableCell className="min-w-[180px]" onClick={(e) => e.stopPropagation()}>
                        <ExpandableSiteProgress 
                          customerId={customer.id} 
                          customerName={customer.name}
                          showActions={false}
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {getLeadScoreBadge(customer.leadScore, customer.id)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={customer.status} />
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-actions-${customer.id}`}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/ddp/customers/${customer.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details & Media
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => calculateLeadScoreMutation.mutate(customer.id)}
                              disabled={scoringCustomerId === customer.id}
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                              {scoringCustomerId === customer.id ? "Calculating..." : "Calculate AI Score"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => updateStatusMutation.mutate({ id: customer.id, status: "verified" })}
                              disabled={customer.status !== "pending"}
                            >
                              Mark as Verified
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateStatusMutation.mutate({ id: customer.id, status: "approved" })}
                              disabled={customer.status !== "verified"}
                            >
                              Mark as Approved
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateStatusMutation.mutate({ id: customer.id, status: "installation_scheduled" })}
                              disabled={customer.status !== "approved"}
                            >
                              Schedule Installation
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateStatusMutation.mutate({ id: customer.id, status: "completed" })}
                              disabled={customer.status !== "installation_scheduled"}
                            >
                              Mark as Completed
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
