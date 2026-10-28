/**
 * Purchase Order List — /admin/billing/purchase-orders
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Search, Truck, ArrowLeft, Eye, Trash2, Mail, ExternalLink,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PurchaseOrder {
  id: number; po_no: string; po_date: string; expected_delivery: string;
  total_amount: string; taxable_amount: string; status: string;
  vendor_name: string; company_name: string; notes: string;
}

function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function PurchaseOrderList() {
  const [, navigate] = useLocation();
  const [items, setItems] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    fetch("/api/billing/purchase-orders")
      .then(r => r.json())
      .then(data => setItems(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter(po => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (po.po_no || "").toLowerCase().includes(s) ||
      (po.vendor_name || "").toLowerCase().includes(s);
  });

  const totals = {
    count: filtered.length,
    total: filtered.reduce((s, i) => s + parseFloat(i.total_amount || "0"), 0),
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/billing/purchase-orders/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Purchase Order deleted", description: "PO has been removed successfully." });
        load();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed to delete", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete PO", variant: "destructive" });
    }
    setDeleteId(null);
  };

  const handleEmail = async (id: number) => {
    const email = prompt("Enter vendor email address:");
    if (!email) return;
    try {
      const res = await fetch(`/api/billing/purchase-orders/${id}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        toast({ title: "Email sent!", description: `PO sent to ${email}` });
      } else {
        toast({ title: "Email failed", description: "Could not send email", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Email sending failed", variant: "destructive" });
    }
  };

  const statusColor: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    sent: "bg-blue-100 text-blue-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    received: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-700",
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
            <h1 className="text-2xl font-bold">Purchase Orders</h1>
            <p className="text-sm text-muted-foreground">{totals.count} orders</p>
          </div>
        </div>
        <Button onClick={() => navigate("/admin/billing/purchase-orders/new")}>
          <Plus className="w-4 h-4 mr-2" />New Purchase Order
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase">Total POs</p>
          <p className="text-2xl font-bold mt-1">{totals.count}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase">Total Value</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{formatINR(totals.total)}</p>
        </CardContent></Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by PO #, vendor name..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Delete Confirmation */}
      {deleteId && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span className="font-medium">Delete this purchase order permanently?</span>
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
            <Truck className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No purchase orders found</p>
          </CardContent></Card>
        ) : filtered.map(po => (
          <Card key={po.id} className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-purple-600">{po.po_no}</span>
                    {po.status && (
                      <Badge className={`text-xs ${statusColor[po.status] || "bg-gray-100"}`}>
                        {po.status}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 text-sm">
                    <span className="font-medium">{po.vendor_name || "—"}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-4">
                    <span>Date: {po.po_date ? new Date(po.po_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</span>
                    {po.expected_delivery && <span>Delivery: {new Date(po.expected_delivery).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>}
                    <span>{po.company_name}</span>
                  </div>
                </div>

                {/* Right: Amount + Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-bold whitespace-nowrap">{formatINR(parseFloat(po.total_amount || "0"))}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" title="View PDF"
                      onClick={() => window.open(`/api/billing/purchase-orders/${po.id}/pdf`, "_blank")}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" title="Send Email"
                      onClick={() => handleEmail(po.id)}>
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" title="Edit"
                      onClick={() => navigate(`/admin/billing/purchase-orders/${po.id}/edit`)}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" title="Delete"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(po.id)}>
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
