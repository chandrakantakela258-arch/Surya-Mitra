import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Search, Send, Download, Loader2, Plus, Trash2 } from "lucide-react";

interface MeterRow {
  key: string;
  customerSearch: string;
  customerResults: any[];
  customerId: number | null;
  customerName: string;
  consumerNumber: string;
  location: string;
  plantCapacity: string;
  phase: string;
  meterSerialNo: string;
  meterMake: string;
}

function emptyRow(): MeterRow {
  return {
    key: Math.random().toString(36).slice(2),
    customerSearch: "", customerResults: [], customerId: null,
    customerName: "", consumerNumber: "", location: "", plantCapacity: "",
    phase: "Single Phase",
    meterSerialNo: "", meterMake: "Secure Meter Limited",
  };
}

export default function MeterTesting() {
  const { toast } = useToast();
  const [discom, setDiscom] = useState("SBPDCL");
  const [rows, setRows] = useState<MeterRow[]>([emptyRow()]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingNo, setEditingNo] = useState<string>("");
  const [letters, setLetters] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const timeouts = useRef<Record<string, NodeJS.Timeout>>({});

  const loadLetters = () => {
    fetch("/api/meter-testing/list").then(r => r.json()).then(setLetters).catch(console.error);
  };
  useEffect(() => { loadLetters(); }, []);

  function updateRow(key: string, patch: Partial<MeterRow>) {
    setRows(prev => prev.map(r => r.key === key ? { ...r, ...patch } : r));
  }

  function addRow() {
    setRows(prev => [...prev, emptyRow()]);
  }

  function removeRow(key: string) {
    setRows(prev => {
      const filtered = prev.filter(r => r.key !== key);
      return filtered.length === 0 ? [emptyRow()] : filtered;
    });
  }

  function onCustomerSearchChange(key: string, value: string) {
    updateRow(key, { customerSearch: value });
    if (timeouts.current[key]) clearTimeout(timeouts.current[key]);
    if (value.length < 2) { updateRow(key, { customerResults: [] }); return; }
    timeouts.current[key] = setTimeout(() => {
      fetch(`/api/billing/customers/search?q=${encodeURIComponent(value)}`)
        .then(r => r.json())
        .then(d => updateRow(key, { customerResults: d.customers || [] }));
    }, 300);
  }

  function selectCustomerForRow(key: string, c: any) {
    updateRow(key, {
      customerId: c.id,
      customerName: c.name || "",
      consumerNumber: c.consumer_number || "",
      location: [c.address, c.district, c.state].filter(Boolean).join(", "),
      plantCapacity: c.plant_capacity ? String(c.plant_capacity) : "",
      customerSearch: c.name || "",
      customerResults: [],
    });
  }

  async function loadForEdit(id: number, letterNo: string) {
    try {
      const r = await fetch(`/api/meter-testing/${id}`);
      if (!r.ok) throw new Error("Could not load letter");
      const L = await r.json();
      const items = Array.isArray(L.items) && L.items.length ? L.items : [{
        customer_id: L.customer_id, customer_name: L.customer_name, consumer_number: L.consumer_number,
        location: L.location, plant_capacity: L.plant_capacity, phase: "Single Phase",
        meter_serial_no: L.meter_serial_no, meter_make: L.meter_make }];
      setRows(items.map((it: any) => ({ ...emptyRow(),
        customerId: it.customer_id || null, customerName: it.customer_name || "",
        consumerNumber: it.consumer_number || "", location: it.location || "",
        plantCapacity: it.plant_capacity ? String(it.plant_capacity) : "",
        phase: it.phase || "Single Phase",
        meterSerialNo: it.meter_serial_no || "", meterMake: it.meter_make || "Secure Meter Limited" })));
      if (L.discom) setDiscom(L.discom);
      setEditingId(id); setEditingNo(letterNo);
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast({ title: "Editing " + letterNo, description: `${items.length} meter(s) loaded` });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  }

  function cancelEdit() { setEditingId(null); setEditingNo(""); setRows([emptyRow()]); }

  const handleGenerate = async () => {
    const invalid = rows.some(r => !r.meterSerialNo || !r.meterMake);
    if (invalid) {
      toast({ title: "Error", description: "Fill meter serial no & make for every row", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const items = rows.map(r => ({
        customer_id: r.customerId, customer_name: r.customerName, consumer_number: r.consumerNumber,
        location: r.location, plant_capacity: r.plantCapacity, phase: r.phase,
        meter_serial_no: r.meterSerialNo, meter_make: r.meterMake,
      }));
      let blob: Blob;
      if (editingId) {
        const up = await fetch(`/api/meter-testing/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ discom, items }),
        });
        if (!up.ok) { const e = await up.json(); throw new Error(e.error || "Update failed"); }
        const pr = await fetch(`/api/meter-testing/${editingId}/pdf`);
        if (!pr.ok) throw new Error("PDF generation failed");
        blob = await pr.blob();
      } else {
        const res = await fetch("/api/meter-testing/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ discom, items }),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
        blob = await res.blob();
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = (editingNo || "meter_testing_letter").replace(/\//g, "_") + ".pdf"; a.click();
      URL.revokeObjectURL(url);
      toast({ title: editingId ? `${editingNo} updated` : "Letter generated", description: `${items.length} meter(s)` });
      setRows([emptyRow()]); setEditingId(null); setEditingNo("");
      loadLetters();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSendEmail = async (id: number) => {
    setSendingId(id);
    try {
      const res = await fetch(`/api/meter-testing/${id}/send-email`, { method: "POST" });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      toast({ title: "Email sent" });
      loadLetters();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6" /> Meter Testing Letter</h1>
        <p className="text-sm text-muted-foreground">Generate & send solar net meter testing request letters — supports multiple customers/meters in one letter</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Letter Details</CardTitle>
          <Button size="sm" variant="outline" onClick={addRow}><Plus className="w-3 h-3 mr-1" /> Add Meter/Customer</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">DISCOM</Label>
            <Select value={discom} onValueChange={setDiscom}>
              <SelectTrigger className="w-48 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SBPDCL">SBPDCL</SelectItem>
                <SelectItem value="NBPDCL">NBPDCL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {rows.map((r, idx) => (
            <div key={r.key} className="border rounded-lg p-3 space-y-3 relative bg-accent/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Entry #{idx + 1}</span>
                {rows.length > 1 && (
                  <Button size="sm" variant="ghost" onClick={() => removeRow(r.key)} className="h-6 w-6 p-0 text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Plant Capacity (kW)</Label>
                  <Input value={r.plantCapacity} onChange={e => updateRow(r.key, { plantCapacity: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Phase</Label>
                  <Select value={r.phase} onValueChange={v => updateRow(r.key, { phase: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single Phase">Single Phase</SelectItem>
                      <SelectItem value="Three Phase">Three Phase</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Meter Serial No.</Label>
                  <Input value={r.meterSerialNo} onChange={e => updateRow(r.key, { meterSerialNo: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Meter Make</Label>
                  <Input value={r.meterMake} onChange={e => updateRow(r.key, { meterMake: e.target.value })} placeholder="e.g. Secure Meter Limited" />
                </div>
              </div>
            </div>
          ))}

          <Button onClick={handleGenerate} disabled={generating} className="w-full">
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {editingId ? `Update ${editingNo}` : "Generate & Download Letter"} ({rows.length} {rows.length === 1 ? "entry" : "entries"})
          </Button>
          {editingId && (
            <Button variant="ghost" size="sm" onClick={cancelEdit} className="w-full mt-1 text-xs">
              Cancel edit &mdash; start a new letter
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Letter History</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-xs text-muted-foreground">
              <th className="text-left pb-2">Letter No.</th>
              <th className="text-left pb-2">DISCOM</th>
              <th className="text-left pb-2">Meters</th>
              <th className="text-left pb-2">Status</th>
              <th className="text-right pb-2">Action</th>
            </tr></thead>
            <tbody>
              {letters.length > 0 ? letters.map(l => {
                const itemCount = Array.isArray(l.items) ? l.items.length : 1;
                return (
                  <tr key={l.id} className="border-b">
                    <td className="py-2 font-medium">{l.letter_no}</td>
                    <td className="py-2">{l.discom}</td>
                    <td className="py-2">{itemCount} meter{itemCount === 1 ? "" : "s"}</td>
                    <td className="py-2">{l.sent_at ? <span className="text-green-600">Sent</span> : <span className="text-muted-foreground">Not sent</span>}</td>
                    <td className="py-2 text-right">
                      <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="outline" onClick={() => loadForEdit(l.id, l.letter_no)}>Edit</Button>
                      <Button size="sm" variant="outline" asChild>
                        <a href={`/api/meter-testing/${l.id}/pdf`} target="_blank" rel="noreferrer">PDF</a>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleSendEmail(l.id)} disabled={sendingId === l.id}>
                        {sendingId === l.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                        {l.sent_at ? "Resend" : "Send Email"}
                      </Button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No letters generated yet</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
