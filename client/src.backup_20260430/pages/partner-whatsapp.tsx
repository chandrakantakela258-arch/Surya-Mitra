import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MessageSquare, Send, Upload, RefreshCw, Download, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  sent: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  read: "bg-teal-100 text-teal-700",
  replied: "bg-orange-100 text-orange-700",
  failed: "bg-red-100 text-red-700",
  running: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
};

function formatTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function PartnerWhatsAppDashboard() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"send"|"campaigns"|"replies">("send");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [campaignName, setCampaignName] = useState("");
  const [csvRecipients, setCsvRecipients] = useState<any[]>([]);
  const [useMyLeads, setUseMyLeads] = useState(true);
  const [expandedCampaign, setExpandedCampaign] = useState<number|null>(null);
  const [selectedCampaignMsgs, setSelectedCampaignMsgs] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: templates = [] } = useQuery<any[]>({ queryKey: ["/api/partner/whatsapp-templates"] });
  const { data: myLeads = [] } = useQuery<any[]>({ queryKey: ["/api/partner/whatsapp-my-leads"] });
  const { data: limit } = useQuery<any>({ queryKey: ["/api/partner/whatsapp-limit"], refetchInterval: 30000 });
  const { data: campaigns = [], refetch: refetchCampaigns } = useQuery<any[]>({ queryKey: ["/api/partner/whatsapp-campaigns"], refetchInterval: 15000 });
  const { data: replies = [], refetch: refetchReplies } = useQuery<any[]>({ queryKey: ["/api/partner/whatsapp-replies"], refetchInterval: 15000 });
  const { data: stats } = useQuery<any>({ queryKey: ["/api/partner/whatsapp-stats"], refetchInterval: 30000 });

  const recipients = useMyLeads ? myLeads : csvRecipients;
  const remaining = limit ? limit.daily_limit - limit.messages_sent_today : 100;

  const sendMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/partner/whatsapp-send", data),
    onSuccess: (data: any) => {
      toast({ title: `Sent ${data.sent} messages! ${data.failed > 0 ? data.failed + " failed." : ""}` });
      queryClient.invalidateQueries({ queryKey: ["/api/partner/whatsapp-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner/whatsapp-limit"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner/whatsapp-stats"] });
      setCampaignName("");
      setSelectedTemplate(null);
    },
    onError: (e: any) => toast({ title: e.message || "Failed to send", variant: "destructive" }),
  });

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n");
      const parsed = lines.slice(1).map(line => {
        const cols = line.split(",").map(c => c.replace(/"/g, "").trim());
        return { name: cols[0] || "", phone: cols[1] || "" };
      }).filter(r => r.phone.replace(/\D/g, "").length >= 10);
      setCsvRecipients(parsed);
      setUseMyLeads(false);
      toast({ title: `Loaded ${parsed.length} contacts from CSV` });
    };
    reader.readAsText(file);
  };

  const handleSend = () => {
    if (!selectedTemplate) return toast({ title: "Please select a template", variant: "destructive" });
    if (!campaignName) return toast({ title: "Please enter a campaign name", variant: "destructive" });
    if (recipients.length === 0) return toast({ title: "No recipients selected", variant: "destructive" });
    sendMutation.mutate({
      campaignName,
      templateId: selectedTemplate.template_id,
      templateName: selectedTemplate.template_name,
      recipients: recipients.slice(0, remaining),
    });
  };

  const loadCampaignMessages = async (campaignId: number) => {
    if (expandedCampaign === campaignId) { setExpandedCampaign(null); return; }
    setExpandedCampaign(campaignId);
    const res = await fetch(`/api/partner/whatsapp-campaigns/${campaignId}/messages`);
    const data = await res.json();
    setSelectedCampaignMsgs(data);
  };

  const exportCsv = (msgs: any[]) => {
    const headers = ["Phone","Name","Status","Sent","Delivered","Read","Reply"];
    const rows = msgs.map((m: any) => [m.recipient_phone, m.recipient_name, m.status, formatTime(m.sent_at), formatTime(m.delivered_at), formatTime(m.read_at), m.reply_text||""].map((v: any) => `"${v}"`).join(","));
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "campaign_report.csv"; a.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-green-100">
            <MessageSquare className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">WhatsApp Campaigns</h1>
            <p className="text-sm text-muted-foreground">Send messages to your leads using approved templates</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium">{remaining} / {limit?.daily_limit || 100} remaining today</div>
            <div className="text-xs text-muted-foreground">Daily sending limit</div>
          </div>
          <div className="w-24 h-2 bg-muted rounded-full">
            <div className="h-2 bg-green-500 rounded-full" style={{ width: Math.max(0, Math.min(100, (remaining / (limit?.daily_limit || 100)) * 100)) + "%" }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Sent", value: stats?.total || 0, color: "text-blue-600" },
          { label: "Delivered", value: Number(stats?.delivered||0)+Number(stats?.read||0), color: "text-green-600" },
          { label: "Read", value: stats?.read || 0, color: "text-teal-600" },
          { label: "Replied", value: stats?.replied || 0, color: "text-orange-600" },
        ].map(s => (
          <Card key={s.label}><CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={"text-3xl font-bold mt-1 " + s.color}>{s.value}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="flex gap-2 border-b">
        {(["send","campaigns","replies"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={"px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors " + (tab === t ? "border-green-600 text-green-600" : "border-transparent text-muted-foreground")}>
            {t}{t==="replies" && (replies as any[]).length > 0 ? ` (${(replies as any[]).length})` : ""}
          </button>
        ))}
      </div>

      {tab === "send" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Campaign setup</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Campaign name</label>
                  <Input value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="e.g. March Solar Offer" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Select approved template</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(templates as any[]).length === 0 && <p className="text-sm text-muted-foreground">No templates available. Contact admin.</p>}
                    {(templates as any[]).map((t: any) => (
                      <div key={t.id} onClick={() => setSelectedTemplate(t)}
                        className={"p-3 rounded-lg border cursor-pointer transition-colors " + (selectedTemplate?.id === t.id ? "border-green-500 bg-green-50" : "border-border hover:bg-muted/50")}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">{t.template_name}</div>
                            <div className="text-xs text-muted-foreground">{t.template_id}</div>
                          </div>
                          <Badge className="text-xs bg-blue-100 text-blue-700">{t.category}</Badge>
                        </div>
                        {t.description && <div className="text-xs text-muted-foreground mt-1">{t.description}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Recipients</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <button onClick={() => setUseMyLeads(true)} className={"flex-1 py-2 text-sm rounded-lg border transition-colors " + (useMyLeads ? "border-green-500 bg-green-50 text-green-700 font-medium" : "border-border")}>
                    My Bot Leads ({(myLeads as any[]).length})
                  </button>
                  <button onClick={() => setUseMyLeads(false)} className={"flex-1 py-2 text-sm rounded-lg border transition-colors " + (!useMyLeads ? "border-green-500 bg-green-50 text-green-700 font-medium" : "border-border")}>
                    Upload CSV ({csvRecipients.length})
                  </button>
                </div>
                {!useMyLeads && (
                  <div>
                    <input type="file" accept=".csv" ref={fileRef} onChange={handleCsvUpload} className="hidden" />
                    <button onClick={() => fileRef.current?.click()} className="w-full py-6 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:bg-muted/50 transition-colors flex flex-col items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Click to upload CSV (Name, Phone columns)
                    </button>
                    <div className="text-xs text-muted-foreground mt-1">CSV format: Name, Phone (one per row)</div>
                  </div>
                )}
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {recipients.slice(0, 10).map((r: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm px-2 py-1 bg-muted/50 rounded">
                      <span>{r.name || "Unknown"}</span>
                      <span className="text-muted-foreground font-mono text-xs">{r.phone}</span>
                    </div>
                  ))}
                  {recipients.length > 10 && <div className="text-xs text-muted-foreground text-center py-1">+{recipients.length - 10} more</div>}
                </div>
                {recipients.length > remaining && (
                  <div className="text-xs text-orange-600 bg-orange-50 rounded p-2">Only {remaining} of {recipients.length} will be sent (daily limit)</div>
                )}
                <Button onClick={handleSend} disabled={sendMutation.isPending || !limit?.is_enabled} className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <Send className="w-4 h-4 mr-2" />
                  {sendMutation.isPending ? "Sending..." : `Send to ${Math.min(recipients.length, remaining)} recipients`}
                </Button>
                {!limit?.is_enabled && <div className="text-xs text-red-600 text-center">WhatsApp sending is disabled for your account. Contact admin.</div>}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === "campaigns" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{(campaigns as any[]).length} campaigns total</p>
            <Button variant="outline" size="sm" onClick={() => refetchCampaigns()}><RefreshCw className="w-4 h-4 mr-1" />Refresh</Button>
          </div>
          {(campaigns as any[]).length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">No campaigns yet. Send your first campaign!</CardContent></Card>}
          {(campaigns as any[]).map((c: any) => (
            <Card key={c.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium">{c.campaign_name}</div>
                    <div className="text-xs text-muted-foreground">Template: {c.template_name} · {formatTime(c.created_at)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={"text-xs px-2 py-1 rounded-full font-medium " + (STATUS_COLORS[c.status] || "")}>{c.status}</span>
                    <button onClick={() => exportCsv(expandedCampaign === c.id ? selectedCampaignMsgs : [])} className="text-xs text-muted-foreground hover:text-foreground"><Download className="w-4 h-4" /></button>
                    <button onClick={() => loadCampaignMessages(c.id)} className="text-muted-foreground hover:text-foreground">
                      {expandedCampaign === c.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[["Sent", c.sent, "text-blue-600"], ["Delivered", c.delivered, "text-green-600"], ["Read", c.read, "text-teal-600"], ["Failed", c.failed, "text-red-600"]].map(([l,v,col]: any) => (
                    <div key={l} className="bg-muted/50 rounded p-2">
                      <div className={"text-lg font-bold " + col}>{v || 0}</div>
                      <div className="text-xs text-muted-foreground">{l}</div>
                    </div>
                  ))}
                </div>
                {expandedCampaign === c.id && (
                  <div className="mt-4 border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium">Message details</div>
                      <Button size="sm" variant="outline" onClick={() => exportCsv(selectedCampaignMsgs)}><Download className="w-3 h-3 mr-1" />Export</Button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead><tr className="border-b">
                          <th className="text-left py-1 font-medium text-muted-foreground">Name</th>
                          <th className="text-left py-1 font-medium text-muted-foreground">Phone</th>
                          <th className="text-left py-1 font-medium text-muted-foreground">Status</th>
                          <th className="text-left py-1 font-medium text-muted-foreground">Delivered</th>
                          <th className="text-left py-1 font-medium text-muted-foreground">Read</th>
                          <th className="text-left py-1 font-medium text-muted-foreground">Reply</th>
                        </tr></thead>
                        <tbody>
                          {selectedCampaignMsgs.map((m: any) => (
                            <tr key={m.id} className="border-b last:border-0">
                              <td className="py-1.5">{m.recipient_name || "—"}</td>
                              <td className="py-1.5 font-mono">{m.recipient_phone}</td>
                              <td className="py-1.5"><span className={"px-1.5 py-0.5 rounded-full " + (STATUS_COLORS[m.status]||"")}>{m.status}</span></td>
                              <td className="py-1.5 text-muted-foreground">{formatTime(m.delivered_at)}</td>
                              <td className="py-1.5 text-muted-foreground">{formatTime(m.read_at)}</td>
                              <td className="py-1.5 max-w-24 truncate">{m.reply_text || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === "replies" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{(replies as any[]).length} customer replies</p>
            <Button variant="outline" size="sm" onClick={() => refetchReplies()}><RefreshCw className="w-4 h-4 mr-1" />Refresh</Button>
          </div>
          {(replies as any[]).length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">No replies yet</CardContent></Card>}
          {(replies as any[]).map((r: any) => (
            <Card key={r.id}><CardContent className="pt-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-sm font-medium text-green-700 flex-shrink-0">
                  {(r.recipient_name||r.recipient_phone||"").slice(0,2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <div>
                      <span className="font-medium text-sm">{r.recipient_name||"Unknown"}</span>
                      <span className="text-xs text-muted-foreground ml-2 font-mono">{r.recipient_phone}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatTime(r.replied_at)}</span>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-sm text-green-900 border border-green-100">
                    <div className="text-xs text-green-600 font-medium mb-1">Customer replied</div>
                    {r.reply_text}
                  </div>
                  {r.reply_text === "STOP" && <div className="mt-2 text-xs text-red-600 bg-red-50 rounded p-2">Opted out</div>}
                </div>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}
