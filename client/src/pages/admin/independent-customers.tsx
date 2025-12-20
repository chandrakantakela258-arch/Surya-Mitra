import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Search, Phone, MapPin, Zap, Calendar, MoreVertical, CheckCircle, Clock, FileCheck, Truck, PartyPopper, Eye, UserPlus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CustomerJourneyMini } from "@/components/customer-journey-tracker";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { CustomerJourneyTracker } from "@/components/customer-journey-tracker";
import type { Customer } from "@shared/schema";

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminIndependentCustomers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [panelFilter, setPanelFilter] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();

  const { data: allCustomers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  const customers = allCustomers?.filter(c => c.source === "website_direct");

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/admin/customers/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ddp/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bdp/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Status Updated",
        description: "Customer status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update customer status.",
        variant: "destructive",
      });
    },
  });

  const filteredCustomers = customers?.filter((customer) => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.district?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
    const matchesPanel = panelFilter === "all" || customer.panelType === panelFilter;
    return matchesSearch && matchesStatus && matchesPanel;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const totalCapacity = customers?.reduce((sum, c) => sum + (parseInt(c.proposedCapacity || "0") || 0), 0) || 0;
  const completedCount = customers?.filter(c => c.status === "completed").length || 0;
  const pendingCount = customers?.filter(c => c.status === "pending").length || 0;
  const eligibleForPartner = customers?.filter(c => 
    c.status === "completed" && 
    parseInt(c.proposedCapacity || "0") >= 3
  ).length || 0;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
    verified: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    approved: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
    installation_scheduled: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
    completed: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Independent Customers</h1>
        <p className="text-muted-foreground">Customers who registered directly without a referral code</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{customers?.length || 0}</p>
            <p className="text-sm text-muted-foreground">Total Independent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-blue-600">{eligibleForPartner}</p>
            <p className="text-sm text-muted-foreground">Partner Eligible</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Independent Customer List
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, district..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-independent"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="installation_scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={panelFilter} onValueChange={setPanelFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-panel-filter">
                <SelectValue placeholder="Panel Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Panels</SelectItem>
                <SelectItem value="dcr">DCR</SelectItem>
                <SelectItem value="non_dcr">Non-DCR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredCustomers && filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-4 border rounded-md hover-elevate cursor-pointer"
                  onClick={() => setSelectedCustomer(customer)}
                  data-testid={`card-customer-${customer.id}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{customer.name}</h3>
                        <Badge className={statusColors[customer.status] || ""}>
                          {customer.status.replace("_", " ").toUpperCase()}
                        </Badge>
                        {parseInt(customer.proposedCapacity || "0") >= 3 && customer.status === "completed" && (
                          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            Partner Eligible
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </span>
                        {customer.district && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {customer.district}, {customer.state}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {customer.proposedCapacity} kW {customer.panelType?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CustomerJourneyMini customerId={customer.id} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer); }}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: customer.id.toString(), status: "verified" }); }}
                            disabled={customer.status !== "pending"}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Verified
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: customer.id.toString(), status: "approved" }); }}
                            disabled={customer.status !== "verified"}
                          >
                            <FileCheck className="w-4 h-4 mr-2" />
                            Mark Approved
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: customer.id.toString(), status: "installation_scheduled" }); }}
                            disabled={customer.status !== "approved"}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Schedule Installation
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: customer.id.toString(), status: "completed" }); }}
                            disabled={customer.status !== "installation_scheduled"}
                          >
                            <PartyPopper className="w-4 h-4 mr-2" />
                            Mark Completed
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No independent customers found</p>
                <p className="text-sm">Independent customers register directly without using a referral code</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedCustomer && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedCustomer.name}</SheetTitle>
                <SheetDescription>
                  Independent customer details and journey
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                    {selectedCustomer.email && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{selectedCustomer.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedCustomer.address}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedCustomer.district}, {selectedCustomer.state}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Installation Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Panel Type</p>
                      <p className="font-medium">{selectedCustomer.panelType?.toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Capacity</p>
                      <p className="font-medium">{selectedCustomer.proposedCapacity} kW</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Roof Type</p>
                      <p className="font-medium">{selectedCustomer.roofType || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Bill</p>
                      <p className="font-medium">{selectedCustomer.avgMonthlyBill ? formatINR(selectedCustomer.avgMonthlyBill) : "Not specified"}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Partner Eligibility</h4>
                  {parseInt(selectedCustomer.proposedCapacity || "0") >= 3 && selectedCustomer.status === "completed" ? (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        This customer is eligible to become a Customer Partner. They can earn Rs 10,000 for each successful referral (3kW+ installation).
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">
                        {selectedCustomer.status !== "completed" 
                          ? "Customer must complete installation first."
                          : "Customer needs 3kW+ installation to be eligible."}
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Installation Journey</h4>
                  <CustomerJourneyTracker 
                    customerId={selectedCustomer.id}
                    customerName={selectedCustomer.name}
                    showActions={false}
                  />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
