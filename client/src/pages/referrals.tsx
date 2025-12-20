import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Copy,
  Share2,
  Gift,
  Users,
  CheckCircle,
  Clock,
  IndianRupee,
  QrCode,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Referral } from "@shared/schema";

export default function ReferralsPage() {
  const { toast } = useToast();
  const [showShareDialog, setShowShareDialog] = useState(false);

  const { data: referralCode, isLoading: codeLoading } = useQuery<{ code: string }>({
    queryKey: ["/api/referral-code"],
  });

  const { data: referrals, isLoading: referralsLoading } = useQuery<Referral[]>({
    queryKey: ["/api/referrals"],
  });

  const copyToClipboard = async () => {
    if (referralCode?.code) {
      await navigator.clipboard.writeText(referralCode.code);
      toast({ title: "Referral code copied!" });
    }
  };

  const shareReferral = async () => {
    const shareUrl = `${window.location.origin}/register?ref=${referralCode?.code}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Divyanshi Solar",
          text: `Use my referral code ${referralCode?.code} to join Divyanshi Solar and get rewards!`,
          url: shareUrl,
        });
      } catch (error) {
        setShowShareDialog(true);
      }
    } else {
      setShowShareDialog(true);
    }
  };

  const stats = {
    total: referrals?.length || 0,
    pending: referrals?.filter((r) => r.status === "pending").length || 0,
    converted: referrals?.filter((r) => r.status === "converted").length || 0,
    totalReward: referrals
      ?.filter((r) => r.status === "converted")
      .reduce((sum, r) => sum + (r.rewardAmount || 0), 0) || 0,
  };

  const statusConfig: Record<string, { color: string; icon: any }> = {
    pending: { color: "text-yellow-600", icon: Clock },
    converted: { color: "text-green-600", icon: CheckCircle },
    expired: { color: "text-red-600", icon: Clock },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Referral Program</h1>
        <p className="text-muted-foreground">
          Refer customers and partners to earn rewards
        </p>
      </div>

      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Your Referral Code
          </CardTitle>
          <CardDescription>
            Share this code with customers and partners to earn rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          {codeLoading ? (
            <Skeleton className="h-12 w-48" />
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Input
                  value={referralCode?.code || "Loading..."}
                  readOnly
                  className="w-48 text-center font-mono text-lg font-bold"
                  data-testid="input-referral-code"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  data-testid="button-copy-code"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <Button onClick={shareReferral} data-testid="button-share">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.converted}</p>
                <p className="text-sm text-muted-foreground">Converted</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-2xl font-bold text-primary">
                  Rs {stats.totalReward.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Earned</p>
              </div>
              <IndianRupee className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reward Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Customer Referral</h4>
              <p className="text-2xl font-bold text-primary">Rs 1,000</p>
              <p className="text-sm text-muted-foreground">
                Earn when referred customer completes installation
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Partner Referral</h4>
              <p className="text-2xl font-bold text-primary">Rs 2,000</p>
              <p className="text-sm text-muted-foreground">
                Earn when referred partner gets approved
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
        </CardHeader>
        <CardContent>
          {referralsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : referrals && referrals.length > 0 ? (
            <div className="space-y-3">
              {referrals.map((referral) => {
                const config = statusConfig[referral.status];
                const StatusIcon = config?.icon || Clock;
                
                return (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between gap-4 p-4 border rounded-lg"
                    data-testid={`referral-${referral.id}`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{referral.referredType}</Badge>
                        <Badge variant="outline" className={config?.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {referral.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(referral.createdAt!).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        Rs {(referral.rewardAmount || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {referral.rewardStatus === "paid" ? "Paid" : "Pending"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No referrals yet</p>
              <p className="text-sm text-muted-foreground">
                Start sharing your referral code to earn rewards
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Referral Code</DialogTitle>
            <DialogDescription>
              Copy and share this link with customers and partners
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={`${window.location.origin}/register?ref=${referralCode?.code}`}
              readOnly
              className="font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={async () => {
                  await navigator.clipboard.writeText(
                    `${window.location.origin}/register?ref=${referralCode?.code}`
                  );
                  toast({ title: "Link copied!" });
                  setShowShareDialog(false);
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
