import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Users, Building2, FileText, IndianRupee, CheckCircle, Clock, Sun, RefreshCw, Settings, Copy, CheckCircle2, Link2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User, Customer } from "@shared/schema";

function BDPLinkGenerator() {
  const { toast } = useToast();
  const [selectedBdp, setSelectedBdp] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const { data: bdps } = useQuery<User[]>({
    queryKey: ["/api/admin/partners"],
    select: (data) => data?.filter(p => p.role === "bdp" && p.status === "approved" && p.partnerCode),
  });

  const selectedBdpData = bdps?.find(b => b.id.toString() === selectedBdp);
  const baseUrl = window.location.origin;
  const ddpLink = selectedBdpData ? `${baseUrl}/join/${selectedBdpData.partnerCode}?role=ddp` : "";

  const copyLink = () => {
    if (!ddpLink) return;
    navigator.clipboard.writeText(ddpLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    toast({ title: "BDP Link Copied!", description: ddpLink });
  };

  const shareWhatsApp = () => {
    if (!ddpLink) return;
    const text = encodeURIComponent(
      `🤝 Join Divyanshi Digital Services Pvt Ltd as a District Development Partner!

Register using this link:
${ddpLink}

✅ Earn commissions on every solar installation
✅ Get your own Solar Bot for lead generation
✅ Access to exclusive products & training

— Divyanshi Digital Services Pvt Ltd Partner Network`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <Card className="border-orange-200 dark:border-orange-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Link2 className="w-5 h-5 text-orange-500" />
          Generate BDP Partner Link
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select onValueChange={setSelectedBdp} value={selectedBdp}>
          <SelectTrigger>
            <SelectValue placeholder="Select a BDP to generate link" />
          </SelectTrigger>
          <SelectContent>
            {bdps?.map(bdp => (
              <SelectItem key={bdp.id} value={bdp.id.toString()}>
                {bdp.name} — {bdp.partnerCode} ({bdp.district || bdp.state || "N/A"})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {ddpLink && (
          <>
            <div className="flex gap-2">
              <Input value={ddpLink} readOnly className="font-mono text-xs" />
              <Button onClick={copyLink} variant={copied ? "default" : "outline"} className="shrink-0">
                {copied ? <><CheckCircle2 className="h-4 w-4 mr-1" />Copied</> : <><Copy className="h-4 w-4 mr-1" />Copy</>}
              </Button>
            </div>
            <Button onClick={shareWhatsApp} className="w-full bg-green-600 hover:bg-green-700">
              Share on WhatsApp
            </Button>
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              <strong>BDP:</strong> {selectedBdpData?.name} &nbsp;|&nbsp;
              <strong>Code:</strong> {selectedBdpData?.partnerCode} &nbsp;|&nbsp;
              <strong>Role:</strong> DDP Registration Link
            </div>
          </>
        )}
        {!bdps?.length && (
          <p className="text-sm text-muted-foreground">No approved BDPs with partner codes found.</p>
        )}
      </CardContent>
    </Card>
  );
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function BDPShareCard() {
  const { toast } = useToast();
  const [bdpCopied, setBdpCopied] = useState(false);
  const bdpLink = window.location.origin + "/join-bdp";

  const copyBdpLink = () => {
    navigator.clipboard.writeText(bdpLink);
    setBdpCopied(true);
    setTimeout(() => setBdpCopied(false), 3000);
    toast({ title: "BDP Registration Link Copied!" });
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `🌟 Join Divyanshi Digital Services Pvt Ltd as a Business Development Partner (BDP)!

📋 Register here:
${bdpLink}

✅ Build your own partner network
✅ Earn commissions on team installations
✅ Access business analytics dashboard
✅ Get your own Solar Bot for lead generation

— Divyanshi Digital Services Pvt Ltd`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="w-5 h-5 text-blue-600" />
          Share BDP Registration Link
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input value={bdpLink} readOnly className="font-mono text-xs bg-white dark:bg-gray-900" />
          <Button onClick={copyBdpLink} variant={bdpCopied ? "default" : "outline"} className="shrink-0">
            {bdpCopied ? <><CheckCircle2 className="h-4 w-4 mr-1" />Copied</> : <><Copy className="h-4 w-4 mr-1" />Copy</>}
          </Button>
        </div>
        <Button onClick={shareWhatsApp} className="w-full bg-green-600 hover:bg-green-700 text-white">
          📲 Share BDP Link on WhatsApp
        </Button>
        <p className="text-xs text-muted-foreground">Anyone with this link can register as a Business Development Partner</p>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { toast } = useToast();
  
  const { data: stats, isLoading } = useQuery<{
    totalBDPs: number;
    totalDDPs: number;
    totalCustomers: number;
    pendingPartners: number;
    completedInstallations: number;
    totalCommissions: number;
    pendingCommissions: number;
  }>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: recentPartners } = useQuery<User[]>({
    queryKey: ["/api/admin/partners/recent"],
  });

  const { data: recentCustomers } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers/recent"],
  });

  const regenerateCodesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/regenerate-all-codes");
    },
    onSuccess: (data) => {
      toast({
        title: "Codes Regenerated",
        description: `BDPs: ${data.bdpCodesRegenerated}, DDPs: ${data.ddpCodesRegenerated}, Customers: ${data.customerCodesRegenerated}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate codes",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
          <Sun className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Admin Dashboard</h1>
          <p className="text-muted-foreground">DivyanshiSolar Platform Overview</p>
        </div>
      </div>

      {/* BDP Registration Link Share */}
      <BDPShareCard />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total BDPs</CardTitle>
            <Building2 className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" data-testid="text-total-bdps">{stats?.totalBDPs || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Business Development Partners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total DDPs</CardTitle>
            <Users className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" data-testid="text-total-ddps">{stats?.totalDDPs || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">District Development Partners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
            <FileText className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" data-testid="text-total-customers">{stats?.totalCustomers || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Solar Applications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" data-testid="text-completed">{stats?.completedInstallations || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Installations Done</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Commissions</CardTitle>
            <IndianRupee className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600" data-testid="text-total-commissions">
              {formatINR(stats?.totalCommissions || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">All partner earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approvals</CardTitle>
            <Clock className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600" data-testid="text-pending-partners">
              {stats?.pendingPartners || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Partners awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">System Tools</CardTitle>
            <Settings className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => regenerateCodesMutation.mutate()}
              disabled={regenerateCodesMutation.isPending}
              variant="outline"
              className="w-full"
              data-testid="button-regenerate-codes"
            >
              {regenerateCodesMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Regenerate All Codes
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Update partner and customer codes to new format</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Partners</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPartners && recentPartners.length > 0 ? (
              <div className="space-y-3">
                {recentPartners.slice(0, 5).map((partner) => (
                  <div key={partner.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">{partner.name}</p>
                      <p className="text-xs text-muted-foreground">{partner.role.toUpperCase()} - {partner.district}, {partner.state}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      partner.status === "approved" 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300"
                    }`}>
                      {partner.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No partners yet</p>
            )}
          </CardContent>
        </Card>

        <BDPLinkGenerator />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCustomers && recentCustomers.length > 0 ? (
              <div className="space-y-3">
                {recentCustomers.slice(0, 5).map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customer.proposedCapacity} kW - {customer.district}, {customer.state}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      customer.status === "completed" 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                    }`}>
                      {customer.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No customers yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
