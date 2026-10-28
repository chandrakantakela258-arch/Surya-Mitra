/**
 * Billing Dashboard — /admin/billing
 * Shows monthly revenue, outstanding, recent invoices, quick actions
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, FileText, ShoppingCart, Package, AlertTriangle, Plus, ArrowRight, TrendingUp, Clock } from "lucide-react";

interface DashboardStats {
  monthlyRevenue: number;
  totalOutstanding: number;
  invoicesThisMonth: number;
  pendingQuotations: number;
  lowStockAlerts: number;
}

interface Invoice {
  id: number;
  invoice_no: string;
  invoice_date: string;
  total_amount: string;
  payment_status: string;
  customer_name: string;
  company_name: string;
}

function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function BillingDashboard() {
  const [, navigate] = useLocation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/billing/dashboard").then(r => r.json()),
      fetch("/api/billing/invoices?limit=10").then(r => r.json()),
    ]).then(([s, inv]) => {
      setStats(s);
      setRecentInvoices(Array.isArray(inv) ? inv.slice(0, 8) : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const statusColor: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-800",
    partial: "bg-amber-100 text-amber-800",
    unpaid: "bg-red-100 text-red-800",
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Billing & Invoicing</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <Card key={i}><CardContent className="p-6"><div className="h-16 bg-gray-100 animate-pulse rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Invoicing</h1>
          <p className="text-sm text-gray-500 mt-1">Manage invoices, quotations, purchase orders & GST</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/billing/quotations/new")}>
            <FileText className="w-4 h-4 mr-2" />New Quotation
          </Button>
          <Button onClick={() => navigate("/admin/billing/invoices/new")}>
            <Plus className="w-4 h-4 mr-2" />New Invoice
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Revenue This Month</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatINR(stats?.monthlyRevenue || 0)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Outstanding</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatINR(stats?.totalOutstanding || 0)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Invoices (Month)</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.invoicesThisMonth || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Pending Quotes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.pendingQuotations || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${(stats?.lowStockAlerts || 0) > 0 ? "border-l-red-500" : "border-l-gray-300"}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.lowStockAlerts || 0}</p>
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${(stats?.lowStockAlerts || 0) > 0 ? "bg-red-100" : "bg-gray-100"}`}>
                <AlertTriangle className={`w-5 h-5 ${(stats?.lowStockAlerts || 0) > 0 ? "text-red-600" : "text-gray-400"}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation + Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Create Invoice", icon: IndianRupee, path: "/admin/billing/invoices/new", color: "text-emerald-600" },
              { label: "Create Quotation", icon: FileText, path: "/admin/billing/quotations/new", color: "text-blue-600" },
              { label: "Purchase Order", icon: ShoppingCart, path: "/admin/billing/purchase-orders/new", color: "text-purple-600" },
              { label: "Grievance Email Registry", icon: AlertTriangle, path: "/admin/grievance-emails", color: "text-red-600" },
              { label: "View Stock", icon: Package, path: "/admin/billing/stock", color: "text-orange-600" },
              { label: "GST Filing", icon: FileText, path: "/admin/billing/gst", color: "text-red-600" },
              { label: "All Invoices", icon: FileText, path: "/admin/billing/invoices", color: "text-gray-600" },
              { label: "Grievance List", icon: AlertTriangle, path: "/admin/grievance-emails", color: "text-orange-600" },
              { label: "Customers", icon: FileText, path: "/admin/billing/customers", color: "text-gray-600" },
              { label: "Products", icon: Package, path: "/admin/billing/products", color: "text-gray-600" },
            ].map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Invoices</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/billing/invoices")}>
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No invoices yet. Create your first invoice!</p>
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-5 gap-2 text-xs font-medium text-gray-500 uppercase px-3 pb-2 border-b">
                  <span>Invoice #</span><span>Customer</span><span>Date</span><span className="text-right">Amount</span><span className="text-center">Status</span>
                </div>
                {recentInvoices.map(inv => (
                  <button
                    key={inv.id}
                    onClick={() => navigate(`/admin/billing/invoices/${inv.id}`)}
                    className="w-full grid grid-cols-5 gap-2 items-center px-3 py-2.5 rounded hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="text-sm font-medium text-blue-600">{inv.invoice_no}</span>
                    <span className="text-sm text-gray-700 truncate">{inv.customer_name || "—"}</span>
                    <span className="text-sm text-gray-500">{new Date(inv.invoice_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                    <span className="text-sm font-medium text-right">{formatINR(parseFloat(inv.total_amount))}</span>
                    <span className="text-center">
                      <Badge className={`text-xs ${statusColor[inv.payment_status] || "bg-gray-100"}`}>
                        {inv.payment_status}
                      </Badge>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
