/**
 * Quotation List — /admin/billing/quotations
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Search, FileText, ArrowLeft, Eye, Trash2, Mail, ExternalLink,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Quotation {
  id: number; invoice_no: string; invoice_date: string; invoice_type: string;
  due_date: string; total_amount: string; taxable_amount: string;
  customer_name: string; customer_phone: string;
  company_name: string; cancelled: boolean; notes: string;
}

function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function QuotationList() {
  const [, navigate] = useLocation();
  const [items, setItems] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    fetch("/api/billing/invoices?type=quotation")
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setItems(arr.filter((i: any) => i.invoice_type === "quotation"));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter(q => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (q.invoice_no || "").toLowerCase().includes(s) ||
      (q.customer_name || "").toLowerCase().includes(s) ||
      (q.customer_phone || "").includes(s);
  });

  const totals = {
    count: filtered.length,
    total: filtered.reduce((s, i) => s + parseFloat(i.total_amount || "0"), 0),
    taxable: filtered.reduce((s, i) => s + parseFloat(i.taxable_amount || "0"), 0),
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/billing/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Quotation deleted", description: "Quotation has been removed successfully." });
        load();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed to delete", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete quotation", variant: "destructive" });
    }
    setDeleteId(null);
  };

  const handleEmail = async (id: number) => {
    const email = prompt("Enter customer email address:");
    if (!email) return;
    try {
      const res = await fetch(`/api/billing/invoices/${id}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        toast({ title: "Email sent!", description: `Quotation sent to ${email}` });
      } else {
        toast({ title: "Email failed", description: "Could not send email", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Email sending failed", variant: "destructive" });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/billing")}>
            <ArrowLeft className="w-4 h-4 mr-1" />Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Quotations</h1>
            <p className="text-sm text-muted-foreground">{totals.count} quotations</p>
          </div>
        </div>
        <Button onClick={() => navigate("/admin/billing/quotations/new")}>
          <Plus className="w-4 h-4 mr-2" />New Quotation
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase">Total Quotations</p>
          <p className="text-2xl font-bold mt-1">{totals.count}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase">Total Value</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{formatINR(totals.total)}</p>
        </CardContent></Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by quotation #, customer name, phone..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Delete Confirmation */}
      {deleteId && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span className="font-medium">Delete this quotation permanently?</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(deleteId)}>Delete</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Loading...</CardContent></Card>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No quotations found</p>
          </CardContent></Card>
        ) : filtered.map(q => (
          <Card key={q.id} className={`transition-shadow hover:shadow-md ${q.cancelled ? "opacity-50" : ""}`}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-blue-600">{q.invoice_no} {(q as any).plant_type && <span className="ml-2 text-xs font-semibold text-orange-600">({(q as any).plant_type})</span>}</span>
                    {q.cancelled && <Badge variant="destructive" className="text-xs">Cancelled</Badge>}
                  </div>
                  <div className="mt-1 text-sm">
                    <span className="font-medium">{q.customer_name || "—"}</span>
                    {q.customer_phone && <span className="text-muted-foreground ml-2">({q.customer_phone})</span>}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-4">
                    <span>Date: {new Date(q.invoice_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    {q.due_date && <span>Valid Till: {new Date(q.due_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>}
                    <span className="text-xs">{q.company_name}</span>
                  </div>
                </div>

                {/* Right: Amount + Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-bold whitespace-nowrap">{formatINR(parseFloat(q.total_amount || "0"))}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" title="View PDF"
                      onClick={() => window.open(`/api/billing/invoices/${q.id}/pdf`, "_blank")}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" title="Send Email"
                      onClick={() => handleEmail(q.id)}>
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" title="Edit"
                      onClick={() => navigate(`/admin/billing/quotations/new?edit=${q.id}`)}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" title="Delete"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(q.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
