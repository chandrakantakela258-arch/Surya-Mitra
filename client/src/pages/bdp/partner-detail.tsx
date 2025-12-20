import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Phone, Mail, MapPin, Building2, Calendar, Users, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";
import type { User, Customer } from "@shared/schema";

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "approved":
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">Approved</Badge>;
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function CustomerStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">Completed</Badge>;
    case "in_progress":
      return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">In Progress</Badge>;
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function PartnerDetail() {
  const [, params] = useRoute("/bdp/partners/:id");
  const partnerId = params?.id;

  const { data: partner, isLoading: partnerLoading } = useQuery<User>({
    queryKey: ["/api/bdp/partners", partnerId],
    enabled: !!partnerId,
  });

  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/bdp/partners", partnerId, "customers"],
    enabled: !!partnerId,
  });

  if (partnerLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/bdp/partners">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/bdp/partners">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Partner Not Found</h1>
        </div>
        <EmptyState
          icon={Building2}
          title="Partner not found"
          description="The partner you're looking for doesn't exist or has been removed."
          actionLabel="Back to Partners"
          onAction={() => window.location.href = "/bdp/partners"}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" asChild data-testid="button-back">
          <Link href="/bdp/partners">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{partner.name}</h1>
          <p className="text-muted-foreground">District Development Partner</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={partner.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Partner Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-mono">{partner.phone}</p>
              </div>
            </div>
            {partner.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p>{partner.email}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p>{partner.district || "-"}, {partner.state || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Joined</p>
                <p>{partner.createdAt ? new Date(partner.createdAt).toLocaleDateString() : "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Customer Applications
              </CardTitle>
              <CardDescription>
                Customers registered by this partner
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono">
              {customers?.length || 0} customers
            </Badge>
          </CardHeader>
          <CardContent>
            {customersLoading ? (
              <TableSkeleton rows={5} />
            ) : !customers?.length ? (
              <EmptyState
                icon={Users}
                title="No customers yet"
                description="This partner hasn't registered any customers yet."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Panel Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.district}</TableCell>
                      <TableCell className="font-mono">{customer.proposedCapacity || "-"} kW</TableCell>
                      <TableCell>
                        <Badge variant={customer.panelType === "dcr" ? "default" : "secondary"}>
                          {customer.panelType === "dcr" ? "DCR" : "Non-DCR"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <CustomerStatusBadge status={customer.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
