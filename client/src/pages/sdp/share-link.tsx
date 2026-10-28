import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Copy, CheckCircle, MessageSquare, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SDPShareLink() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const baseUrl = window.location.origin;
  const ddpLink = user?.partnerCode ? baseUrl + "/join/" + user.partnerCode + "?role=ddp" : "";

  const copyLink = () => {
    navigator.clipboard.writeText(ddpLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    toast({ title: "DDP Link Copied!" });
  };

  const shareWhatsApp = () => {
    const msg = "Join Divyanshi Digital Services Pvt Ltd as a District Development Partner! Register here: " + ddpLink + " - Earn commissions on every solar installation - Divyanshi Digital Services Pvt Ltd Partner Network";
    window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(msg), "_blank");
  };

  if (!user?.partnerCode) return <div className="p-8 text-center text-muted-foreground">Partner code not found. Please contact admin.</div>;

  return (
    <div className="container mx-auto py-6 max-w-xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Share District Partner Link</h1>
        <p className="text-muted-foreground">Invite new District Development Partners to join under you</p>
        <Badge variant="outline" className="mt-2 font-mono">{user.partnerCode}</Badge>
      </div>
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            District Development Partner Link
          </CardTitle>
          <CardDescription>Share this link to add a DDP under you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={ddpLink} readOnly className="font-mono text-xs" />
            <Button onClick={copyLink} variant={copied ? "default" : "outline"} className="shrink-0">
              {copied ? <><CheckCircle className="h-4 w-4 mr-1" />Copied</> : <><Copy className="h-4 w-4 mr-1" />Copy</>}
            </Button>
          </div>
          <Button onClick={shareWhatsApp} className="w-full bg-green-600 hover:bg-green-700">
            <MessageSquare className="h-4 w-4 mr-2" />Share on WhatsApp
          </Button>
          <div className="rounded-lg bg-orange-50 dark:bg-orange-950/30 p-4 text-sm">
            <strong>How it works:</strong>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>1. Share this link with potential District Partners</li>
              <li>2. They fill in their details on the registration form</li>
              <li>3. They get auto-approved and mapped under you</li>
              <li>4. They appear in your District Partners list immediately</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
