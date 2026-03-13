import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Download, Users, RefreshCw, MessageSquare, Sun, CheckCircle, Clock, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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

export default function AdminSolarBotLeads() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: leads = [], isLoading, refetch, isFetching } = useQuery<any[]>({
    queryKey: ["/api/leads"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/leads/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ title: "Lead deleted successfully" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => apiRequest("DELETE", "/api/leads/bulk-delete", { ids }),
    onSuccess: (_: any, ids: string[]) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setSelectedIds(new Set());
      toast({ title: `${ids.length} leads deleted` });
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, actionTaken }: { id: string; actionTaken: string }) =>
      apiRequest("PATCH", `/api/leads/${id}/action`, { actionTaken }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ title: "Action updated" });
    },
  });

  const filtered = leads.filter((l) =>
    [l.name, l.mobileNumber, l.phone, l.email, l.state, l.city, l.district].some((v) =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const allSelected = filtered.length > 0 && filtered.every((l) => selectedIds.has(l.id));
  const toggleAll = () => allSelected ? setSelectedIds(new Set()) : setSelectedIds(new Set(filtered.map((l) => l.id)));
  const toggleOne = (id: string) => { const n = new Set(selectedIds); n.has(id) ? n.delete(id) : n.add(id); setSelectedIds(n); };

  const exportToCsv = () => {
    if (!leads.length) return;
    const headers = ["Customer Name","Mobile No","Email ID","Consumer No","Monthly Billing","State","District","City","Action Taken","Final Decision","Connection Type","Residential Plant Capacity","Commercial Plant Capacity","Industrial Plant Capacity"];
    const rows = leads.map((l: any) => {
      const ct = (l.connectionType || l.meterType || "").toLowerCase();
      return [l.name, l.mobileNumber||l.phone, l.email, l.consumerNumber, l.monthlyBilling, l.state, l.district, l.city, l.actionTaken, l.proposalStatus, l.connectionType||l.meterType, ct.includes("residential")?l.plantCapacity:"", ct.includes("commercial")?l.plantCapacity:"", ct.includes("industrial")?l.plantCapacity:""].map((v) => `"${v ?? ""}"`).join(",");
    });
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "solar_bot_leads.csv"; a.click();
  };

  const totalLeads = leads.length;
  const newLeads = leads.filter((l: any) => !l.actionTaken).length;
  const highIntent = leads.filter((l: any) => l.proposalStatus === "Interested" || l.proposalStatus === "interested").length;
  const converted = leads.filter((l: any) => l.status === "Converted").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full"><MessageSquare className="w-6 h-6 text-primary" /></div>
          <div>
            <h1 className="text-2xl font-bold">Solar Bot Leads</h1>
            <p className="text-muted-foreground text-sm">Leads captured from PM Surya Ghar Solar Chatbot</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={"w-4 h-4 mr-1 " + (isFetching ? "animate-spin" : "")} /> Refresh
          </Button>
          {selectedIds.size > 0 && (
            <Button variant="destructive" size="sm" onClick={() => { if (confirm(`Delete ${selectedIds.size} leads?`)) bulkDeleteMutation.mutate([...selectedIds]); }}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete ({selectedIds.size})
            </Button>
          )}
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={exportToCsv}>
            <Download className="w-4 h-4 mr-1" /> Export to Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Leads", value: totalLeads, sub: "All chatbot conversations", icon: <Users className="w-5 h-5" />, color: "text-blue-500" },
          { label: "New Leads", value: newLeads, sub: "No action taken yet", icon: <Sun className="w-5 h-5" />, color: "text-orange-500" },
          { label: "High Intent", value: highIntent, sub: "Interested in proposal", icon: <CheckCircle className="w-5 h-5" />, color: "text-green-500" },
          { label: "Converted", value: converted, sub: "Installation confirmed", icon: <Clock className="w-5 h-5" />, color: "text-purple-500" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className={"text-3xl font-bold mt-1 " + s.color}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
                </div>
                <div className={s.color}>{s.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative w-full md:w-96">
        <Input placeholder="Search by name, phone, state, city..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-4" />
      </div>

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
                  <TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={toggleAll} /></TableHead>
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
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={16} className="text-center py-12 text-muted-foreground">Loading leads...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={16} className="text-center py-12 text-muted-foreground">No leads found</TableCell></TableRow>
                ) : filtered.map((lead: any) => {
                  const ct = (lead.connectionType || lead.meterType || "").toLowerCase();
                  const isRes = ct.includes("residential");
                  const isCom = ct.includes("commercial");
                  const isInd = ct.includes("industrial");
                  const plant = lead.plantCapacity || "";
                  return (
                    <TableRow key={lead.id} className={selectedIds.has(lead.id) ? "bg-primary/5" : "hover:bg-muted/30"}>
                      <TableCell><Checkbox checked={selectedIds.has(lead.id)} onCheckedChange={() => toggleOne(lead.id)} /></TableCell>
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
                        {lead.proposalStatus ? (
                          <Badge variant={lead.proposalStatus === "Interested" ? "default" : lead.proposalStatus === "Not Interested" ? "destructive" : "secondary"} className="text-xs whitespace-nowrap">
                            {lead.proposalStatus}
                          </Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {lead.connectionType || lead.meterType ? (
                          <Badge variant={isRes ? "default" : isCom ? "secondary" : "outline"} className="text-xs whitespace-nowrap">
                            {lead.connectionType || lead.meterType}
                          </Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-green-600 font-medium">{isRes ? plant : "—"}</TableCell>
                      <TableCell className="text-xs text-blue-500 font-medium">{isCom ? plant : "—"}</TableCell>
                      <TableCell className="text-xs text-orange-500 font-medium">{isInd ? plant : "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => { if (confirm("Delete this lead?")) deleteMutation.mutate(lead.id); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
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
