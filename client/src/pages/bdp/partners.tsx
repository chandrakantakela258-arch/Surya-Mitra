import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Search, Download, MoreVertical, Check, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StatusBadge, RoleBadge } from "@/components/status-badge";
import { TableSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export default function BDPPartners() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: partners, isLoading } = useQuery<User[]>({
    queryKey: ["/api/bdp/partners"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/partners/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bdp/partners"] });
      toast({ title: "Partner status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const filteredPartners = partners?.filter((partner) => {
    const matchesSearch =
      partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.phone.includes(searchQuery) ||
      partner.district?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || partner.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function exportToCSV() {
    if (!filteredPartners?.length) return;

    const headers = ["Name", "Username", "Email", "Phone", "District", "State", "Status"];
    const rows = filteredPartners.map((p) => [
      p.name,
      p.username,
      p.email,
      p.phone,
      p.district || "",
      p.state || "",
      p.status,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "district_partners.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">District Partners</h1>
          <p className="text-muted-foreground">Manage your district development partners</p>
        </div>
        <Button asChild data-testid="button-add-partner">
          <Link href="/bdp/partners/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Partner
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
                data-testid="input-search-partners"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportToCSV} data-testid="button-export">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Partners Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Partner List</CardTitle>
          <CardDescription>
            {filteredPartners?.length || 0} partners found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} />
          ) : !filteredPartners?.length ? (
            <EmptyState
              icon={Plus}
              title="No partners found"
              description={searchQuery || statusFilter !== "all" 
                ? "Try adjusting your search or filters" 
                : "Start by adding your first district development partner"}
              actionLabel={!searchQuery && statusFilter === "all" ? "Add Partner" : undefined}
              onAction={!searchQuery && statusFilter === "all" ? () => window.location.href = "/bdp/partners/new" : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPartners.map((partner) => (
                    <TableRow key={partner.id} data-testid={`row-partner-${partner.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{partner.name}</p>
                          <p className="text-sm text-muted-foreground">{partner.username}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-mono text-sm">{partner.phone}</p>
                          <p className="text-sm text-muted-foreground">{partner.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{partner.district || "-"}</p>
                          <p className="text-sm text-muted-foreground">{partner.state || "-"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={partner.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-actions-${partner.id}`}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {partner.status === "pending" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => updateStatusMutation.mutate({ id: partner.id, status: "approved" })}
                                  data-testid={`button-approve-${partner.id}`}
                                >
                                  <Check className="w-4 h-4 mr-2 text-primary" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => updateStatusMutation.mutate({ id: partner.id, status: "rejected" })}
                                  className="text-destructive"
                                  data-testid={`button-reject-${partner.id}`}
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem asChild>
                              <Link href={`/bdp/partners/${partner.id}`}>
                                View Details
                              </Link>
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
