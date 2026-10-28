import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Download, Loader2 } from "lucide-react";

const inr = (n: number) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dt = (s: string) => s ? new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "";
const drcr = (n: number) => (n >= 0 ? inr(n) + " Dr" : inr(-n) + " Cr");

export default function Ledger() {
  const [type, setType] = useState<"customer" | "vendor">("customer");
  const [parties, setParties] = useState<any[]>([]);
  const [partyId, setPartyId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setParties([]); setPartyId(""); setData(null);
    fetch("/api/billing/ledger/parties?type=" + type)
      .then(r => r.json()).then(d => setParties(Array.isArray(d) ? d : [])).catch(() => {});
  }, [type]);

  async function run() {
    if (!partyId) { setErr("Select a party first"); return; }
    setBusy(true); setErr(""); setData(null);
    try {
      const qs = new URLSearchParams();
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      const r = await fetch(`/api/billing/ledger/${type}/${partyId}?` + qs.toString());
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not build ledger");
      setData(d);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-orange-500" />Generate Ledger
        </h1>
        <p className="text-sm text-muted-foreground">
          Statement of account — approved GST invoices, credit notes and payments only
        </p>
      </div>

      <Card className="print:hidden">
        <CardHeader className="pb-3"><CardTitle className="text-base">Select Party</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <Label className="text-xs">Ledger Of</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="vendor">Vendor / Supplier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">{type === "vendor" ? "Vendor" : "Customer"} ({parties.length})</Label>
              <Select value={partyId} onValueChange={setPartyId}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select party…" /></SelectTrigger>
                <SelectContent className="max-h-80">
                  {parties.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}{p.phone ? " — " + p.phone : ""}{p.docs ? "  (" + p.docs + ")" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">From (optional)</Label>
              <Input type="date" className="h-9 text-xs" value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To (optional)</Label>
              <Input type="date" className="h-9 text-xs" value={to} onChange={e => setTo(e.target.value)} />
            </div>
          </div>
          {err && <div className="text-sm text-red-600 mt-3">{err}</div>}
          <div className="flex gap-2 mt-4">
            <Button onClick={run} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookOpen className="w-4 h-4 mr-2" />}
              Generate Ledger
            </Button>
            {data && (
              <Button variant="outline" asChild>
                <a href={`/api/billing/ledger/${type}/${partyId}/pdf?` +
                         new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString()}
                   target="_blank" rel="noreferrer">
                  <Download className="w-4 h-4 mr-2" />Download Official PDF
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {data && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="text-lg">{data.party.name}</CardTitle>
                <div className="text-xs text-muted-foreground mt-1">
                  {data.party.phone && <span>{data.party.phone}</span>}
                  {data.party.gstin && <span> · GSTIN: {data.party.gstin}</span>}
                  {data.party.city && <span> · {data.party.city}</span>}
                </div>
                <div className="text-xs text-muted-foreground">
                  Statement of Account{data.from ? " from " + dt(data.from) : ""}{data.to ? " to " + dt(data.to) : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground uppercase font-semibold">Closing Balance</div>
                <div className={"text-2xl font-bold " + (data.closing > 0 ? "text-red-600" : "text-green-700")}>
                  {drcr(data.closing)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {data.closing > 0
                    ? (type === "vendor" ? "payable to vendor" : "receivable from customer")
                    : data.closing < 0 ? "advance / excess" : "settled"}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 text-xs text-muted-foreground">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Particulars</th>
                    <th className="text-left py-2">Reference</th>
                    <th className="text-right py-2">Debit</th>
                    <th className="text-right py-2">Credit</th>
                    <th className="text-right py-2">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b bg-muted/40">
                    <td className="py-2" colSpan={3}><span className="font-semibold">Opening Balance</span></td>
                    <td /><td />
                    <td className="py-2 text-right font-semibold">{drcr(data.opening)}</td>
                  </tr>
                  {data.lines.length ? data.lines.map((l: any, i: number) => (
                    <tr key={i} className="border-b">
                      <td className="py-2 whitespace-nowrap">{dt(l.dt)}</td>
                      <td className="py-2">{l.kind}{l.payment_mode ? " (" + l.payment_mode + ")" : ""}</td>
                      <td className="py-2 font-mono text-xs">{l.ref || "—"}</td>
                      <td className="py-2 text-right">{l.debit ? inr(l.debit) : ""}</td>
                      <td className="py-2 text-right">{l.credit ? inr(l.credit) : ""}</td>
                      <td className="py-2 text-right font-medium">{drcr(l.balance)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No approved GST invoices or payments in this period
                    </td></tr>
                  )}
                  <tr className="border-t-2 font-bold">
                    <td className="py-2" colSpan={3}>Total</td>
                    <td className="py-2 text-right">{inr(data.total_debit)}</td>
                    <td className="py-2 text-right">{inr(data.total_credit)}</td>
                    <td className="py-2 text-right">{drcr(data.closing)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Includes approved GST invoices only. Draft, proforma, quotation and cancelled documents are excluded.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
