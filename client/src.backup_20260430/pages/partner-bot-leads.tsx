import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MessageSquare, RefreshCw, Copy, Check, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const ACTION_OPTIONS = [
  "High Intent Serious Customer",
  "Medium Intent Serious Customer",
  "Low Intent Non-Serious Customer",
  "High Intent - Price Issue",
  "High Intent but Needs Time",
  "Want Proper Site Survey of the Site",
  "Convinced and Filled the Form",
  "Convinced and Ready to Fill Form",
  "Called Customer",
  "Visited Customer Home",
  "Sent all Documents to Customer",
  "Customer has Installed Plant",
  "Customer has taken two Months Time to install",
];

export default function PartnerBotLeads() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: config } = useQuery<any>({
    queryKey: ["/api/partner/chatbot-config"],
  });

  const { data: leads = [], isLoading, refetch, isFetching } = useQuery<any[]>({
    queryKey: ["/api/partner/bot-leads"],
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, actionTaken }: { id: string; actionTaken: string }) =>
      apiRequest("PATCH", `/api/partner/bot-leads/${id}/action`, { actionTaken }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner/bot-leads"] });
      toast({ title: "Action updated" });
    },
  });

  const filtered = leads.filter((l: any) =>
    [l.name, l.mobileNumber, l.phone, l.state, l.city, l.district].some((v: any) =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const copyLink = () => {
    if (config?.botLink) {
      navigator.clipboard.writeText(config.botLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Bot link copied!" });
    }
  };

  const exportCsv = () => {
    const headers = ["Customer Name","Mobile No","Email ID","Consumer No","Monthly Billing","State","District","City","Action Taken","Final Decision","Connection Type","Residential Plant Capacity","Commercial Plant Capacity","Industrial Plant Capacity"];
    const rows = filtered.map((l: any) => {
      const ct = (l.connectionType || l.meterType || "").toLowerCase();
      return [l.name, l.mobileNumber||l.phone, l.email, l.consumerNumber, l.monthlyBilling, l.state, l.district, l.city, l.actionTaken, l.proposalStatus, l.connectionType||l.meterType, ct.includes("residential")?l.plantCapacity:"", ct.includes("commercial")?l.plantCapacity:"", ct.includes("industrial")?l.plantCapacity:""].map((v) => `"${v??""}"` ).join(",");
    });
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "my_bot_leads.csv"; a.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full"><MessageSquare className="w-6 h-6 text-primary" /></div>
          <div>
            <h1 className="text-2xl font-bold">My Chat Bot Leads</h1>
            <p className="text-muted-foreground text-sm">Leads captured via your unique chatbot link</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={"w-4 h-4 mr-1 " + (isFetching ? "animate-spin" : "")} /> Refresh
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={exportCsv}>
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      {config?.isActive ? (
        <Card className="border-green-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="bg-green-600">🤖 Chatbot Active</Badge>
              <span className="text-sm text-blue-500 font-mono truncate max-w-xs">{config.botLink}</span>
              <Button size="sm" variant="outline" onClick={copyLink}>
                {copied ? <Check className="w-4 h-4 mr-1 text-green-500" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-yellow-500">
          <CardContent className="pt-4">
            <p className="text-sm text-yellow-600">⚠️ Your chatbot is not activated yet. Contact Admin to activate.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Leads</p><p className="text-3xl font-bold text-blue-500 mt-1">{leads.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">New Leads</p><p className="text-3xl font-bold text-orange-500 mt-1">{leads.filter((l:any)=>!l.actionTaken).length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">High Intent</p><p className="text-3xl font-bold text-green-500 mt-1">{leads.filter((l:any)=>l.proposalStatus==="Interested").length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Converted</p><p className="text-3xl font-bold text-purple-500 mt-1">{leads.filter((l:any)=>l.status==="Converted").length}</p></CardContent></Card>
      </div>

      <Input placeholder="Search by name, phone, state, city..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full md:w-96" />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Lead Details
            <Badge variant="secondary" className="ml-2">{filtered.length} leads</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="whitespace-nowrap">Customer Name</TableHead>
                  <TableHead className="whitespace-nowrap">Mobile No</TableHead>
                  <TableHead className="whitespace-nowrap">Email ID</TableHead>
                  <TableHead className="whitespace-nowrap">Consumer No.</TableHead>
                  <TableHead className="whitespace-nowrap">Monthly Billing</TableHead>
                  <TableHead className="whitespace-nowrap">State</TableHead>
                  <TableHead className="whitespace-nowrap">District</TableHead>
                  <TableHead className="whitespace-nowrap">City</TableHead>
                  <TableHead className="whitespace-nowrap">Action Taken</TableHead>
                  <TableHead className="whitespace-nowrap">Final Decision</TableHead>
                  <TableHead className="whitespace-nowrap">Connection Type</TableHead>
                  <TableHead className="whitespace-nowrap">Residential Plant Capacity</TableHead>
                  <TableHead className="whitespace-nowrap">Commercial Plant Capacity</TableHead>
                  <TableHead className="whitespace-nowrap">Industrial Plant Capacity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={14} className="text-center py-12">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={14} className="text-center py-12 text-muted-foreground">No leads yet. Share your bot link to capture leads!</TableCell></TableRow>
                ) : filtered.map((lead: any) => {
                  const ct = (lead.connectionType || lead.meterType || "").toLowerCase();
                  const isRes = ct.includes("residential");
                  const isCom = ct.includes("commercial");
                  const isInd = ct.includes("industrial");
                  const plant = lead.plantCapacity || "";
                  return (
                    <TableRow key={lead.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium whitespace-nowrap">{lead.name || "—"}</TableCell>
                      <TableCell className="text-green-600 font-semibold whitespace-nowrap">{lead.mobileNumber || lead.phone || "—"}</TableCell>
                      <TableCell className="text-xs">{lead.email || "—"}</TableCell>
                      <TableCell className="text-xs">{lead.consumerNumber || "—"}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{lead.monthlyBilling || "—"}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{lead.state || "—"}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{lead.district || "—"}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{lead.city || "—"}</TableCell>
                      <TableCell>
                        <Select value={lead.actionTaken || ""} onValueChange={(val) => actionMutation.mutate({ id: lead.id, actionTaken: val })}>
                          <SelectTrigger className="w-44 text-xs"><SelectValue placeholder="Select action..." /></SelectTrigger>
                          <SelectContent>
                            {ACTION_OPTIONS.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs">
                        {lead.proposalStatus ? <Badge variant={lead.proposalStatus==="Interested"?"default":lead.proposalStatus==="Not Interested"?"destructive":"secondary"} className="text-xs whitespace-nowrap">{lead.proposalStatus}</Badge> : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {lead.connectionType||lead.meterType ? <Badge variant={isRes?"default":isCom?"secondary":"outline"} className="text-xs whitespace-nowrap">{lead.connectionType||lead.meterType}</Badge> : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-green-600 font-medium">{isRes ? plant : "—"}</TableCell>
                      <TableCell className="text-xs text-blue-500 font-medium">{isCom ? plant : "—"}</TableCell>
                      <TableCell className="text-xs text-orange-500 font-medium">{isInd ? plant : "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
