import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Users, Trash2, Search, RefreshCw, FolderOpen } from "lucide-react";

interface Contact {
  id: number;
  name: string;
  phone: string;
  group: string;
  notes: string;
  created_at: string;
}

export default function PartnerWhatsAppContacts() {
  const [group, setGroup] = useState("");
  const [contacts, setContacts] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvGroup, setCsvGroup] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");
  const { toast } = useToast();

  const API = "/api/partner/whatsapp-contacts";

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch(API, { credentials: "include" });
      if (res.ok) setAllContacts(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchContacts(); }, []);

  const groups = [...new Set(allContacts.map(c => c.group).filter(Boolean))].sort();
  const filtered = allContacts.filter(c => {
    const matchGroup = filterGroup === "all" || c.group === filterGroup;
    const matchSearch = !search || (c.name || "").toLowerCase().includes(search.toLowerCase()) || (c.phone || "").includes(search);
    return matchGroup && matchSearch;
  });

  const parseContacts = (text: string) => {
    return text.split("\n").filter(l => l.trim()).map(line => {
      const parts = line.split(/[,\t]+/).map(s => s.trim());
      let name = "", phone = "";
      if (parts.length >= 2) { name = parts[0]; phone = parts[1]; } else { phone = parts[0]; }
      return { name, phone };
    }).filter(c => c.phone.replace(/\D/g, "").length >= 10);
  };

  const handlePasteImport = async () => {
    if (!contacts.trim()) { toast({ title: "Error", description: "Please paste some contacts", variant: "destructive" }); return; }
    const parsed = parseContacts(contacts);
    if (parsed.length === 0) { toast({ title: "Error", description: "No valid contacts found", variant: "destructive" }); return; }
    setImporting(true);
    setProgress({ done: 0, total: parsed.length });
    let imported = 0, failed = 0;
    for (const c of parsed) {
      try {
        const res = await fetch(API, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: c.name, phone: c.phone, group: group || "Imported" }) });
        if (res.ok) imported++; else failed++;
      } catch { failed++; }
      setProgress(p => ({ ...p, done: p.done + 1 }));
    }
    toast({ title: "Import Complete", description: `Imported ${imported} contacts. Failed: ${failed}` });
    setContacts(""); setImporting(false); setProgress({ done: 0, total: 0 }); fetchContacts();
  };

  const handleCSVImport = async () => {
    if (!csvFile) { toast({ title: "Error", description: "Please select a CSV file", variant: "destructive" }); return; }
    const text = await csvFile.text();
    const lines = text.trim().split("\n");
    const headers = lines[0].toLowerCase().split(",").map(h => h.trim());
    const nameIdx = headers.findIndex(h => h.includes("name"));
    const phoneIdx = headers.findIndex(h => h.includes("phone") || h.includes("mobile") || h.includes("number"));
    if (phoneIdx === -1) { toast({ title: "Error", description: "CSV must have a phone/mobile/number column", variant: "destructive" }); return; }
    const parsed = lines.slice(1).filter(l => l.trim()).map(line => {
      const vals = line.split(",").map(v => v.trim());
      return { name: nameIdx >= 0 ? vals[nameIdx] || "" : "", phone: vals[phoneIdx] || "" };
    }).filter(c => c.phone.replace(/\D/g, "").length >= 10);
    if (parsed.length === 0) { toast({ title: "Error", description: "No valid contacts in CSV", variant: "destructive" }); return; }
    setImporting(true);
    setProgress({ done: 0, total: parsed.length });
    let imported = 0, failed = 0;
    for (const c of parsed) {
      try {
        const res = await fetch(API, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: c.name, phone: c.phone, group: csvGroup || "Imported" }) });
        if (res.ok) imported++; else failed++;
      } catch { failed++; }
      setProgress(p => ({ ...p, done: p.done + 1 }));
    }
    toast({ title: "CSV Import Complete", description: `Imported ${imported}. Failed: ${failed}` });
    setCsvFile(null); setCsvGroup(""); setImporting(false); setProgress({ done: 0, total: 0 }); fetchContacts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this contact?")) return;
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) { toast({ title: "Contact deleted" }); fetchContacts(); }
    } catch (e: any) { toast({ title: "Delete failed", variant: "destructive" }); }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">WhatsApp Contacts</h1>
        <p className="text-muted-foreground">Import and manage contacts for WhatsApp broadcasts</p>
        <div className="flex gap-4 mt-2">
          <Badge variant="secondary">{allContacts.length} Contacts</Badge>
          <Badge variant="secondary">{groups.length} Groups</Badge>
        </div>
      </div>
      <Tabs defaultValue="contacts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="contacts"><Users className="mr-2 h-4 w-4" />All Contacts</TabsTrigger>
          <TabsTrigger value="paste"><FileText className="mr-2 h-4 w-4" />Paste Import</TabsTrigger>
          <TabsTrigger value="csv"><Upload className="mr-2 h-4 w-4" />CSV Import</TabsTrigger>
        </TabsList>
        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div><CardTitle>All Contacts</CardTitle><CardDescription>View and manage saved contacts</CardDescription></div>
                <Button variant="outline" size="sm" onClick={fetchContacts}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
              </div>
              <div className="flex gap-3 mt-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search name or phone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)} className="border rounded-md px-3 py-2 text-sm bg-background min-w-[160px]">
                  <option value="all">All Groups ({allContacts.length})</option>
                  {groups.map(g => <option key={g} value={g}>{g} ({allContacts.filter(c => c.group === g).length})</option>)}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : filtered.length === 0 ? <p className="text-center py-8 text-muted-foreground">No contacts found. Import some!</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b bg-muted/50">
                      <th className="p-3 text-left text-xs font-semibold text-muted-foreground">#</th>
                      <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Name</th>
                      <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Phone</th>
                      <th className="p-3 text-left text-xs font-semibold text-muted-foreground">Group</th>
                      <th className="p-3 text-right text-xs font-semibold text-muted-foreground">Actions</th>
                    </tr></thead>
                    <tbody>
                      {filtered.map((c, i) => (
                        <tr key={c.id} className="border-b hover:bg-muted/30">
                          <td className="p-3 text-sm text-muted-foreground">{i + 1}</td>
                          <td className="p-3"><div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: `hsl(${(c.name||"U").charCodeAt(0)*37%360},60%,92%)`, color: `hsl(${(c.name||"U").charCodeAt(0)*37%360},60%,35%)` }}>{(c.name||"?")[0].toUpperCase()}</div>
                            <span className="font-medium text-sm">{c.name || "Unknown"}</span>
                          </div></td>
                          <td className="p-3 text-sm font-mono text-muted-foreground">+{c.phone}</td>
                          <td className="p-3"><Badge variant="secondary" className="gap-1"><FolderOpen className="h-3 w-3" />{c.group || "No Group"}</Badge></td>
                          <td className="p-3 text-right"><Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 text-xs text-muted-foreground">Showing {filtered.length} of {allContacts.length}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="paste">
          <Card>
            <CardHeader><CardTitle>Paste Contacts</CardTitle><CardDescription>One per line: "Name, Phone" or just "Phone"</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Group Name</Label><Input placeholder="e.g., My Customers" value={group} onChange={e => setGroup(e.target.value)} /></div>
              <div className="space-y-2"><Label>Contacts</Label><Textarea placeholder={"John Doe, 9876543210\nJane, 9876543211\n9876543212"} value={contacts} onChange={e => setContacts(e.target.value)} className="min-h-[300px] font-mono" /></div>
              {contacts.trim() && <div className="rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-300">{parseContacts(contacts).length} valid contacts detected</div>}
              {importing && progress.total > 0 && <div className="space-y-2"><div className="flex justify-between text-sm"><span>Importing...</span><span>{progress.done}/{progress.total}</span></div><div className="w-full bg-muted rounded-full h-2"><div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${(progress.done/progress.total)*100}%` }} /></div></div>}
              <div className="rounded-md bg-muted p-3 text-sm"><strong>Formats:</strong> Name, Phone | Tab-separated | Phone only</div>
              <Button onClick={handlePasteImport} disabled={importing} className="w-full"><Users className="mr-2 h-4 w-4" />{importing ? `Importing ${progress.done}/${progress.total}...` : "Import Contacts"}</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="csv">
          <Card>
            <CardHeader><CardTitle>Upload CSV</CardTitle><CardDescription>CSV with name and phone columns</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Group Name</Label><Input placeholder="e.g., Customer List" value={csvGroup} onChange={e => setCsvGroup(e.target.value)} /></div>
              <div className="space-y-2"><Label>CSV File</Label><Input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files?.[0] || null)} /></div>
              {importing && progress.total > 0 && <div className="space-y-2"><div className="flex justify-between text-sm"><span>Importing...</span><span>{progress.done}/{progress.total}</span></div><div className="w-full bg-muted rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${(progress.done/progress.total)*100}%` }} /></div></div>}
              <div className="rounded-md bg-muted p-3 text-sm"><strong>Format:</strong><pre className="mt-1 text-xs">name,phone{"\n"}John,9876543210</pre></div>
              <Button onClick={handleCSVImport} disabled={importing || !csvFile} className="w-full"><Upload className="mr-2 h-4 w-4" />{importing ? `Importing ${progress.done}/${progress.total}...` : "Import CSV"}</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
