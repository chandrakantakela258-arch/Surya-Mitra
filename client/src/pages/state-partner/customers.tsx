import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Search, Users, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { TableSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import { customerStatuses } from "@shared/schema";
import type { Customer } from "@shared/schema";

export default function SDPCustomers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: customers, isLoading } = useQuery<Customer[]>({ queryKey: ["/api/sdp/customers"] });

  const filtered = customers?.filter((c: Customer) => {
    const matchSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery) || c.district.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold tracking-tight">Customers</h1><p className="text-muted-foreground">All customers in your state network</p></div>
        <Link href="/sdp/customers/new"><Button><Plus className="h-4 w-4 mr-2" />Add Customer</Button></Link>
      </div>
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All</SelectItem>{customerStatuses.map((s: any) => (<SelectItem key={s.value || s} value={s.value || s}>{s.label || s}</SelectItem>))}</SelectContent>
        </Select>
      </div>
      <Card><CardContent className="p-0">
        {isLoading ? <div className="p-6"><TableSkeleton /></div> : filtered.length === 0 ? (
          <div className="p-6"><EmptyState icon={Users} title="No customers found" description="Add your first customer" action={<Link href="/sdp/customers/new"><Button><Plus className="h-4 w-4 mr-2" />Add Customer</Button></Link>} /></div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>District</TableHead><TableHead>Capacity</TableHead><TableHead>Panel</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>{filtered.map((c: Customer) => (
              <TableRow key={c.id}><TableCell className="font-medium">{c.name}</TableCell><TableCell>{c.phone}</TableCell><TableCell>{c.district}</TableCell><TableCell>{c.proposedCapacity} kW</TableCell>
                <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${c.panelType === "dcr" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>{c.panelType === "dcr" ? "DCR" : "Non-DCR"}</span></TableCell>
                <TableCell><StatusBadge status={c.status || "pending"} /></TableCell>
                <TableCell><Link href={`/sdp/customers/${c.id}`}><Button variant="ghost" size="sm"><Eye className="h-4 w-4 mr-1" />View</Button></Link></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}
