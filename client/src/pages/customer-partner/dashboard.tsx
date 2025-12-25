import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Copy, Users, Wallet, CheckCircle, Clock, Share2, Gift, TrendingUp, Zap, MapPin, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { format } from "date-fns";

interface CustomerPartnerStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  eligibleReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  referralCode: string;
}

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

interface Commission {
  id: string;
  commissionAmount: number;
  status: string;
  createdAt: string;
}

export default function CustomerPartnerDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<CustomerPartnerStats>({
    queryKey: ["/api/customer-partner/stats"],
  });

  const { data: referrals, isLoading: referralsLoading } = useQuery<Referral[]>({
    queryKey: ["/api/customer-partner/referrals"],
  });

  const { data: commissions, isLoading: commissionsLoading } = useQuery<Commission[]>({
    queryKey: ["/api/customer-partner/commissions"],
  });

  const isLoading = statsLoading || referralsLoading || commissionsLoading;

  const copyReferralCode = () => {
    if (stats?.referralCode) {
      navigator.clipboard.writeText(stats.referralCode);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    }
  };

  const shareReferralLink = () => {
    const referralLink = `${window.location.origin}/customer-registration?ref=${stats?.referralCode}`;
    const websiteUrl = "https://divyanshisolar.com/";
    const hashtags = "#DivyanshiSolar #PMSuryaGhar #SolarEnergy #RooftopSolar #GreenEnergy #MakeInIndia";
    if (navigator.share) {
      navigator.share({
        title: "Join Divyanshi Solar",
        text: `Use my referral code ${stats?.referralCode} to get solar installation benefits!\n\nRegister: ${referralLink}\nWebsite: ${websiteUrl}\n\n${hashtags}`,
        url: referralLink,
      });
    } else {
      const shareText = `Use my referral code ${stats?.referralCode} to get solar installation benefits!\n\nRegister: ${referralLink}\nWebsite: ${websiteUrl}\n\n${hashtags}`;
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Link Copied!",
        description: "Referral link copied to clipboard",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>;
      case "approved":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Approved</Badge>;
      case "installation_scheduled":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">Scheduled</Badge>;
      case "paid":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Paid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const recentReferrals = referrals?.slice(0, 5) || [];
  const recentCommissions = commissions?.slice(0, 5) || [];
  const completionRate = stats?.totalReferrals ? Math.round((stats.completedReferrals / stats.totalReferrals) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">
          Welcome, {user?.name}
        </h1>
        <p className="text-muted-foreground">
          Your Customer Partner Dashboard - Earn Rs 10,000 for every 3kW+ referral
        </p>
      </div>

      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Your Referral Code
          </CardTitle>
          <CardDescription>
            Share this code with friends and family interested in solar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-background rounded-lg px-4 py-2 border">
              <span className="text-2xl font-mono font-bold text-primary" data-testid="text-referral-code">
                {stats?.referralCode || "Loading..."}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={copyReferralCode}
                data-testid="button-copy-code"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button onClick={shareReferralLink} data-testid="button-share-code">
              <Share2 className="w-4 h-4 mr-2" />
              Share Link
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-referrals">
              {stats?.totalReferrals || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              People you have referred
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-completed-referrals">
              {stats?.completedReferrals || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Installations completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <Wallet className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-total-earned">
              Rs {(stats?.paidEarnings || 0).toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground">
              Received in your account
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
              Rs {(stats?.pendingEarnings || 0).toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting processing
            </p>
          </CardContent>
        </Card>
      </div>

      {stats && stats.totalReferrals > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Referral Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Progress value={completionRate} className="flex-1" />
              <span className="text-sm font-medium">{completionRate}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.completedReferrals} of {stats.totalReferrals} referrals have completed installation
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle>Recent Referrals</CardTitle>
              <CardDescription>Your latest customer referrals</CardDescription>
            </div>
            <Link href="/customer-partner/referrals">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentReferrals.length > 0 ? (
              <div className="space-y-3">
                {recentReferrals.map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="space-y-1">
                      <p className="font-medium">{referral.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {referral.district}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {referral.capacity} kW
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(referral.status)}
                      {referral.isEligibleForReward && (
                        <span className="text-xs text-green-600 font-medium">Rs 10,000</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No referrals yet</p>
                <p className="text-sm">Share your code to start earning</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle>Commission History</CardTitle>
              <CardDescription>Your recent earnings</CardDescription>
            </div>
            <Link href="/customer-partner/earnings">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentCommissions.length > 0 ? (
              <div className="space-y-3">
                {recentCommissions.map((commission) => (
                  <div key={commission.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="space-y-1">
                      <p className="font-medium">Referral Commission</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(commission.createdAt), "dd MMM yyyy")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-bold text-green-600">
                        Rs {commission.commissionAmount.toLocaleString("en-IN")}
                      </span>
                      {getStatusBadge(commission.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No commissions yet</p>
                <p className="text-sm">Complete referrals to earn</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-2">
                <Share2 className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-medium">1. Share Your Code</h4>
              <p className="text-sm text-muted-foreground">Share your unique referral code with interested people</p>
            </div>
            <div className="text-center p-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-2">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-medium">2. They Install Solar</h4>
              <p className="text-sm text-muted-foreground">When they complete a 3kW+ installation</p>
            </div>
            <div className="text-center p-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-2">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-medium">3. Earn Rs 10,000</h4>
              <p className="text-sm text-muted-foreground">Get rewarded for each successful referral</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
