import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, CheckCircle, Clock, MapPin, Sun, Zap } from "lucide-react";
import { format } from "date-fns";

interface Referral {
  id: string;
  name: string;
  phone: string;
  district: string;
  state: string;
  capacity: string;
  status: string;
  panelType: string;
  createdAt: string;
  isEligibleForReward: boolean;
}

export default function CustomerPartnerReferrals() {
  const { data: referrals, isLoading } = useQuery<Referral[]>({
    queryKey: ["/api/customer-partner/referrals"],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>;
      case "approved":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Approved</Badge>;
      case "scheduled":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">Scheduled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const eligibleCount = referrals?.filter(r => r.isEligibleForReward).length || 0;
  const pendingCount = referrals?.filter(r => !r.isEligibleForReward).length || 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-referrals-title">My Referrals</h1>
        <p className="text-muted-foreground">
          Track the status of people you have referred
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-stat-total">
              {referrals?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Eligible for Reward</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-stat-eligible">
              {eligibleCount}
            </div>
            <p className="text-xs text-muted-foreground">
              = Rs {(eligibleCount * 10000).toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-stat-pending">
              {pendingCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
          <CardDescription>
            All customers who registered using your referral code
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referrals && referrals.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Panel Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((referral) => (
                  <TableRow key={referral.id} data-testid={`row-referral-${referral.id}`}>
                    <TableCell>
                      <div className="font-medium">{referral.name}</div>
                      <div className="text-sm text-muted-foreground">{referral.phone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">{referral.district}, {referral.state}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-yellow-500" />
                        <span>{referral.capacity} kW</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Sun className="w-3 h-3 text-orange-500" />
                        <span className="uppercase text-sm">{referral.panelType}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(referral.status)}</TableCell>
                    <TableCell>
                      {referral.isEligibleForReward ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                          Rs 10,000
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {parseInt(referral.capacity) >= 3 ? "Pending" : "Min 3kW needed"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(referral.createdAt), "dd MMM yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Referrals Yet</h3>
              <p className="text-muted-foreground">
                Share your referral code to start earning rewards
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
