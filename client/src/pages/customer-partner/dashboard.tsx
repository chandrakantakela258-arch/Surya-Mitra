import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Users, Wallet, CheckCircle, Clock, Share2, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

interface CustomerPartnerStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  eligibleReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  referralCode: string;
}

export default function CustomerPartnerDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<CustomerPartnerStats>({
    queryKey: ["/api/customer-partner/stats"],
  });

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
    if (navigator.share) {
      navigator.share({
        title: "Join Divyanshi Solar",
        text: `Use my referral code ${stats?.referralCode} to get solar installation benefits!`,
        url: referralLink,
      });
    } else {
      navigator.clipboard.writeText(referralLink);
      toast({
        title: "Link Copied!",
        description: "Referral link copied to clipboard",
      });
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
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">
          Welcome, {user?.name}
        </h1>
        <p className="text-muted-foreground">
          Earn Rs 10,000 for every referral that completes a 3kW+ solar installation
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
            <CardTitle className="text-sm font-medium">Eligible Referrals</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-eligible-referrals">
              {stats?.eligibleReferrals || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Completed 3kW+ installations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Pending Referrals</CardTitle>
            <Clock className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-pending-referrals">
              {stats?.pendingReferrals || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <Wallet className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-earnings">
              Rs {(stats?.totalEarnings || 0).toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                Rs {(stats?.pendingEarnings || 0).toLocaleString("en-IN")} pending
              </Badge>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>
            Earn rewards by referring friends and family to solar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Share2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">1. Share Your Code</h3>
              <p className="text-sm text-muted-foreground">
                Share your unique referral code with anyone interested in going solar
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">2. They Register</h3>
              <p className="text-sm text-muted-foreground">
                When they use your code during registration, they get linked to you
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">3. Earn Rs 10,000</h3>
              <p className="text-sm text-muted-foreground">
                Get Rs 10,000 when they complete a 3kW or larger installation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
