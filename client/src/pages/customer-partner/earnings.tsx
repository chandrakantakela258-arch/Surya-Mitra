import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, CheckCircle, Clock, AlertCircle, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface Commission {
  id: string;
  partnerId: string;
  partnerType: string;
  customerId: string | null;
  capacityKw: number;
  commissionAmount: number;
  panelType: string;
  status: string;
  commissionType: string;
  createdAt: string;
  approvedAt: string | null;
  paidAt: string | null;
}

export default function CustomerPartnerEarnings() {
  const { data: commissions, isLoading } = useQuery<Commission[]>({
    queryKey: ["/api/customer-partner/commissions"],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Paid</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>;
      case "approved":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const totalEarnings = commissions?.reduce((sum, c) => sum + (c.status === "paid" ? c.commissionAmount : 0), 0) || 0;
  const pendingEarnings = commissions?.reduce((sum, c) => sum + (c.status === "pending" || c.status === "approved" ? c.commissionAmount : 0), 0) || 0;
  const paidCount = commissions?.filter(c => c.status === "paid").length || 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-earnings-title">My Earnings</h1>
        <p className="text-muted-foreground">
          Track your referral commissions and payouts
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <Wallet className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-total-received">
              Rs {totalEarnings.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground">
              {paidCount} payments completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
            <Clock className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-pending-payout">
              Rs {pendingEarnings.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval/payout
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-commissions">
              {commissions?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All time referral rewards
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission History</CardTitle>
          <CardDescription>
            All your referral rewards and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commissions && commissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Paid On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission) => (
                  <TableRow key={commission.id} data-testid={`row-commission-${commission.id}`}>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {commission.commissionType?.replace("_", " ") || "Referral"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-green-600">
                        Rs {commission.commissionAmount.toLocaleString("en-IN")}
                      </span>
                    </TableCell>
                    <TableCell>
                      {commission.capacityKw > 0 ? `${commission.capacityKw} kW` : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(commission.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(commission.createdAt), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {commission.paidAt ? format(new Date(commission.paidAt), "dd MMM yyyy") : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Earnings Yet</h3>
              <p className="text-muted-foreground">
                Your referral rewards will appear here once your referrals complete their installations
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <span>You earn Rs 10,000 for each referral that completes a 3kW or larger solar installation</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <span>Commissions are automatically generated when installation is complete</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <span>Approved commissions are paid via bank transfer to your registered account</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <span>Payment processing typically takes 7-10 business days after approval</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
