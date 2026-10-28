import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Store, MapPin, Phone, RefreshCw, ExternalLink } from "lucide-react";

const STAGES = [
  { k: "", label: "— not started —" },
  { k: "logged_in", label: "Logged in on PM Surya Ghar" },
  { k: "loan_processed", label: "Loan processed" },
  { k: "loan_disbursed", label: "Loan disbursed" },
  { k: "installed", label: "Plant installed" },
  { k: "subsidy_received", label: "Subsidy received" },
];

export default function ShopPartnerLeads() {
  const [rows, setRows] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState("");

  async function setStage(token: string, progress: string) {
    setSaving(token);
    try {
      const r = await fetch("/api/admin/shop-customer/" + token, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Failed");
      setRows(p => p.map(x => x.token === token ? { ...x, progress: progress || null } : x));
    } catch (e: any) { alert("Could not update stage: " + e.message); }
    finally { setSaving(""); }
  }

  function load() {
    setBusy(true);
    Promise.all([
      fetch("/api/admin/shop-partner-leads").then(r => r.json()).catch(() => []),
      fetch("/api/admin/shop-leads").then(r => r.json()).catch(() => []),
    ]).then(([l, s]) => {
      setRows(Array.isArray(l) ? l : []);
      setShops(Array.isArray(s) ? s : []);
    }).finally(() => setBusy(false));
  }
  useEffect(load, []);

  const fil = rows.filter(r => {
    if (q.trim().length < 2) return true;
    const t = [r.name, r.phone, r.shop_name, r.shop_owner, r.visit_address, r.consumer_number]
      .filter(Boolean).join(" ").toLowerCase();
    return t.includes(q.toLowerCase());
  });
  const filled = rows.filter(r => r.status === "filled").length;
  const d = (s: string) => s ? new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Store className="h-6 w-6 text-orange-500" />Shop Partner Leads
          </h1>
          <p className="text-sm text-muted-foreground">
            Surya Urja Kranti — customers added by shop partners, and the details they filled
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={busy}>
          <RefreshCw className={"w-4 h-4 mr-2 " + (busy ? "animate-spin" : "")} />Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{ l: "Shop Partners", v: shops.length },
          { l: "Customers Added", v: rows.length },
          { l: "Details Filled", v: filled },
          { l: "Pending", v: rows.length - filled }].map((c, i) => (
          <Card key={i}><CardContent className="pt-5 pb-4">
            <div className="text-xs text-muted-foreground font-semibold uppercase">{c.l}</div>
            <div className="text-2xl font-bold text-foreground">{c.v}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Shop Partners</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-xs text-muted-foreground">
                <th className="text-left pb-2">Shop</th>
                <th className="text-left pb-2">Owner</th>
                <th className="text-right pb-2">Added</th>
                <th className="text-right pb-2 pr-3">Filled</th>
                <th className="text-right pb-2 pr-3">Installed</th>
                <th className="text-left pb-2">Last</th>
                <th className="text-left pb-2">Shop Location</th>
                <th className="text-left pb-2">Dashboard</th>
              </tr></thead>
              <tbody>
                {shops.length ? shops.map((s, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2 font-medium">{s.shop_name}</td>
                    <td className="py-2 text-muted-foreground">{s.shop_owner || "—"}</td>
                    <td className="py-2 text-right font-bold">{s.leads}</td>
                    <td className="py-2 text-right pr-3 text-green-700 font-semibold">{s.filled}</td>
                    <td className="py-2 text-right pr-3 text-blue-700 font-semibold">{s.installed || 0}</td>
                    <td className="py-2 text-muted-foreground whitespace-nowrap">{d(s.last_lead)}</td>
                    <td className="py-2">
                      {s.lat && s.lng
                        ? <a className="text-blue-600 hover:underline inline-flex items-center gap-1"
                            href={`https://www.google.com/maps?q=${s.lat},${s.lng}`} target="_blank" rel="noreferrer">
                            <MapPin className="w-3 h-3" />Map</a>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="py-2">
                      <a className="text-blue-600 hover:underline inline-flex items-center gap-1"
                        href={`/shop/${s.shop_token}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-3 h-3" />Open</a>
                    </td>
                  </tr>
                )) : <tr><td colSpan={8} className="py-6 text-center text-muted-foreground">No shop partners yet</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Customers ({fil.length})</CardTitle>
            <Input className="h-9 max-w-xs text-xs" placeholder="Search name, phone, shop…"
              value={q} onChange={e => setQ(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-xs text-muted-foreground">
                <th className="text-left pb-2">Added</th>
                <th className="text-left pb-2">Status</th>
                <th className="text-left pb-2">Customer</th>
                <th className="text-left pb-2">WhatsApp</th>
                <th className="text-left pb-2">Consumer No.</th>
                <th className="text-left pb-2">Address</th>
                <th className="text-left pb-2">Shop</th>
                <th className="text-left pb-2">Home</th>
                <th className="text-left pb-2">Application Stage</th>
              </tr></thead>
              <tbody>
                {fil.length ? fil.map(r => (
                  <tr key={r.token} className="border-b align-top">
                    <td className="py-2 whitespace-nowrap text-muted-foreground">{d(r.created_at)}</td>
                    <td className="py-2 whitespace-nowrap">
                      {r.status === "filled"
                        ? <span className="text-green-700 font-semibold">✓ Filled</span>
                        : <span className="text-orange-600 font-semibold">⏳ Pending</span>}
                    </td>
                    <td className="py-2 font-medium">{r.name || "—"}</td>
                    <td className="py-2 whitespace-nowrap">
                      <a className="text-blue-600 hover:underline inline-flex items-center gap-1" href={`tel:${r.phone}`}>
                        <Phone className="w-3 h-3" />{r.phone}</a>
                    </td>
                    <td className="py-2">{r.consumer_number || "—"}</td>
                    <td className="py-2 max-w-xs">{r.visit_address || "—"}</td>
                    <td className="py-2">
                      <div className="font-medium">{r.shop_name}</div>
                      {r.shop_owner && <div className="text-xs text-muted-foreground">{r.shop_owner}</div>}
                    </td>
                    <td className="py-2">
                      {r.cust_lat && r.cust_lng
                        ? <a className="text-blue-600 hover:underline inline-flex items-center gap-1"
                            href={`https://www.google.com/maps?q=${r.cust_lat},${r.cust_lng}`} target="_blank" rel="noreferrer">
                            <MapPin className="w-3 h-3" />Map</a>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="py-2">
                      <select value={r.progress || ""} disabled={r.status !== "filled" || saving === r.token}
                        onChange={e => setStage(r.token, e.target.value)}
                        className="border rounded-md px-2 py-1 text-xs bg-white disabled:opacity-50 max-w-[190px]">
                        {STAGES.map(s => <option key={s.k} value={s.k}>{s.label}</option>)}
                      </select>
                    </td>
                  </tr>
                )) : <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">No customers found</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
