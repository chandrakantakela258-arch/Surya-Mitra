import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Loader2, Search, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Row = {
  key: string; meterSerialNo: string; meterMake: string; phase: string;
  customerId: number | null; consumerName: string; caNo: string;
  division: string; subDivision: string; appNo: string;
  search: string; results: any[];
};

export default function MeterUtilization() {
  const { toast } = useToast();
  const [letters, setLetters] = useState<any[]>([]);
  const [issued, setIssued] = useState<any[]>([]);
  const [letterId, setLetterId] = useState<string>("");
  const [circle, setCircle] = useState("");
  const [mrt, setMrt] = useState("");
  const [ref1No, setRef1No] = useState("149");
  const [ref1Date, setRef1Date] = useState("22/05/2025");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);

  const reload = () => {
    fetch("/api/meter-utilization/testing-letters").then(r => r.json()).then(setLetters).catch(() => {});
    fetch("/api/meter-utilization/list").then(r => r.json()).then(setIssued).catch(() => {});
  };
  useEffect(reload, []);

  async function pickLetter(id: string) {
    setLetterId(id);
    try {
      const r = await fetch(`/api/meter-testing/${id}`);
      const L = await r.json();
      const items = Array.isArray(L.items) && L.items.length ? L.items : [];
      setRows(items.map((it: any, i: number) => ({
        key: String(i) + Math.random().toString(36).slice(2),
        meterSerialNo: it.meter_serial_no || "", meterMake: it.meter_make || "",
        phase: it.phase || "Single Phase",
        customerId: it.customer_id || null, consumerName: it.customer_name || "",
        caNo: it.ca_no || it.consumer_number || "", division: it.division || "",
        subDivision: it.sub_division || "", appNo: it.app_no || "",
        search: "", results: [],
      })));
      if (!items.length) toast({ title: "No meters stored", description: "This letter has no saved meter list", variant: "destructive" });
    } catch { toast({ title: "Error", description: "Could not load that letter", variant: "destructive" }); }
  }

  const upd = (key: string, patch: Partial<Row>) =>
    setRows(prev => prev.map(r => r.key === key ? { ...r, ...patch } : r));

  function onSearch(key: string, v: string) {
    upd(key, { search: v });
    if (v.trim().length < 2) { upd(key, { results: [] }); return; }
    fetch("/api/meter-utilization/customer-search?q=" + encodeURIComponent(v))
      .then(r => r.json()).then(d => upd(key, { results: Array.isArray(d) ? d : [] })).catch(() => {});
  }

  function choose(key: string, c: any) {
    upd(key, {
      customerId: c.id, consumerName: c.name || "",
      caNo: c.ca_number || c.consumer_number || "",
      division: c.division || "", subDivision: c.sub_division || "",
      search: "", results: [],
    });
  }

  const payloadItems = () => rows.map(r => ({
    meter_serial_no: r.meterSerialNo, meter_make: r.meterMake, phase: r.phase,
    customer_id: r.customerId, customer_name: r.consumerName, consumer_name: r.consumerName,
    ca_no: r.caNo, division: r.division, sub_division: r.subDivision, app_no: r.appNo,
  }));

  async function saveLinks() {
    if (!letterId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/meter-testing/${letterId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payloadItems() }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Save failed"); }
      toast({ title: "Saved", description: "Customer details stored against each meter" });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  }

  async function generate() {
    if (!letterId) { toast({ title: "Pick a testing letter first", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/meter-utilization/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testing_letter_id: Number(letterId), circle, mrt, ref1_no: ref1No, ref1_date: ref1Date, items: payloadItems() }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "meter_utilization_certificate.pdf"; a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Certificate generated", description: `${rows.length} meter(s)` });
      reload();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  }

  const sel = letters.find(l => String(l.id) === letterId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-orange-500" />Meter Utilization Certificate
        </h1>
        <p className="text-sm text-muted-foreground">Annexure-II — 80% or more utilization report of a previously tested lot</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Letter Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Meter Testing Letter (reference)</Label>
              <Select value={letterId} onValueChange={pickLetter}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select a testing letter" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {letters.map(l => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      {l.letter_no} — {l.discom} — {l.meters} meter(s)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Circle</Label><Input value={circle} onChange={e => setCircle(e.target.value)} placeholder="e.g. PESU West" className="h-9 text-xs" /></div>
            <div><Label className="text-xs">MRT</Label><Input value={mrt} onChange={e => setMrt(e.target.value)} placeholder="e.g. PESU West" className="h-9 text-xs" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Ref Letter No.</Label><Input value={ref1No} onChange={e => setRef1No(e.target.value)} className="h-9 text-xs" /></div>
              <div><Label className="text-xs">Ref Date</Label><Input value={ref1Date} onChange={e => setRef1Date(e.target.value)} className="h-9 text-xs" /></div>
            </div>
          </div>
          {sel && (
            <p className="text-xs text-muted-foreground">
              Certificate will cite <strong>{sel.letter_no}</strong> dated {sel.letter_date} ({sel.discom})
            </p>
          )}
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Meters ({rows.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {rows.map((r, idx) => (
              <div key={r.key} className="border rounded-lg p-3 space-y-2 bg-orange-50/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">#{idx + 1} — {r.meterSerialNo} ({r.meterMake})</span>
                  <Select value={r.phase} onValueChange={v => upd(r.key, { phase: v })}>
                    <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single Phase">Single Phase</SelectItem>
                      <SelectItem value="Three Phase">Three Phase</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <Label className="text-xs">Attach Customer</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-8 h-9 text-xs" value={r.search} onChange={e => onSearch(r.key, e.target.value)} placeholder="Search by name, consumer no. or CA no." />
                  </div>
                  {r.results.length > 0 && (
                    <div className="absolute z-10 w-full bg-white dark:bg-gray-900 border rounded-md shadow-lg mt-1 max-h-56 overflow-auto">
                      {r.results.map((c: any) => (
                        <div key={c.id} className="p-2 hover:bg-accent cursor-pointer text-xs" onClick={() => choose(r.key, c)}>
                          <div className="font-medium">{c.name}</div>
                          <div className="text-muted-foreground">CN: {c.consumer_number || "—"} {c.division ? "| " + c.division : ""}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <div><Label className="text-xs">Consumer Name</Label><Input value={r.consumerName} onChange={e => upd(r.key, { consumerName: e.target.value })} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">CA No.</Label><Input value={r.caNo} onChange={e => upd(r.key, { caNo: e.target.value })} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Division</Label><Input value={r.division} onChange={e => upd(r.key, { division: e.target.value })} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Sub-Division</Label><Input value={r.subDivision} onChange={e => upd(r.key, { subDivision: e.target.value })} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">PM Surya Ghar App No.</Label><Input value={r.appNo} onChange={e => upd(r.key, { appNo: e.target.value })} className="h-8 text-xs" /></div>
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" onClick={saveLinks} disabled={busy} className="flex-1">
                <Save className="w-4 h-4 mr-2" />Save customer details to testing letter
              </Button>
              <Button onClick={generate} disabled={busy} className="flex-1">
                {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Generate &amp; Download Certificate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Issued Certificates</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-xs text-muted-foreground">
              <th className="text-left pb-2">Certificate No.</th>
              <th className="text-left pb-2">Against Testing Letter</th>
              <th className="text-left pb-2">Meters</th>
              <th className="text-left pb-2">Issued</th>
            </tr></thead>
            <tbody>
              {issued.length ? issued.map(x => (
                <tr key={x.id} className="border-b">
                  <td className="py-2 font-medium">{x.letter_no}</td>
                  <td className="py-2">{x.testing_letter_no}</td>
                  <td className="py-2">{x.meters}</td>
                  <td className="py-2">{x.issued}</td>
                </tr>
              )) : <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No certificates issued yet</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
