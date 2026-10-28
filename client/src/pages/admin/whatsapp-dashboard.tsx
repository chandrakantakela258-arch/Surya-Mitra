import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, RefreshCw, Download, Send, Upload, Filter, X, Calendar, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const STATUS_COLORS: Record<string, string> = {
  sent: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  read: "bg-teal-100 text-teal-700",
  replied: "bg-orange-100 text-orange-700",
  clicked: "bg-purple-100 text-purple-700",
  failed: "bg-red-100 text-red-700",
};

function formatTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toISOString().split("T")[0];
}

export default function WhatsAppDashboard() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"send" | "overview" | "messages" | "replies">("overview");
  const fileRef = useRef<HTMLInputElement>(null);
  const [sendTab, setSendTab] = useState<"partners"|"csv"|"manual"|"contacts">("partners");
  const [manualNumbers, setManualNumbers] = useState("");
  const [manualContacts, setManualContacts] = useState<any[]>([]);
  const [contactGroups, setContactGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [savedContacts, setSavedContacts] = useState<any[]>([]);
  const [showSaveContact, setShowSaveContact] = useState(false);
  const [newContact, setNewContact] = useState({ name:"", phone:"", group:"", notes:"" });
  const [contactsLoaded, setContactsLoaded] = useState(false);
  const [csvContacts, setCsvContacts] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [campaignName, setCampaignName] = useState("");
  const [partnerType, setPartnerType] = useState("all");
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<any>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deletingId, setDeletingId] = useState<number|null>(null);
  const [isDeletingFailed, setIsDeletingFailed] = useState(false);
  const deleteRecord = async (id: number) => {
    if (!confirm("Delete this record?")) return;
    setDeletingId(id);
    await fetch(`/api/admin/whatsapp-broadcasts/${id}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/whatsapp-broadcasts"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/whatsapp-broadcasts/stats"] });
    setDeletingId(null);
  };
  const deleteAllFailed = async () => {
    if (!confirm("Delete ALL failed messages? Cannot be undone.")) return;
    setIsDeletingFailed(true);
    const res = await fetch("/api/admin/whatsapp-broadcasts-failed", { method: "DELETE" });
    const data = await res.json();
    alert("Deleted " + data.deleted + " failed messages");
    queryClient.invalidateQueries({ queryKey: ["/api/admin/whatsapp-broadcasts"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/whatsapp-broadcasts/stats"] });
    setIsDeletingFailed(false);
  };
  const [filterTemplate, setFilterTemplate] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Column-specific filters
  const [colFilters, setColFilters] = useState<Record<string, string>>({});
  const [activeColFilter, setActiveColFilter] = useState<string | null>(null);

  const { data: templates = [] } = useQuery<any[]>({ queryKey: ["/api/admin/whatsapp-templates"] });

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = (ev.target?.result as string).trim().split("\n");
      const parsed = lines.slice(1).map(line => {
        const cols = line.split(",").map((c: string) => c.replace(/"/g, "").trim());
        return { name: cols[0] || "", phone: cols[1] || "" };
      }).filter((r: any) => r.phone.replace(/\D/g, "").length >= 10);
      setCsvContacts(parsed);
    };
    reader.readAsText(file);
  };

  const parseManualNumbers = (text: string) => { const lines = text.trim().split(/[\n,]+/); const parsed = lines.map(line => { const parts = line.trim().split(/\s+/); const phone = parts.find(p => p.replace(/\D/g,"").length >= 10)||""; const name = parts.filter(p => p.replace(/\D/g,"").length < 10).join(" ")||phone; return { name: name.trim()||phone, phone: phone.replace(/\D/g,"") }; }).filter(r => r.phone.length >= 10); setManualContacts(parsed); };
  const loadSavedContacts = async () => { try { const res = await fetch("/api/admin/whatsapp-contacts"); if (res.ok) { const data = await res.json(); setSavedContacts(data); setContactGroups(Array.from(new Set(data.map((c: any) => c.group).filter(Boolean))) as string[]); } } catch(e) {} setContactsLoaded(true); };
  const saveContact = async () => { if (!newContact.phone||!newContact.name) { alert("Name and phone required"); return; } await fetch("/api/admin/whatsapp-contacts", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(newContact) }); setNewContact({ name:"", phone:"", group:"", notes:"" }); setShowSaveContact(false); loadSavedContacts(); };
  const deleteContact = async (id: number) => { if (!confirm("Delete?")) return; await fetch(`/api/admin/whatsapp-contacts/${id}`, { method:"DELETE" }); loadSavedContacts(); };
  const handleAdminSend = async () => {
    if (!selectedTemplate) { alert("Please select a template"); return; }
    if (!campaignName) { alert("Please enter a campaign name"); return; }
    setIsSending(true); setSendResult(null);
    try {
      if (sendTab === "partners") {
        const res = await fetch("/api/admin/broadcast-partners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sendWhatsApp: true, sendEmail: false, partnerType, templateId: selectedTemplate.template_id, templateParams: [] }) });
        const data = await res.json();
        setSendResult(data);
      } else {
        const recipients = sendTab==="manual"?manualContacts:sendTab==="contacts"?(selectedGroup==="all"?savedContacts:savedContacts.filter((c:any)=>c.group===selectedGroup)):csvContacts;
        let sent = 0, failed = 0;
        for (const r of recipients) {
          const res = await fetch("/api/admin/whatsapp-send-single", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: r.phone, name: r.name, templateId: selectedTemplate.template_id, campaignName }) });
          if (res.ok) sent++; else failed++;
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        setSendResult({ success: true, results: { whatsapp: { sent, failed } } });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/admin/whatsapp-broadcasts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/whatsapp-broadcasts/stats"] });
    } catch (e: any) { setSendResult({ error: (e as any).message }); }
    setIsSending(false);
  };

  const { data: stats, refetch: refetchStats } = useQuery<any>({
    queryKey: ["/api/admin/whatsapp-broadcasts/stats"],
    refetchInterval: 30000,
  });

  const { data: messages = [], isLoading, refetch: refetchMessages } = useQuery<any[]>({
    queryKey: ["/api/admin/whatsapp-broadcasts"],
    refetchInterval: 30000,
  });

  const { data: replies = [], refetch: refetchReplies } = useQuery<any[]>({
    queryKey: ["/api/admin/whatsapp-broadcasts/replies"],
    refetchInterval: 15000,
  });

  const refetchAll = () => { refetchStats(); refetchMessages(); refetchReplies(); };

  // Get unique templates for filter
  const uniqueTemplates = Array.from(new Set((messages as any[]).map((m: any) => m.template_name).filter(Boolean)));

  const filtered = (messages as any[]).filter((m: any) => {
    if (filterStatus !== "all" && m.status !== filterStatus) return false;
    if (filterTemplate !== "all" && m.template_name !== filterTemplate) return false;
    if (search && !m.recipient_name?.toLowerCase().includes(search.toLowerCase()) && !m.recipient_phone?.includes(search)) return false;

    // Date range filter
    if (filterDateFrom) {
      const sentDate = formatDate(m.sent_at);
      if (sentDate < filterDateFrom) return false;
    }
    if (filterDateTo) {
      const sentDate = formatDate(m.sent_at);
      if (sentDate > filterDateTo) return false;
    }

    // Column-specific filters
    if (colFilters.recipient_name && !m.recipient_name?.toLowerCase().includes(colFilters.recipient_name.toLowerCase())) return false;
    if (colFilters.recipient_phone && !m.recipient_phone?.includes(colFilters.recipient_phone)) return false;
    if (colFilters.template_name && !m.template_name?.toLowerCase().includes(colFilters.template_name.toLowerCase())) return false;

    return true;
  });

  const activeFilterCount = [
    filterStatus !== "all",
    filterTemplate !== "all",
    filterDateFrom !== "",
    filterDateTo !== "",
    Object.values(colFilters).some(v => v !== ""),
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setFilterStatus("all");
    setFilterTemplate("all");
    setFilterDateFrom("");
    setFilterDateTo("");
    setColFilters({});
    setSearch("");
  };

  const exportCsv = () => {
    const headers = ["Phone", "Name", "Template", "Status", "Sent At", "Delivered At", "Read At", "Reply", "Replied At"];
    const rows = filtered.map((m: any) => [
      m.recipient_phone, m.recipient_name, m.template_name, m.status,
      formatTime(m.sent_at), formatTime(m.delivered_at), formatTime(m.read_at),
      m.reply_text || "", formatTime(m.replied_at)
    ].map((v: any) => `"${v}"`).join(","));
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `whatsapp_report_${filterDateFrom || "all"}_${filterDateTo || "dates"}.csv`;
    a.click();
  };

  const total = Number(stats?.total || 0);
  const delivered = Number(stats?.delivered || 0) + Number(stats?.read || 0);
  const read = Number(stats?.read || 0);
  const replied = Number(stats?.replied || 0);
  const failed = Number(stats?.failed || 0);

  const ColFilterPopup = ({ col, label }: { col: string; label: string }) => (
    <div className="relative inline-block">
      <button
        onClick={() => setActiveColFilter(activeColFilter === col ? null : col)}
        className={"p-0.5 rounded hover:bg-muted transition-colors " + (colFilters[col] ? "text-green-600" : "text-muted-foreground")}
      >
        <Filter className="w-3 h-3" />
      </button>
      {activeColFilter === col && (
        <div className="absolute top-6 left-0 z-50 bg-background border rounded-lg shadow-lg p-3 w-48">
          <div className="text-xs font-medium mb-2">Filter {label}</div>
          <Input
            autoFocus
            placeholder={`Filter ${label}...`}
            value={colFilters[col] || ""}
            onChange={e => setColFilters(prev => ({ ...prev, [col]: e.target.value }))}
            className="h-7 text-xs"
          />
          {colFilters[col] && (
            <button onClick={() => { setColFilters(prev => ({ ...prev, [col]: "" })); setActiveColFilter(null); }}
              className="text-xs text-red-500 hover:underline mt-1">Clear</button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-6" onClick={() => setActiveColFilter(null)}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-green-100">
            <MessageSquare className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">WhatsApp Broadcast Dashboard</h1>
            <p className="text-sm text-muted-foreground">Real-time delivery tracking and customer replies</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refetchAll}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={exportCsv}>
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Sent", value: total, color: "text-blue-600" },
          { label: "Delivered", value: delivered, color: "text-green-600" },
          { label: "Read", value: read, color: "text-teal-600" },
          { label: "Replied", value: replied, color: "text-orange-600" },
          { label: "Failed", value: failed, color: "text-red-600" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={"text-3xl font-bold mt-1 " + s.color}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(["send", "overview", "messages", "replies"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={"px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors " + (tab === t ? "border-green-600 text-green-600" : "border-transparent text-muted-foreground")}>
            {t}{t === "replies" && (replies as any[]).length > 0 ? ` (${(replies as any[]).length})` : ""}
          </button>
        ))}
      </div>

      {/* Send Tab */}
      {tab === "send" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Campaign setup</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Campaign name</label>
                <Input value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="e.g. March Solar Offer" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Select approved template</label>
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {(templates as any[]).length === 0 && (
                    <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">No templates yet. Go to <a href="/admin/whatsapp-settings" className="text-green-600 underline">WhatsApp Settings</a> to add.</div>
                  )}
                  {(templates as any[]).map((t: any) => (
                    <div key={t.id} onClick={() => setSelectedTemplate(t)} className={"p-3 rounded-lg border cursor-pointer transition-colors " + (selectedTemplate?.id === t.id ? "border-green-500 bg-green-50" : "border-border hover:bg-muted/50")}>
                      <div className="flex items-center justify-between">
                        <div><div className="text-sm font-medium">{t.template_name}</div><div className="text-xs text-muted-foreground font-mono">{t.template_id}</div></div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{t.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Recipients</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <button onClick={() => setSendTab("partners")} className={"flex-1 py-1.5 text-xs rounded-lg border transition-colors "+(sendTab==="partners"?"border-green-500 bg-green-50 text-green-700 font-medium":"border-border")}>All Partners</button>
                <button onClick={() => setSendTab("csv")} className={"flex-1 py-1.5 text-xs rounded-lg border transition-colors "+(sendTab==="csv"?"border-green-500 bg-green-50 text-green-700 font-medium":"border-border")}>CSV</button>
                <button onClick={() => setSendTab("manual")} className={"flex-1 py-1.5 text-xs rounded-lg border transition-colors "+(sendTab==="manual"?"border-green-500 bg-green-50 text-green-700 font-medium":"border-border")}>Paste Nos.</button>
                <button onClick={() => { setSendTab("contacts"); if (!contactsLoaded) loadSavedContacts(); }} className={"flex-1 py-1.5 text-xs rounded-lg border transition-colors "+(sendTab==="contacts"?"border-green-500 bg-green-50 text-green-700 font-medium":"border-border")}>Contacts</button>
              </div>
              {sendTab === "partners" && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Partner type</label>
                  <select value={partnerType} onChange={e => setPartnerType(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-background">
                    <option value="all">All Partners (BDP + DDP)</option>
                    <option value="bdp">BDP Only</option>
                    <option value="ddp">DDP Only</option>
                  </select>
                </div>
              )}
              {sendTab === "csv" && (
                <div>
                  <input type="file" accept=".csv" ref={fileRef} onChange={handleCsvUpload} className="hidden" />
                  <button onClick={() => fileRef.current?.click()} className="w-full py-6 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:bg-muted/50 transition-colors flex flex-col items-center gap-2">
                    <Upload className="w-5 h-5" />Upload CSV (Name, Phone columns)
                  </button>
                  {csvContacts.length > 0 && (
                    <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                      {csvContacts.slice(0, 5).map((r: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs px-2 py-1 bg-muted/50 rounded">
                          <span>{r.name || "Unknown"}</span><span className="font-mono text-muted-foreground">{r.phone}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {sendTab==="manual" && (<div className="space-y-2"><label className="text-sm font-medium block">Paste numbers (one per line or comma separated)</label><p className="text-xs text-muted-foreground">Format: Name 9876543210 or just 9876543210</p><textarea value={manualNumbers} onChange={e=>{ setManualNumbers(e.target.value); parseManualNumbers(e.target.value); }} placeholder={"Raju Kumar 9876543210\nSita Devi 9123456789"} className="w-full h-28 border rounded-md px-3 py-2 text-sm bg-background resize-none font-mono" />{manualContacts.length>0 && (<div className="bg-green-50 rounded p-2 text-xs text-green-700">✅ {manualContacts.length} valid numbers{manualContacts.slice(0,3).map((c,i)=><div key={i} className="flex justify-between"><span>{c.name}</span><span className="font-mono">{c.phone}</span></div>)}{manualContacts.length>3 && <div>+{manualContacts.length-3} more</div>}</div>)}</div>)}
              {sendTab==="contacts" && (<div className="space-y-2"><div className="flex items-center justify-between"><label className="text-sm font-medium">Saved Contacts ({savedContacts.length})</label><button onClick={()=>setShowSaveContact(!showSaveContact)} className="text-xs px-2 py-1 bg-green-600 text-white rounded">+ Add</button></div>{showSaveContact && (<div className="border rounded-lg p-3 space-y-2 bg-muted/30"><div className="grid grid-cols-2 gap-2"><input value={newContact.name} onChange={e=>setNewContact({...newContact,name:e.target.value})} placeholder="Name*" className="border rounded px-2 py-1.5 text-xs bg-background" /><input value={newContact.phone} onChange={e=>setNewContact({...newContact,phone:e.target.value})} placeholder="Phone*" className="border rounded px-2 py-1.5 text-xs bg-background font-mono" /><input value={newContact.group} onChange={e=>setNewContact({...newContact,group:e.target.value})} placeholder="Group (VIP, Leads...)" className="border rounded px-2 py-1.5 text-xs bg-background" /><input value={newContact.notes} onChange={e=>setNewContact({...newContact,notes:e.target.value})} placeholder="Notes" className="border rounded px-2 py-1.5 text-xs bg-background" /></div><div className="flex gap-2"><button onClick={saveContact} className="text-xs px-3 py-1.5 bg-green-600 text-white rounded">Save</button><button onClick={()=>setShowSaveContact(false)} className="text-xs px-3 py-1.5 border rounded">Cancel</button></div></div>)}{contactGroups.length>0 && (<select value={selectedGroup} onChange={e=>setSelectedGroup(e.target.value)} className="w-full border rounded px-2 py-1.5 text-xs bg-background"><option value="all">All Groups ({savedContacts.length})</option>{contactGroups.map(g=><option key={g} value={g}>{g} ({savedContacts.filter((c:any)=>c.group===g).length})</option>)}</select>)}<div className="max-h-36 overflow-y-auto space-y-1">{(selectedGroup==="all"?savedContacts:savedContacts.filter((c:any)=>c.group===selectedGroup)).map((c:any)=>(<div key={c.id} className="flex items-center justify-between text-xs px-2 py-1 bg-muted/50 rounded"><div><span className="font-medium">{c.name}</span>{c.group&&<span className="ml-1 text-muted-foreground">({c.group})</span>}</div><div className="flex items-center gap-2"><span className="font-mono text-muted-foreground">{c.phone}</span><button onClick={()=>deleteContact(c.id)} className="text-red-400 hover:text-red-600">✕</button></div></div>))}{savedContacts.length===0&&contactsLoaded&&<p className="text-xs text-muted-foreground text-center py-2">No contacts yet</p>}</div></div>)}
              {sendResult && (
                <div className={"p-3 rounded-lg text-sm " + (sendResult.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700")}>
                  {sendResult.error ? sendResult.error : <div><div className="font-medium">Sent!</div><div>WhatsApp: {sendResult.results?.whatsapp?.sent || 0} sent, {sendResult.results?.whatsapp?.failed || 0} failed</div></div>}
                </div>
              )}
              <button onClick={handleAdminSend} disabled={isSending || !selectedTemplate} className={"w-full py-2.5 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 " + (isSending || !selectedTemplate ? "bg-gray-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700")}>
                <Send className="w-4 h-4" />{isSending?"Sending...":sendTab==="partners"?"Send to All Partners":sendTab==="manual"?"Send to "+manualContacts.length+" numbers":sendTab==="contacts"?"Send to "+(selectedGroup==="all"?savedContacts.length:savedContacts.filter((c:any)=>c.group===selectedGroup).length)+" contacts":"Send to "+csvContacts.length+" contacts"}
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overview Tab */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Delivery funnel</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Sent", value: total, color: "bg-blue-500" },
                { label: "Delivered", value: delivered, color: "bg-green-500" },
                { label: "Read", value: read, color: "bg-teal-500" },
                { label: "Replied", value: replied, color: "bg-orange-500" },
              ].map(row => {
                const pct = total > 0 ? Math.round((row.value / total) * 100) : 0;
                return (
                  <div key={row.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-medium">{row.value} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div className={"h-2 rounded-full " + row.color} style={{ width: pct + "%" }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Recent replies</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(replies as any[]).slice(0, 5).map((r: any) => (
                <div key={r.id} className="flex gap-3 items-start border-b pb-3 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-medium text-green-700 flex-shrink-0">
                    {(r.recipient_name || r.recipient_phone || "").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{r.recipient_name || r.recipient_phone}</div>
                    <div className="text-xs text-muted-foreground truncate">{r.reply_text}</div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">{formatTime(r.replied_at)}</div>
                </div>
              ))}
              {(replies as any[]).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No replies yet</p>}
              {(replies as any[]).length > 0 && <button onClick={() => setTab("replies")} className="text-sm text-green-600 hover:underline">View all replies</button>}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Messages Tab */}
      {tab === "messages" && (
        <div className="space-y-4" onClick={e => e.stopPropagation()}>

          {/* Filter Bar */}
          <div className="flex gap-3 flex-wrap items-center">
            <Input placeholder="Search name or number..." value={search} onChange={e => setSearch(e.target.value)} className="w-52" />

            <button onClick={() => setShowFilters(!showFilters)}
              className={"flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border transition-colors " + (showFilters || activeFilterCount > 0 ? "border-green-500 bg-green-50 text-green-700" : "border-border hover:bg-muted/50")}>
              <Filter className="w-3.5 h-3.5" />
              Filters
              {activeFilterCount > 0 && <span className="bg-green-600 text-white text-xs rounded-full px-1.5">{activeFilterCount}</span>}
            </button>

            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} className="flex items-center gap-1 text-sm text-red-500 hover:underline">
                <X className="w-3.5 h-3.5" /> Clear all
              </button>
            )}

            <Badge variant="secondary">{filtered.length} messages</Badge>
            {(messages as any[]).some((m: any) => m.status === "failed") && (
              <button onClick={deleteAllFailed} disabled={isDeletingFailed}
                className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border border-red-200 text-red-600 hover:bg-red-50 ml-2">
                <Trash2 className="w-3.5 h-3.5" />{isDeletingFailed ? "Deleting..." : "Delete All Failed"}
              </button>
            )}
          </div>

          {/* Expanded Filter Panel */}
          {showFilters && (
            <Card className="border-green-200 bg-green-50/30">
              <CardContent className="pt-4 pb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background">
                      <option value="all">All Status</option>
                      <option value="sent">Sent</option>
                      <option value="delivered">Delivered</option>
                      <option value="read">Read</option>
                      <option value="replied">Replied</option>
                      <option value="clicked">Clicked</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>

                  {/* Template Filter */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Template</label>
                    <select value={filterTemplate} onChange={e => setFilterTemplate(e.target.value)}
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background">
                      <option value="all">All Templates</option>
                      {uniqueTemplates.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date From */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> From Date
                    </label>
                    <Input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                      className="text-sm" />
                  </div>

                  {/* Date To */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> To Date
                    </label>
                    <Input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                      className="text-sm" />
                  </div>
                </div>

                {/* Quick date buttons */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  <span className="text-xs text-muted-foreground self-center">Quick:</span>
                  {[
                    { label: "Today", days: 0 },
                    { label: "Yesterday", days: 1 },
                    { label: "Last 7 days", days: 7 },
                    { label: "Last 30 days", days: 30 },
                  ].map(({ label, days }) => (
                    <button key={label} onClick={() => {
                      const to = new Date();
                      const from = new Date();
                      from.setDate(from.getDate() - days);
                      setFilterDateFrom(from.toISOString().split("T")[0]);
                      setFilterDateTo(to.toISOString().split("T")[0]);
                    }} className="text-xs px-2 py-1 rounded border border-border hover:bg-muted/50 transition-colors">
                      {label}
                    </button>
                  ))}
                  <button onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); }}
                    className="text-xs px-2 py-1 rounded border border-border hover:bg-muted/50 transition-colors text-red-500">
                    Clear dates
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Table */}
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Recipient
                        <ColFilterPopup col="recipient_name" label="Name" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Phone
                        <ColFilterPopup col="recipient_phone" label="Phone" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Template
                        <ColFilterPopup col="template_name" label="Template" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Sent
                        {filterDateFrom && <span className="text-xs text-green-600 font-normal ml-1">{filterDateFrom}</span>}
                      </div>
                    </TableHead>
                    <TableHead>Delivered</TableHead>
                    <TableHead>Read</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Status
                        {filterStatus !== "all" && (
                          <span className={"text-xs px-1.5 py-0.5 rounded-full font-normal ml-1 " + (STATUS_COLORS[filterStatus] || "")}>{filterStatus}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Reply</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8">Loading...</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No messages found
                        {activeFilterCount > 0 && (
                          <button onClick={clearAllFilters} className="block mx-auto mt-2 text-sm text-green-600 hover:underline">Clear filters</button>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (filtered as any[]).map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium whitespace-nowrap">{m.recipient_name || "—"}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">{m.recipient_phone}</TableCell>
                      <TableCell className="text-xs max-w-[160px] truncate">{m.template_name || "—"}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{formatTime(m.sent_at)}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{formatTime(m.delivered_at)}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{formatTime(m.read_at)}</TableCell>
                      <TableCell>
                        <span className={"text-xs px-2 py-1 rounded-full font-medium " + (STATUS_COLORS[m.status] || STATUS_COLORS.sent)}>
                          {m.status}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-xs">{m.reply_text || "—"}</TableCell>
                      <TableCell>
                        <button onClick={() => deleteRecord(m.id)} disabled={deletingId === m.id}
                          className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filtered.length > 0 && (
              <div className="p-3 border-t text-xs text-muted-foreground flex justify-between items-center">
                <span>Showing {filtered.length} of {(messages as any[]).length} messages</span>
                <button onClick={exportCsv} className="flex items-center gap-1 text-green-600 hover:underline">
                  <Download className="w-3 h-3" /> Export filtered data
                </button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Replies Tab */}
      {tab === "replies" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{(replies as any[]).length} customers replied</p>
          {(replies as any[]).map((r: any) => (
            <Card key={r.id}>
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-sm font-medium text-green-700 flex-shrink-0">
                    {(r.recipient_name || r.recipient_phone || "").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <span className="font-medium text-sm">{r.recipient_name || "Unknown"}</span>
                        <span className="text-xs text-muted-foreground ml-2 font-mono">{r.recipient_phone}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatTime(r.replied_at)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">Template: {r.template_name || "—"} · Sent: {formatTime(r.sent_at)}</div>
                    <div className="bg-green-50 rounded-lg p-3 text-sm text-green-900 border border-green-100">
                      <div className="text-xs text-green-600 font-medium mb-1">Customer reply</div>
                      {r.reply_text}
                    </div>
                    {r.reply_text === "STOP" && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 rounded p-2">Opted out — remove from future campaigns</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(replies as any[]).length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No customer replies yet</CardContent></Card>
          )}
        </div>
      )}
    </div>
  );
}
