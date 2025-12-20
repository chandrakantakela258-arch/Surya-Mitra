import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, User, Mail, Phone, MapPin, Sun, Zap, Calendar, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CustomerPartnerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  district: string;
  state: string;
  referralCode: string;
  createdAt: string;
  linkedCustomer: {
    capacity: string;
    panelType: string;
    installationDate: string | null;
  } | null;
}

export default function CustomerPartnerProfile() {
  const { toast } = useToast();

  const { data: profile, isLoading } = useQuery<CustomerPartnerProfile>({
    queryKey: ["/api/customer-partner/profile"],
  });

  const copyReferralCode = () => {
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    }
  };

  const shareReferralLink = () => {
    const referralLink = `${window.location.origin}/customer-registration?ref=${profile?.referralCode}`;
    if (navigator.share) {
      navigator.share({
        title: "Join Divyanshi Solar",
        text: `Use my referral code ${profile?.referralCode} to get solar installation benefits!`,
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
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-profile-title">My Profile</h1>
        <p className="text-muted-foreground">
          Your Customer Partner account details
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {profile?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "CP"}
                </span>
              </div>
              <div>
                <p className="font-semibold text-lg" data-testid="text-profile-name">{profile?.name}</p>
                <Badge>Customer Partner</Badge>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span data-testid="text-profile-phone">{profile?.phone}</span>
              </div>
              {profile?.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span data-testid="text-profile-email">{profile?.email}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span data-testid="text-profile-location">
                  {profile?.district}, {profile?.state}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  Partner since {profile?.createdAt ? format(new Date(profile.createdAt), "MMMM yyyy") : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle>Your Referral Code</CardTitle>
            <CardDescription>
              Share this code to earn Rs 10,000 per successful referral
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 bg-background rounded-lg px-4 py-3 border">
              <span className="text-3xl font-mono font-bold text-primary flex-1" data-testid="text-profile-referral-code">
                {profile?.referralCode}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={copyReferralCode}
                data-testid="button-copy-referral"
              >
                <Copy className="w-5 h-5" />
              </Button>
            </div>
            <Button className="w-full" onClick={shareReferralLink} data-testid="button-share-referral">
              <Share2 className="w-4 h-4 mr-2" />
              Share Referral Link
            </Button>
          </CardContent>
        </Card>

        {profile?.linkedCustomer && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-orange-500" />
                Your Solar Installation
              </CardTitle>
              <CardDescription>
                Details of your completed solar installation that made you eligible to be a Customer Partner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{profile.linkedCustomer.capacity} kW</p>
                  <p className="text-sm text-muted-foreground">Installed Capacity</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Sun className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold uppercase">{profile.linkedCustomer.panelType}</p>
                  <p className="text-sm text-muted-foreground">Panel Type</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Calendar className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">
                    {profile.linkedCustomer.installationDate 
                      ? format(new Date(profile.linkedCustomer.installationDate), "MMM yyyy")
                      : "N/A"
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">Installation Date</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
