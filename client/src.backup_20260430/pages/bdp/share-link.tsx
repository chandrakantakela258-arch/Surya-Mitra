import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Copy, Share2, Users, CheckCircle, MessageSquare, Link2, Building2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


export default function BDPShareLink() {
  const { toast } = useToast();
  const [copiedDDP, setCopiedDDP] = useState(false);
  const [copiedSDP, setCopiedSDP] = useState(false);

  const { data: info, isLoading } = useQuery<any>({
    queryKey: ["/api/bdp/referral-info"],
  });

  const baseUrl = window.location.origin;
  const ddpLink = info ? baseUrl + "/join/" + info.partnerCode + "?role=ddp" : "";
  const sdpLink = info ? baseUrl + "/join/" + info.partnerCode + "?role=sdp" : "";

  const copyLink = (link: string, type: string) => {
    navigator.clipboard.writeText(link);
    if (type === "ddp") { setCopiedDDP(true); setTimeout(() => setCopiedDDP(false), 3000); }
    else { setCopiedSDP(true); setTimeout(() => setCopiedSDP(false), 3000); }
    toast({ title: type.toUpperCase() + " link copied!" });
  };

  const shareWhatsApp = (link: string, roleLabel: string) => {
    const text = encodeURIComponent(
      "\uD83E\uDD1D Join Prayga India Private Limited as a " + roleLabel + "!\n\n" +
      "Register using my referral link:\n" +
      link + "\n\n" +
      "\u2705 Earn commissions on every solar installation\n" +
      "\u2705 Get your own Solar Bot for lead generation\n" +
      "\u2705 Access to exclusive products & training\n\n" +
      "\u2014 Prayga India Private Limited Partner Network"
    );
    window.open("https://api.whatsapp.com/send?text=" + text, "_blank");
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!info) return <div className="p-8 text-center text-muted-foreground">Could not load referral info. Make sure you are logged in as a BDP.</div>;

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Share Partner Links</h1>
        <p className="text-muted-foreground">Invite new District or State partners to join under you</p>
        <Badge variant="outline" className="mt-2 font-mono">{info.partnerCode}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* DDP Link Card */}
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              District Development Partner
            </CardTitle>
            <CardDescription>Share this link to add a DDP under you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={ddpLink} readOnly className="font-mono text-xs" />
              <Button onClick={() => copyLink(ddpLink, "ddp")} variant={copiedDDP ? "default" : "outline"} className="shrink-0">
                {copiedDDP ? <><CheckCircle className="h-4 w-4 mr-1" />Copied</> : <><Copy className="h-4 w-4 mr-1" />Copy</>}
              </Button>
            </div>
            <Button onClick={() => shareWhatsApp(ddpLink, "District Development Partner")} className="w-full bg-green-600 hover:bg-green-700">
              <MessageSquare className="h-4 w-4 mr-2" />Share DDP Link on WhatsApp
            </Button>
            <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <div className="text-2xl font-bold text-blue-600">{info.ddpCount || 0}</div>
              <div className="text-xs text-muted-foreground">DDPs joined via your link</div>
            </div>
          </CardContent>
        </Card>

        {/* SDP Link Card */}
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
              State Development Partner
            </CardTitle>
            <CardDescription>Share this link to add a SDP under you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={sdpLink} readOnly className="font-mono text-xs" />
              <Button onClick={() => copyLink(sdpLink, "sdp")} variant={copiedSDP ? "default" : "outline"} className="shrink-0">
                {copiedSDP ? <><CheckCircle className="h-4 w-4 mr-1" />Copied</> : <><Copy className="h-4 w-4 mr-1" />Copy</>}
              </Button>
            </div>
            <Button onClick={() => shareWhatsApp(sdpLink, "State Development Partner")} className="w-full bg-green-600 hover:bg-green-700">
              <MessageSquare className="h-4 w-4 mr-2" />Share SDP Link on WhatsApp
            </Button>
            <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30">
              <div className="text-2xl font-bold text-purple-600">{info.sdpCount || 0}</div>
              <div className="text-xs text-muted-foreground">SDPs joined via your link</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="rounded-lg bg-orange-50 dark:bg-orange-950/30 p-4 text-sm">
            <strong>How it works:</strong>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>1. Share the respective link with potential partners</li>
              <li>2. They fill in their details on the registration form</li>
              <li>3. They get auto-approved and mapped under you</li>
              <li>4. DDP gets code like DSDDP{info.partnerCode?.slice(5)}XXX, SDP gets DSSDP{info.partnerCode?.slice(5)}XXX</li>
              <li>5. They appear in your partner hierarchy immediately</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
