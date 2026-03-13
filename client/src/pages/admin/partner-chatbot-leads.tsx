import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MessageSquare, Users, Copy, Check, ToggleLeft, ToggleRight, ExternalLink, RefreshCw, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AdminPartnerChatbotLeads() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewPartner, setViewPartner] = useState<any | null>(null);

  const { data: partners = [], isLoading, refetch, isFetching } = useQuery<any[]>({
    queryKey: ["/api/admin/partner-chatbot"],
  });

  const { data: partnerLeads = [], isLoading: leadsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/partner-chatbot", viewPartner?.id, "leads"],
    queryFn: async () => {
      if (!viewPartner?.id) return [];
      const res = await fetch(`/api/admin/partner-chatbot/${viewPartner.id}/leads`);
      return res.json();
    },
    enabled: !!viewPartner?.id,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ partnerId, isActive }: { partnerId: string; isActive: boolean }) =>
      apiRequest("POST", `/api/admin/partner-chatbot/${partnerId}/toggle`, { isActive }),
    onSuccess: (data: any, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partner-chatbot"] });
      toast({ title: vars.isActive ? "Chatbot activated!" : "Chatbot deactivated" });
    },
  });

  const copyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Link copied!" });
  };

  const filtered = partners.filter((p) =>
    [p.name, p.username, p.state, p.district, p.partnerCode].some((v) =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const activeCount = partners.filter((p) => p.isActive).length;
  const totalLeads = partners.reduce((sum: number, p: any) => sum + parseInt(p.totalLeads || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full"><MessageSquare className="w-6 h-6 text-primary" /></div>
          <div>
            <h1 className="text-2xl font-bold">Partner Chat Bot Leads</h1>
            <p className="text-muted-foreground text-sm">Activate chatbot for partners & manage their leads</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={"w-4 h-4 mr-1 " + (isFetching ? "animate-spin" : "")} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total Partners</p>
          <p className="text-3xl font-bold text-blue-500 mt-1">{partners.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Active Chatbots</p>
          <p className="text-3xl font-bold text-green-500 mt-1">{activeCount}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total Bot Leads</p>
          <p className="text-3xl font-bold text-orange-500 mt-1">{totalLeads}</p>
        </CardContent></Card>
      </div>

      <div className="w-full md:w-96">
        <Input placeholder="Search by name, code, state..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" /> Partners List
            <Badge variant="secondary" className="ml-2">{filtered.length} partners</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Partner Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Chatbot</TableHead>
                  <TableHead>Bot Link</TableHead>
                  <TableHead>Total Leads</TableHead>
                  <TableHead>New Leads</TableHead>
                  <TableHead>View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">No partners found</TableCell></TableRow>
                ) : filtered.map((partner: any) => (
                  <TableRow key={partner.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium whitespace-nowrap">{partner.name}</TableCell>
                    <TableCell><Badge variant={partner.role === "bdp" ? "default" : "secondary"} className="uppercase text-xs">{partner.role}</Badge></TableCell>
                    <TableCell className="text-xs font-mono">{partner.partnerCode || "—"}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{partner.state || "—"}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => toggleMutation.mutate({ partnerId: partner.id, isActive: !partner.isActive })}
                        disabled={toggleMutation.isPending}
                        className="flex items-center gap-1"
                      >
                        {partner.isActive
                          ? <ToggleRight className="w-8 h-8 text-green-500" />
                          : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
                        <span className={`text-xs font-medium ${partner.isActive ? "text-green-500" : "text-muted-foreground"}`}>
                          {partner.isActive ? "ON" : "OFF"}
                        </span>
                      </button>
                    </TableCell>
                    <TableCell>
                      {partner.botLink ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-blue-500 max-w-[180px] truncate">{partner.botLink}</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyLink(partner.botLink, partner.id)}>
                            {copiedId === partner.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                          </Button>
                          <a href={partner.botLink} target="_blank" rel="noreferrer">
                            <ExternalLink className="w-3 h-3 text-blue-400" />
                          </a>
                        </div>
                      ) : <span className="text-xs text-muted-foreground">Not activated</span>}
                    </TableCell>
                    <TableCell className="text-center font-bold text-blue-500">{partner.totalLeads || 0}</TableCell>
                    <TableCell className="text-center font-bold text-orange-500">{partner.newLeads || 0}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => setViewPartner(partner)} disabled={!parseInt(partner.totalLeads)}>
                        <Eye className="w-4 h-4 mr-1" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Partner Leads Dialog */}
      <Dialog open={!!viewPartner} onOpenChange={(o) => !o && setViewPartner(null)}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {viewPartner?.name} — Bot Leads
              {viewPartner?.botLink && (
                <div className="flex items-center gap-1 ml-2">
                  <span className="text-xs font-normal text-blue-500 truncate max-w-xs">{viewPartner.botLink}</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyLink(viewPartner.botLink, "dialog")}>
                    {copiedId === "dialog" ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Connection Type</TableHead>
                  <TableHead>Plant Capacity</TableHead>
                  <TableHead>Monthly Billing</TableHead>
                  <TableHead>Final Decision</TableHead>
                  <TableHead>Action Taken</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadsLoading ? (
                  <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">Loading leads...</TableCell></TableRow>
                ) : partnerLeads.length === 0 ? (
                  <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">No leads found</TableCell></TableRow>
                ) : partnerLeads.map((lead: any) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium whitespace-nowrap">{lead.name || "—"}</TableCell>
                    <TableCell className="text-green-600 font-semibold">{lead.mobileNumber || lead.phone || "—"}</TableCell>
                    <TableCell className="text-xs">{lead.email || "—"}</TableCell>
                    <TableCell className="text-xs">{lead.state || "—"}</TableCell>
                    <TableCell className="text-xs">{lead.district || "—"}</TableCell>
                    <TableCell className="text-xs">{lead.connectionType || "—"}</TableCell>
                    <TableCell className="text-xs text-green-600 font-medium">{lead.plantCapacity || "—"}</TableCell>
                    <TableCell className="text-xs">{lead.monthlyBilling || "—"}</TableCell>
                    <TableCell className="text-xs">
                      {lead.proposalStatus ? <Badge variant="secondary" className="text-xs">{lead.proposalStatus}</Badge> : "—"}
                    </TableCell>
                    <TableCell className="text-xs">{lead.actionTaken || "—"}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("en-IN") : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
