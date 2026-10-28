import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle, MessageSquare, Link2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

export default function ShareCustomerLink() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const partnerCode = user?.partnerCode || "";
  const fullLink = window.location.origin + "/customer-registration?ref=" + partnerCode;

  const copyLink = () => {
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    toast({ title: "Link copied!" });
    setTimeout(() => setCopied(false), 3000);
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      "🌞 Get Free Solar Panels under PM Surya Ghar Yojana!\n\n" +
      "✅ Government subsidy up to Rs 78,000\n" +
      "✅ Reduce electricity bill to zero\n" +
      "✅ Free rooftop solar installation\n\n" +
      "Register now using this link:\n" +
      fullLink + "\n\n" +
      "— Prayga India Private Limited Partner Network"
    );
    window.open("https://api.whatsapp.com/send?text=" + text, "_blank");
  };

  const shareSMS = () => {
    const text = encodeURIComponent(
      "Get Free Solar Panels! Govt subsidy up to Rs 78,000. Register: " + fullLink
    );
    window.open("sms:?body=" + text, "_blank");
  };

  const roleLabel = user?.role === "sdp" ? "State Development Partner" : "District Development Partner";

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Share Customer Registration Link</h1>
        <p className="text-muted-foreground">Share this link with customers to register under your network</p>
      </div>

      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Link2 className="h-5 w-5 text-green-600" />
            </div>
            Your Unique Customer Link
          </CardTitle>
          <CardDescription>
            Customers who register via this link will be automatically mapped under you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="font-mono">{partnerCode}</Badge>
              <Badge>{roleLabel}</Badge>
            </div>
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.district}, {user?.state}</p>
          </div>

          <div className="flex gap-2">
            <Input value={fullLink} readOnly className="font-mono text-xs" />
            <Button onClick={copyLink} variant={copied ? "default" : "outline"} className="shrink-0">
              {copied ? <><CheckCircle className="h-4 w-4 mr-1" />Copied</> : <><Copy className="h-4 w-4 mr-1" />Copy</>}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={shareWhatsApp} className="bg-green-600 hover:bg-green-700">
              <MessageSquare className="h-4 w-4 mr-2" />Share on WhatsApp
            </Button>
            <Button onClick={shareSMS} variant="outline">
              <Users className="h-4 w-4 mr-2" />Share via SMS
            </Button>
          </div>

          <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-4 text-sm">
            <strong>How it works:</strong>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>1. Share this link with potential customers</li>
              <li>2. They fill the solar registration form</li>
              <li>3. Your partner code ({partnerCode}) is auto-filled</li>
              <li>4. Customer gets mapped under you automatically</li>
              <li>5. You earn commission on their installation</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
