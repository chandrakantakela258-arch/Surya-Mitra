import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, ArrowLeft, Loader2, ChevronDown, ChevronRight, Search, ShoppingCart, Download, Mail, Send } from "lucide-react";

function uid() { return Math.random().toString(36).slice(2, 9); }
function fmt(n: number) { return "\u20B9" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

const STATES = [
  { code: "01", name: "Jammu & Kashmir" },{ code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },{ code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },{ code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },{ code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },{ code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },{ code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },{ code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },{ code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },{ code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },{ code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
];

interface Item {
  key: string; pid: number | null; desc: string; hsn: string;
  qty: number; unit: string; rate: number; disc: number; gst: number;
}

function blank(): Item {
  return { key: uid(), pid: null, desc: "", hsn: "", qty: 1, unit: "Nos", rate: 0, disc: 0, gst: 12 };
}

function total(i: Item) {
  const g = i.qty * i.rate;
  const d = g * i.disc / 100;
  const t = g - d;
  return { taxable: t, tax: t * i.gst / 100, grand: t + t * i.gst / 100 };
}

export default function PurchaseOrderForm() {
  const [, nav] = useLocation();
  const [cos, setCos] = useState<any[]>([]);
  const [segs, setSegs] = useState<Record<string, any[]>>({});
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [prods, setProds] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorResults, setVendorResults] = useState<any[]>([]);
  const [showVendorDrop, setShowVendorDrop] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [coId, setCoId] = useState(1);
  const [poDate, setPoDate] = useState(new Date().toISOString().split("T")[0]);
  const [delDate, setDelDate] = useState("");
  const [items, setItems] = useState<Item[]>([blank()]);
  const [notes, setNotes] = useState("");
  const [v, setV] = useState({ name: "", phone: "", email: "", gstin: "", addr: "", state: "Bihar", sc: "10" });

  useEffect(() => {
    Promise.all([
      fetch("/api/billing/companies").then(r => r.json()),
      fetch("/api/billing/products").then(r => r.json()),
      fetch("/api/billing/products/segments").then(r => r.json()).catch(() => ({ segments: {} })),
    ]).then(([c, p, s]) => {
      setCos(c); setProds(p);
      if (s && s.segments) setSegs(s.segments);
      if (c.length) setCoId(c[0].id);
    });
  }, []);

  // Vendor search
  useEffect(() => {
    if (vendorSearch.length < 2) { setVendorResults([]); setShowVendorDrop(false); return; }
    const t = setTimeout(() => {
      fetch("/api/billing/vendors/search?q=" + encodeURIComponent(vendorSearch))
        .then(r => r.json()).then(d => { setVendorResults(d.vendors || []); setShowVendorDrop(true); });
    }, 300);
    return () => clearTimeout(t);
  }, [vendorSearch]);

  const pickVendor = (vn: any) => {
    setV({ name: vn.name || "", phone: vn.phone || "", email: vn.email || "", gstin: vn.gstin || "", addr: (vn.address || "") + " " + (vn.city || ""), state: vn.state || "Bihar", sc: vn.state_code || "10" });
    setSelectedVendorId(vn.id);
    setVendorSearch(vn.name);
    setShowVendorDrop(false);
  };

  const toggle = (s: string) => setOpen(p => { const n = new Set(p); n.has(s) ? n.delete(s) : n.add(s); return n; });

  const addProd = (cp: any) => {
    const p = prods.find((x: any) => x.id === cp.id);
    if (!p) return;
    const ni: Item = { key: uid(), pid: p.id, desc: p.name, hsn: p.hsn_code || "", qty: 1, unit: p.unit || "Nos", rate: parseFloat(p.default_purchase_price || p.default_sale_price || "0"), disc: 0, gst: parseFloat(p.gst_rate || "12") };
    setItems(prev => {
      const ei = prev.findIndex(i => !i.pid && !i.desc);
      if (ei >= 0) return prev.map((it, idx) => idx === ei ? ni : it);
      return [...prev, ni];
    });
  };

  const upd = (k: string, f: string, val: any) => setItems(p => p.map(i => i.key === k ? { ...i, [f]: val } : i));
  const del = (k: string) => setItems(p => { const f = p.filter(i => i.key !== k); return f.length ? f : [blank()]; });

  const tots = items.reduce((a, i) => { const t = total(i); return { sub: a.sub + t.taxable, tax: a.tax + t.tax, grand: a.grand + t.grand }; }, { sub: 0, tax: 0, grand: 0 });

  const savePO = async () => {
    if (!v.name) return alert("Vendor name required");
    setSaving(true);
    try {
      const res = await fetch("/api/billing/purchase-orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: coId, po_date: poDate, delivery_date: delDate,
          vendor_id: selectedVendorId, vendor_name: v.name, vendor_phone: v.phone, vendor_email: v.email,
          vendor_gstin: v.gstin, vendor_address: v.addr, vendor_state: v.state, vendor_state_code: v.sc,
          notes, items: items.filter(i => i.desc).map(i => ({
            product_id: i.pid, description: i.desc, hsn_code: i.hsn,
            quantity: i.qty, unit: i.unit, rate: i.rate, discount_percent: i.disc, gst_rate: i.gst,
          })),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setSavedId(d.id);
      alert("PO saved: " + (d.po_no || "Success"));
    } catch (e: any) { alert("Error: " + e.message); }
    finally { setSaving(false); }
  };


  const colors: Record<string, string> = { "Solar Panels": "#f59e0b", "Ongrid Inverter": "#10b981", "Offgrid Inverter": "#06b6d4", "Acid Lead Battery": "#ef4444", "Lithium Battery": "#22c55e", "Grid Interactive Hybrid": "#6366f1", "Small Inverters": "#f97316", "Solar Inverter IPD 21": "#3b82f6", "Solar High Frequency Inverter IP65": "#8b5cf6" };

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => nav("/admin/billing")}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold text-purple-700 flex items-center gap-2"><ShoppingCart className="w-6 h-6" /> Create Purchase Order</h1>
          <p className="text-sm text-muted-foreground">Select products, specify vendor, generate PO</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-1 max-h-[85vh] overflow-y-auto pr-2">
          <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">Product Catalog (Purchase Price)</h3>
          {Object.entries(segs).map(([seg, ps]) => (
            <div key={seg} className="border rounded-lg overflow-hidden">
              <button onClick={() => toggle(seg)} className="w-full flex items-center justify-between p-2 px-3 hover:bg-gray-50 text-sm font-medium" style={{ borderLeft: "4px solid " + (colors[seg] || "#6b7280") }}>
                <span>{seg} <span className="text-xs text-gray-400 ml-1">({(ps as any[]).length})</span></span>
                {open.has(seg) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {open.has(seg) && (
                <div className="border-t divide-y">
                  {(ps as any[]).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-1.5 px-3 hover:bg-purple-50 cursor-pointer text-xs" onClick={() => addProd(p)}>
                      <span className="truncate font-medium">{p.name}</span>
                      <span className="text-purple-700 font-semibold ml-2 whitespace-nowrap">{fmt(parseFloat(p.default_purchase_price || p.price || "0"))}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Billing Company</CardTitle></CardHeader>
              <CardContent>
                <Select value={String(coId)} onValueChange={x => setCoId(Number(x))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{cos.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div><Label className="text-xs">PO Date</Label><Input type="date" value={poDate} onChange={e => setPoDate(e.target.value)} className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">Delivery Date</Label><Input type="date" value={delDate} onChange={e => setDelDate(e.target.value)} className="h-8 text-sm" /></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Vendor / Supplier</CardTitle></CardHeader>
              <CardContent>
                <div className="relative mb-2">
                  <Label className="text-xs">Search Existing Vendor</Label>
                  <Input value={vendorSearch} onChange={e => { setVendorSearch(e.target.value); setSelectedVendorId(null); }} placeholder="Type vendor name, GSTIN, phone..." className="h-8 text-sm" />
                  {showVendorDrop && vendorResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {vendorResults.map((vn: any) => (
                        <div key={vn.id} className="p-2 px-3 hover:bg-purple-50 cursor-pointer border-b text-sm" onClick={() => pickVendor(vn)}>
                          <div className="font-medium">{vn.name}</div>
                          <div className="text-xs text-gray-500">{vn.phone || ""} {vn.gstin ? "| " + vn.gstin : ""} {vn.state ? "| " + vn.state : ""}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedVendorId && <p className="text-xs text-green-600 mt-1">Auto-filled from saved vendor</p>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs">Name *</Label><Input value={v.name} onChange={e => setV(p => ({...p, name: e.target.value}))} className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">GSTIN</Label><Input value={v.gstin} onChange={e => setV(p => ({...p, gstin: e.target.value}))} className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">Phone</Label><Input value={v.phone} onChange={e => setV(p => ({...p, phone: e.target.value}))} className="h-8 text-sm" /></div>
                  <div className="col-span-2"><Label className="text-xs">Address</Label><Input value={v.addr} onChange={e => setV(p => ({...p, addr: e.target.value}))} className="h-8 text-sm" placeholder="Vendor address" /></div>
                  <div><Label className="text-xs">State</Label>
                    <Select value={v.sc} onValueChange={x => { const s = STATES.find(st => st.code === x); setV(p => ({...p, state: s?.name||"", sc: x})); }}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATES.map(s => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Line Items</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setItems(p => [...p, blank()])}><Plus className="w-3 h-3 mr-1" />Add</Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-xs text-gray-500"><th className="text-left pb-2 w-8">#</th><th className="text-left pb-2 min-w-[200px]">Product</th><th className="pb-2 w-20">HSN</th><th className="text-right pb-2 w-14">Qty</th><th className="text-right pb-2 w-24">Rate</th><th className="text-right pb-2 w-14">Disc%</th><th className="text-right pb-2 w-14">GST%</th><th className="text-right pb-2 w-24">Total</th><th className="w-8"></th></tr></thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const t = total(item);
                      return (
                        <tr key={item.key} className="border-b">
                          <td className="py-1 text-gray-400">{idx+1}</td>
                          <td className="py-1 pr-1"><Input className="h-7 text-xs" value={item.desc} onChange={e => upd(item.key, "desc", e.target.value)} placeholder="Product name" /></td>
                          <td className="py-1"><Input className="h-7 text-xs w-20" value={item.hsn} onChange={e => upd(item.key, "hsn", e.target.value)} /></td>
                          <td className="py-1"><Input type="number" className="h-7 text-xs text-right w-14" value={item.qty} onChange={e => upd(item.key, "qty", parseFloat(e.target.value)||0)} /></td>
                          <td className="py-1"><Input type="number" className="h-7 text-xs text-right w-24" value={item.rate} onChange={e => upd(item.key, "rate", parseFloat(e.target.value)||0)} /></td>
                          <td className="py-1"><Input type="number" className="h-7 text-xs text-right w-14" value={item.disc} onChange={e => upd(item.key, "disc", parseFloat(e.target.value)||0)} /></td>
                          <td className="py-1"><Input type="number" className="h-7 text-xs text-right w-14" value={item.gst} onChange={e => upd(item.key, "gst", parseFloat(e.target.value)||0)} /></td>
                          <td className="py-1 text-right font-medium">{fmt(t.grand)}</td>
                          <td className="py-1"><Button variant="ghost" size="sm" onClick={() => del(item.key)} className="h-6 w-6 p-0 text-red-500"><Trash2 className="w-3 h-3" /></Button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between mt-4">
                <div className="w-64"><Label className="text-xs">Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="text-sm" placeholder="Additional notes..." /></div>
                <div className="w-60 text-sm space-y-1">
                  <div className="flex justify-between"><span>Subtotal</span><span>{fmt(tots.sub)}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>GST</span><span>{fmt(tots.tax)}</span></div>
                  <div className="flex justify-between font-bold text-lg text-purple-700 pt-2 border-t-2 border-purple-700"><span>Grand Total</span><span>{fmt(tots.grand)}</span></div>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => nav("/admin/billing")}>Cancel</Button>
            <Button onClick={savePO} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Save Purchase Order
            </Button>
          </div>
          {/* Share: PDF / Email / WhatsApp */}
          <Card className="border-purple-300 bg-purple-50/50">
            <CardContent className="pt-4">
              <p className="text-sm font-medium text-purple-800 mb-3">{savedId ? "✅ PO Saved! " : ""}Send Purchase Order:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <Label className="text-xs">Vendor Email</Label>
                  <Input value={v.email} onChange={e => setV(p => ({...p, email: e.target.value}))} placeholder="vendor@email.com" className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Vendor WhatsApp No.</Label>
                  <Input value={v.phone} onChange={e => setV(p => ({...p, phone: e.target.value}))} placeholder="9876543210" className="h-8 text-sm" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => window.print()} className="bg-amber-500 hover:bg-amber-600"><Download className="w-4 h-4 mr-2" />Download PDF</Button>
                <Button size="sm" onClick={() => {
                  if (!v.email) return alert("Enter vendor email first");
                  const sub = encodeURIComponent("Purchase Order" + (savedId ? " - Divyanshi Solar" : ""));
                  const body = encodeURIComponent("Dear " + v.name + ",\n\nPlease find the attached Purchase Order.\n\nTotal Amount: Rs. " + tots.grand.toLocaleString("en-IN") + "\n\nThank you,\nDivyanshi Solar\nPhone: 9801005212");
                  window.open("mailto:" + v.email + "?subject=" + sub + "&body=" + body);
                }} className="bg-blue-500 hover:bg-blue-600"><Mail className="w-4 h-4 mr-2" />Send Email</Button>
                <Button size="sm" onClick={() => {
                  if (!v.phone) return alert("Enter vendor WhatsApp number first");
                  const clean = v.phone.replace(/[^0-9]/g, "");
                  const wa = clean.startsWith("91") ? clean : "91" + clean;
                  const msg = encodeURIComponent("*Purchase Order - Divyanshi Solar*\n\nDear " + v.name + ",\n\nPO Total: Rs. " + tots.grand.toLocaleString("en-IN") + "\n\nThank you!\nDivyanshi Solar | 9801005212");
                  window.open("https://wa.me/" + wa + "?text=" + msg, "_blank");
                }} className="bg-green-600 hover:bg-green-700"><Send className="w-4 h-4 mr-2" />Send WhatsApp</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
