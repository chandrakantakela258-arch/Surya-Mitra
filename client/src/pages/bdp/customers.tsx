import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Download, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { TableSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import { customerStatuses } from "@shared/schema";
import type { CustomerWithPartnerInfo } from "@shared/schema";
import { ExpandableSiteProgress } from "@/components/customer-journey-tracker";

export default function BDPCustomers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [districtFilter, setDistrictFilter] = useState<string>("all");

  const { data: customers, isLoading } = useQuery<CustomerWithPartnerInfo[]>({
    queryKey: ["/api/bdp/customers"],
  });

  // Get unique districts from customers
  const districts = Array.from(new Set(customers?.map((c) => c.district) || []));

  const filteredCustomers = customers?.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.district.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
    const matchesDistrict = districtFilter === "all" || customer.district === districtFilter;
    return matchesSearch && matchesStatus && matchesDistrict;
  });

  function exportToCSV() {
    if (!filteredCustomers?.length) return;

    const headers = ["Name", "Phone", "Email", "District", "State", "Pincode", "Proposed Capacity", "Status"];
    const rows = filteredCustomers.map((c) => [
      c.name,
      c.phone,
      c.email || "",
      c.district,
      c.state,
      c.pincode,
      c.proposedCapacity || "",
      c.status,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "all_customers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-page-title">All Customers</h1>
        <p className="text-muted-foreground">View all customer applications from your partner network</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
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
              <SelectTrigger className="w-full sm:w-40" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
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
            <Select value={districtFilter} onValueChange={setDistrictFilter}>
              <SelectTrigger className="w-full sm:w-40" data-testid="select-district-filter">
                <SelectValue placeholder="District" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {districts.map((district) => (
                  <SelectItem key={district} value={district}>
                    {district}
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
          <CardTitle className="text-xl">Customer Applications</CardTitle>
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
              description={searchQuery || statusFilter !== "all" || districtFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Your district partners haven't registered any customers yet"}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>DDP Partner</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Site Progress</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                      <TableCell>
                        <p className="font-medium">{customer.name}</p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{customer.ddpName || "-"}</p>
                          <p className="text-sm text-muted-foreground font-mono">{customer.ddpPhone || "-"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-mono text-sm">{customer.phone}</p>
                          <p className="text-sm text-muted-foreground">{customer.email || "-"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{customer.district}</p>
                          <p className="text-sm text-muted-foreground">{customer.state}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {customer.proposedCapacity || "-"} kW
                      </TableCell>
                      <TableCell className="min-w-[180px]">
                        <ExpandableSiteProgress 
                          customerId={customer.id} 
                          customerName={customer.name}
                          showActions={false}
                        />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={customer.status} />
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
