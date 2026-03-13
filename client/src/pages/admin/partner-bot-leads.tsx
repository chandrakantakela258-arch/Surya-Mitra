import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, RefreshCw, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminPartnerBotLeads() {
  const [search, setSearch] = useState("");

  const { data: leads = [], isLoading, refetch, isFetching } = useQuery<any[]>({
    queryKey: ["/api/admin/partner-bot-leads-all"],
    queryFn: async () => {
      const res = await fetch("/api/admin/partner-chatbot");
      const partners = await res.json();
      const active = partners.filter((p: any) => p.isActive || parseInt(p.totalLeads || 0) > 0);
      const allLeads: any[] = [];
      for (const partner of active) {
        const r = await fetch(`/api/admin/partner-chatbot/${partner.id}/leads`);
        const leads = await r.json();
        leads.forEach((l: any) => { l.partnerName = partner.name; l.partnerCode = partner.partnerCode; });
        allLeads.push(...leads);
      }
      return allLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
  });

  const filtered = leads.filter((l) =>
    [l.name, l.mobileNumber, l.phone, l.state, l.partnerName].some((v) =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const exportCsv = () => {
    const headers = ["Partner","Customer Name","Mobile","Email","State","District","City","Connection Type","Plant Capacity","Monthly Billing","Final Decision","Action Taken","Date"];
    const rows = filtered.map((l: any) => [l.partnerName, l.name, l.mobileNumber||l.phone, l.email, l.state, l.district, l.city, l.connectionType, l.plantCapacity, l.monthlyBilling, l.proposalStatus, l.actionTaken, l.createdAt ? new Date(l.createdAt).toLocaleDateString("en-IN") : ""].map((v) => `"${v??""}"` ).join(","));
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "partner_bot_leads.csv"; a.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full"><MessageSquare className="w-6 h-6 text-primary" /></div>
          <div>
            <h1 className="text-2xl font-bold">Partner Chat Bot Leads</h1>
            <p className="text-muted-foreground text-sm">All leads captured via partner unique chatbot links</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={"w-4 h-4 mr-1 " + (isFetching ? "animate-spin" : "")} /> Refresh
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={exportCsv}>
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Leads</p><p className="text-3xl font-bold text-blue-500 mt-1">{leads.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">New Leads</p><p className="text-3xl font-bold text-orange-500 mt-1">{leads.filter((l:any)=>!l.actionTaken).length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Active Partners</p><p className="text-3xl font-bold text-green-500 mt-1">{[...new Set(leads.map((l:any)=>l.partnerCode))].length}</p></CardContent></Card>
      </div>

      <Input placeholder="Search by name, phone, state, partner..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full md:w-96" />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> All Partner Leads
            <Badge variant="secondary" className="ml-2">{filtered.length} leads</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Partner</TableHead>
                  <TableHead>Customer Name</TableHead>
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
                {isLoading ? (
                  <TableRow><TableCell colSpan={12} className="text-center py-12">Loading leads...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={12} className="text-center py-12 text-muted-foreground">No leads found</TableCell></TableRow>
                ) : filtered.map((lead: any, i: number) => (
                  <TableRow key={i} className="hover:bg-muted/30">
                    <TableCell><Badge variant="outline" className="text-xs whitespace-nowrap">{lead.partnerName}</Badge></TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{lead.name || "—"}</TableCell>
                    <TableCell className="text-green-600 font-semibold">{lead.mobileNumber || lead.phone || "—"}</TableCell>
                    <TableCell className="text-xs">{lead.email || "—"}</TableCell>
                    <TableCell className="text-xs">{lead.state || "—"}</TableCell>
                    <TableCell className="text-xs">{lead.district || "—"}</TableCell>
                    <TableCell className="text-xs">{lead.connectionType || "—"}</TableCell>
                    <TableCell className="text-xs text-green-600">{lead.plantCapacity || "—"}</TableCell>
                    <TableCell className="text-xs">{lead.monthlyBilling || "—"}</TableCell>
                    <TableCell className="text-xs">{lead.proposalStatus ? <Badge variant="secondary">{lead.proposalStatus}</Badge> : "—"}</TableCell>
                    <TableCell className="text-xs">{lead.actionTaken || "—"}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("en-IN") : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
