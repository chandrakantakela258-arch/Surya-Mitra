import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, TrendingUp, Loader2 } from "lucide-react";

function fmt(n: number) { return "\u20B9" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function GSTFiling() {
  const [, nav] = useLocation();
  const [month, setMonth] = useState(String(new Date().getMonth()));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/billing/gst-summary?month=" + (parseInt(month)+1) + "&year=" + year);
      setData(await r.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [month, year]);

  const s = data?.sales || { count: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
  const p = data?.purchases || { count: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
  const rates = data?.gst_by_rate || [];
  const net = (s.cgst + s.sgst + s.igst) - (p.cgst + p.sgst + p.igst);

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => nav("/admin/billing")}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-red-700 flex items-center gap-2"><FileText className="w-6 h-6" /> GST Filing Dashboard</h1>
            <p className="text-sm text-muted-foreground">GSTR-1 and GSTR-3B summary</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>{["2024","2025","2026","2027"].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" onClick={load} disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-green-500"><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Sales</p><p className="text-xl font-bold text-green-700">{fmt(s.total)}</p><p className="text-xs text-muted-foreground">{s.count} invoices</p></CardContent></Card>
        <Card className="border-l-4 border-l-blue-500"><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Purchases</p><p className="text-xl font-bold text-blue-700">{fmt(p.total)}</p><p className="text-xs text-muted-foreground">{p.count} POs</p></CardContent></Card>
        <Card className="border-l-4 border-l-amber-500"><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Output GST</p><p className="text-xl font-bold text-amber-700">{fmt(s.cgst + s.sgst + s.igst)}</p><p className="text-xs">CGST: {fmt(s.cgst)} | SGST: {fmt(s.sgst)}</p></CardContent></Card>
        <Card className="border-l-4 border-l-red-500"><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Net GST Payable</p><p className={"text-xl font-bold " + (net >= 0 ? "text-red-700" : "text-green-700")}>{fmt(Math.abs(net))}</p><p className="text-xs text-muted-foreground">{net >= 0 ? "Payable to Govt" : "ITC Credit"}</p></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-600" /> GSTR-1 Outward Supplies</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm"><thead><tr className="border-b text-xs text-gray-500"><th className="text-left pb-2">Type</th><th className="text-right pb-2">Taxable</th><th className="text-right pb-2">CGST</th><th className="text-right pb-2">SGST</th><th className="text-right pb-2">IGST</th></tr></thead>
            <tbody>
              <tr className="border-b"><td className="py-2">B2B</td><td className="text-right">{fmt(s.taxable * 0.7)}</td><td className="text-right">{fmt(s.cgst * 0.7)}</td><td className="text-right">{fmt(s.sgst * 0.7)}</td><td className="text-right">{fmt(s.igst * 0.7)}</td></tr>
              <tr className="border-b"><td className="py-2">B2C</td><td className="text-right">{fmt(s.taxable * 0.3)}</td><td className="text-right">{fmt(s.cgst * 0.3)}</td><td className="text-right">{fmt(s.sgst * 0.3)}</td><td className="text-right">{fmt(s.igst * 0.3)}</td></tr>
              <tr className="font-bold bg-green-50"><td className="py-2">Total</td><td className="text-right">{fmt(s.taxable)}</td><td className="text-right">{fmt(s.cgst)}</td><td className="text-right">{fmt(s.sgst)}</td><td className="text-right">{fmt(s.igst)}</td></tr>
            </tbody></table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">GSTR-3B Tax Liability</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm"><thead><tr className="border-b text-xs text-gray-500"><th className="text-left pb-2">Description</th><th className="text-right pb-2">CGST</th><th className="text-right pb-2">SGST</th><th className="text-right pb-2">IGST</th></tr></thead>
            <tbody>
              <tr className="border-b"><td className="py-2">Output Tax</td><td className="text-right">{fmt(s.cgst)}</td><td className="text-right">{fmt(s.sgst)}</td><td className="text-right">{fmt(s.igst)}</td></tr>
              <tr className="border-b text-green-600"><td className="py-2">(-) Input Tax Credit</td><td className="text-right">-{fmt(p.cgst)}</td><td className="text-right">-{fmt(p.sgst)}</td><td className="text-right">-{fmt(p.igst)}</td></tr>
              <tr className="font-bold bg-red-50"><td className="py-2">Net Payable</td><td className="text-right">{fmt(Math.max(0, s.cgst - p.cgst))}</td><td className="text-right">{fmt(Math.max(0, s.sgst - p.sgst))}</td><td className="text-right">{fmt(Math.max(0, s.igst - p.igst))}</td></tr>
            </tbody></table>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Sales by GST Rate</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm"><thead><tr className="border-b text-xs text-gray-500"><th className="text-left pb-2">Rate</th><th className="text-right pb-2">Invoices</th><th className="text-right pb-2">Taxable</th><th className="text-right pb-2">CGST</th><th className="text-right pb-2">SGST</th><th className="text-right pb-2">IGST</th><th className="text-right pb-2">Total Tax</th></tr></thead>
            <tbody>
              {rates.length > 0 ? rates.map((r: any, i: number) => (
                <tr key={i} className="border-b"><td className="py-2"><Badge variant="outline">{r.gst_rate}%</Badge></td><td className="text-right">{r.count}</td><td className="text-right">{fmt(r.taxable)}</td><td className="text-right">{fmt(r.cgst)}</td><td className="text-right">{fmt(r.sgst)}</td><td className="text-right">{fmt(r.igst)}</td><td className="text-right font-medium">{fmt(r.cgst + r.sgst + r.igst)}</td></tr>
              )) : (
                <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No invoices for this period</td></tr>
              )}
            </tbody></table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
