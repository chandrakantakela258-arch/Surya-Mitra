import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Landmark, Search, Eye, Download, Trash2, User, Loader2, RefreshCw, Pencil } from "lucide-react";

const CUSTOMER_URL_PREFIX = "/admin/customers/";

type Row = {
  id: number; quote_no: string; customer_id: string; customer_name: string | null; phone: string | null;
  bank_name: string | null; ifsc: string | null; capacity_kw: string | null; inverter_type: string | null;
  brand: string | null; total_amount: string | null; download_count: number; pdf_size: number | null;
  has_pdf: boolean; created_at: string; updated_at: string;
};

const INV: Record<string, string> = {
  ongrid: "On-Grid", hybrid: "Hybrid", offgrid: "Off-Grid", vfd_offgrid: "VFD Off-Grid", vfd_autogrid: "VFD Auto-Grid",
};
const inr = (v: string | null) => (v == null ? "-" : "\u20b9" + Math.round(Number(v)).toLocaleString("en-IN"));
const when = (v: string) =>
  new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const kb = (n: number | null) => (n ? `${Math.round(n / 1024).toLocaleString("en-IN")} KB` : "");

export default function BankQuotations() {
  const [, navigate] = useLocation();
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async (term: string) => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/bank-quotations${term ? `?q=${encodeURIComponent(term)}` : ""}`, { credentials: "include" });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
      setRows(await r.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => load(q.trim()), q ? 350 : 0);
    return () => clearTimeout(t);
  }, [q]);

  const total = useMemo(() => rows.reduce((a, r) => a + (Number(r.total_amount) || 0), 0), [rows]);

  const remove = async (row: Row) => {
    if (!confirm(`Delete saved quotation ${row.quote_no} for ${row.customer_name || "this customer"}? The PDF copy is removed too.`)) return;
    setBusyId(row.id);
    try {
      const r = await fetch(`/api/bank-quotations/${row.id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
      setRows((rs) => rs.filter((x) => x.id !== row.id));
    } catch (e: any) {
      alert(`Could not delete: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Landmark className="w-6 h-6 text-orange-600" /> Bank Quotation
          </h1>
          <p className="text-sm text-muted-foreground">
            Every quotation downloaded from Generate Quotation is kept here, exactly as it was sent to the bank.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search name, phone, quote no, bank" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Button variant="outline" size="icon" onClick={() => load(q.trim())} title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {!loading && !error && (
        <p className="text-sm">
          <strong>{rows.length}</strong> quotation{rows.length === 1 ? "" : "s"}{q ? " found" : ""}, total value <strong>{inr(String(total))}</strong>
        </p>
      )}

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          Could not load saved quotations: {error}
        </div>
      )}

      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm min-w-[980px]">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-semibold">Saved</th>
              <th className="p-3 font-semibold">Quote no.</th>
              <th className="p-3 font-semibold">Customer</th>
              <th className="p-3 font-semibold">Bank</th>
              <th className="p-3 font-semibold">Plant</th>
              <th className="p-3 font-semibold text-right">Amount</th>
              <th className="p-3 font-semibold text-center">Downloads</th>
              <th className="p-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin inline mr-2" />Loading
              </td></tr>
            )}
            {!loading && rows.length === 0 && !error && (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">
                {q ? `No saved quotation matches "${q}".`
                   : "Nothing saved yet. Open a customer, use Generate Quotation and press Download PDF; the copy appears here."}
              </td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t align-top hover:bg-muted/30">
                <td className="p-3 whitespace-nowrap">{when(r.updated_at)}</td>
                <td className="p-3 whitespace-nowrap font-medium">
                  {r.quote_no}
                  {r.brand === "solarixa" && <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-800">Solarixa</span>}
                </td>
                <td className="p-3">
                  <div className="font-medium">{r.customer_name || "-"}</div>
                  {r.phone && <div className="text-xs text-muted-foreground">{r.phone}</div>}
                </td>
                <td className="p-3">
                  <div>{r.bank_name || "-"}</div>
                  {r.ifsc && <div className="text-xs text-muted-foreground">{r.ifsc}</div>}
                </td>
                <td className="p-3 whitespace-nowrap">
                  {r.capacity_kw ? `${Number(r.capacity_kw)} kW` : "-"}
                  <div className="text-xs text-muted-foreground">{INV[r.inverter_type || ""] || r.inverter_type || ""}</div>
                </td>
                <td className="p-3 text-right whitespace-nowrap font-medium">{inr(r.total_amount)}</td>
                <td className="p-3 text-center">{r.download_count}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    {r.has_pdf ? (
                      <>
                        <Button size="sm" variant="outline" title={`View PDF ${kb(r.pdf_size)}`}
                          onClick={() => window.open(`/api/bank-quotations/${r.id}/pdf`, "_blank")}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" title="Download PDF"
                          onClick={() => window.open(`/api/bank-quotations/${r.id}/pdf?download=1`, "_blank")}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <span className="self-center pr-2 text-xs text-amber-700" title="Details were saved but the PDF upload failed">PDF not stored</span>
                    )}
                    {CUSTOMER_URL_PREFIX && (
                      <Button size="sm" variant="outline" title="Edit and re-download"
                        onClick={() => navigate(`${CUSTOMER_URL_PREFIX}${r.customer_id}?bankQuote=${r.id}`)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    {CUSTOMER_URL_PREFIX && (
                      <Button size="sm" variant="outline" title="Open customer"
                        onClick={() => navigate(`${CUSTOMER_URL_PREFIX}${r.customer_id}`)}>
                        <User className="w-4 h-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" title="Delete" disabled={busyId === r.id}
                      className="text-red-600 hover:text-red-700" onClick={() => remove(r)}>
                      {busyId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
