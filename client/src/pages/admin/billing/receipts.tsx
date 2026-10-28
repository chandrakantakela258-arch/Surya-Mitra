/**
 * Payment Receipts — /admin/billing/receipts
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Receipt, ArrowLeft, Eye, Trash2, Pencil, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReceiptData {
  id: number; receipt_no: string; company_id: number; customer_id: number;
  receipt_type: string; receipt_date: string; customer_name: string; customer_phone: string;
  customer_email: string; customer_address: string; customer_city: string;
  customer_state: string; customer_state_code: string; customer_pin: string;
  customer_gstin: string; consumer_number: string;
  payment_method: string; reference_number: string; description: string;
  amount: string; tax_amount: string; total_amount: string;
  invoice_id: number; invoice_no: string; total_invoice_amount: string;
  amount_paid_earlier: string; balance_due: string;
  plant_capacity: string; panel_spec: string; inverter_spec: string; battery_spec: string;
  notes: string; cancelled: boolean; company_name: string;
}

const RECEIPT_TYPES = [
  { value: "down_payment", label: "Down Payment Receipt", color: "bg-blue-100 text-blue-800" },
  { value: "bank_1st_instalment_70", label: "Bank 1st Instalment (70%)", color: "bg-indigo-100 text-indigo-800" },
  { value: "bank_2nd_instalment_30", label: "Bank 2nd Instalment (30%)", color: "bg-violet-100 text-violet-800" },
  { value: "full_payment_banker", label: "Full Payment - Banker", color: "bg-emerald-100 text-emerald-800" },
  { value: "full_payment_customer", label: "Full Payment - Customer", color: "bg-green-100 text-green-800" },
  { value: "cash_receipt", label: "Cash Receipt", color: "bg-amber-100 text-amber-800" },
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer / NEFT / RTGS" },
  { value: "cheque", label: "Cheque" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
];

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
}

const emptyForm = {
  company_id: "1", receipt_type: "down_payment", receipt_date: new Date().toISOString().split("T")[0],
  customer_name: "", customer_phone: "", customer_email: "", customer_address: "",
  customer_city: "", customer_state: "Bihar", customer_state_code: "10", customer_pin: "",
  customer_gstin: "", consumer_number: "",
  payment_method: "bank_transfer", reference_number: "", description: "",
  amount: "", tax_amount: "0", total_amount: "",
  invoice_id: "", invoice_no: "", total_invoice_amount: "", amount_paid_earlier: "0", balance_due: "",
  plant_capacity: "", panel_spec: "", inverter_spec: "", battery_spec: "", notes: "Please ensure your Post Paid Meter is converted to Prepaid Meter and the Connected Load is increased to the proposed Plant Capacity. Work will be completed in 10 working days after the required Electricity work is completed at the site.",
};

export default function PaymentReceipts() {
  const [, navigate] = useLocation();
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>({ ...emptyForm });
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [invoiceNoSearch, setInvoiceNoSearch] = useState("");
  const [invoiceNoResults, setInvoiceNoResults] = useState<any[]>([]);
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [invoiceResults, setInvoiceResults] = useState<any[]>([]);
  const [multiInvoiceMode, setMultiInvoiceMode] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/billing/receipts").then(r => r.json()),
      fetch("/api/billing/companies").then(r => r.json()),
    ]).then(([rData, cData]) => {
      setReceipts(Array.isArray(rData) ? rData : []);
      setCompanies(Array.isArray(cData) ? cData : []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Customer search
  useEffect(() => {
    if (customerSearch.length < 2) { setCustomerResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/billing/customers/search?q=${encodeURIComponent(customerSearch)}`).then(r => r.json())
        .then(d => setCustomerResults(d.customers || []));
    }, 300);
    return () => clearTimeout(t);
  }, [customerSearch]);

  // Search invoices directly by invoice number (independent of customer search)
  useEffect(() => {
    if (invoiceNoSearch.length < 2) { setInvoiceNoResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/billing/invoices?search=${encodeURIComponent(invoiceNoSearch)}`).then(r => r.json())
        .then(data => setInvoiceNoResults(Array.isArray(data) ? data.slice(0, 15) : []))
        .catch(() => setInvoiceNoResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [invoiceNoSearch]);

  // When an invoice is picked directly by number, auto-fill customer + invoice link
  const selectInvoiceByNumber = async (inv: any) => {
    setForm((f: any) => ({
      ...f,
      customer_name: inv.customer_name || f.customer_name,
      customer_phone: inv.customer_phone || f.customer_phone,
      customer_gstin: inv.customer_gstin || f.customer_gstin,
    }));
    setCustomerSearch(inv.customer_name || "");
    setInvoiceResults([inv]);
    await selectInvoice(inv);
    setInvoiceNoSearch("");
    setInvoiceNoResults([]);
    if (inv.customer_name) loadInvoices(inv.customer_name);
  };

  // Load invoices for selected customer
  const loadInvoices = async (custName: string) => {
    try {
      const res = await fetch(`/api/billing/invoices?search=${encodeURIComponent(custName)}`);
      const data = await res.json();
      setInvoiceResults(Array.isArray(data) ? data : []);
    } catch { setInvoiceResults([]); }
  };

  const selectCustomer = (c: any) => {
    setForm((f: any) => ({
      ...f,
      customer_name: c.name || "", customer_phone: c.phone || "", customer_email: c.email || "",
      customer_address: c.address || "", customer_city: c.city || c.district || "",
      customer_state: c.state || "Bihar", customer_state_code: c.state_code || "10",
      customer_pin: c.pin || c.pincode || "", customer_gstin: c.gstin || "",
      consumer_number: c.consumer_number || "",
      plant_capacity: c.plant_capacity || "",
      panel_spec: c.panel_spec || "",
      inverter_spec: c.inverter_spec || "",
      battery_spec: c.battery_spec || "",
    }));
    setCustomerSearch(c.name || "");
    setCustomerResults([]);
    loadInvoices(c.name || "");
  };

  const selectInvoice = async (inv: any) => {
    const paid = parseFloat(inv.amount_paid || "0");
    const total = parseFloat(inv.total_amount || "0");
    // Fetch invoice details to get line items for plant spec
    let plantCap = "", panelSpec = "", inverterSpec = "", batterySpec = "";
    try {
      const res = await fetch(`/api/billing/invoices/${inv.id}`);
      const detail = await res.json();
      const items = detail.items || [];
      for (const it of items) {
        const desc = (it.description || it.product_name || "").toLowerCase();
        if (desc.includes("panel") || desc.includes("module") || desc.includes("wp")) panelSpec = it.description || it.product_name || "";
        if (desc.includes("inverter") || desc.includes("hybrid") || desc.includes("grid")) inverterSpec = it.description || it.product_name || "";
        if (desc.includes("battery") || desc.includes("lithium") || desc.includes("ah")) batterySpec = it.description || it.product_name || "";
      }
      // Try to detect capacity from product names
      const allDescs = items.map((i: any) => i.description || "").join(" ");
      const capMatch = allDescs.match(/(\d+)\s*[kK][wW]/);
      if (capMatch) plantCap = capMatch[1] + " KW";
    } catch {}
    setForm((f: any) => ({
      ...f,
      invoice_id: inv.id, invoice_no: inv.invoice_no,
      total_invoice_amount: total.toString(),
      amount_paid_earlier: paid.toString(),
      balance_due: (total - paid).toString(),
      description: `Payment against ${inv.invoice_no}`,
      plant_capacity: plantCap || f.plant_capacity,
      panel_spec: panelSpec || f.panel_spec,
      inverter_spec: inverterSpec || f.inverter_spec,
      battery_spec: batterySpec || f.battery_spec,
    }));
  };

  const filtered = receipts.filter(r => {
    if (typeFilter !== "all" && r.receipt_type !== typeFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (r.receipt_no || "").toLowerCase().includes(s) ||
      (r.customer_name || "").toLowerCase().includes(s) ||
      (r.customer_phone || "").includes(s);
  });

  const openNew = () => {
    setForm({ ...emptyForm }); setEditId(null); setCustomerSearch("");
    setCustomerResults([]); setInvoiceResults([]); setDialogOpen(true);
  };

  const openEdit = async (r: ReceiptData) => {
    setForm({
      company_id: String(r.company_id || "1"), receipt_type: r.receipt_type,
      receipt_date: r.receipt_date?.split("T")[0] || "",
      customer_name: r.customer_name || "", customer_phone: r.customer_phone || "",
      customer_email: r.customer_email || "", customer_address: r.customer_address || "",
      customer_city: r.customer_city || "", customer_state: r.customer_state || "",
      customer_state_code: r.customer_state_code || "", customer_pin: r.customer_pin || "",
      customer_gstin: r.customer_gstin || "", consumer_number: r.consumer_number || "",
      payment_method: r.payment_method || "bank_transfer", reference_number: r.reference_number || "",
      description: r.description || "", amount: r.amount || "", tax_amount: r.tax_amount || "0",
      total_amount: r.total_amount || "", invoice_id: r.invoice_id || "",
      invoice_no: r.invoice_no || "", total_invoice_amount: r.total_invoice_amount || "",
      amount_paid_earlier: r.amount_paid_earlier || "0", balance_due: r.balance_due || "",
      plant_capacity: r.plant_capacity || "", panel_spec: r.panel_spec || "",
      inverter_spec: r.inverter_spec || "", battery_spec: r.battery_spec || "",
      notes: r.notes || "",
    });
    setEditId(r.id); setCustomerSearch(r.customer_name || ""); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.customer_name || !form.amount) {
      toast({ title: "Error", description: "Customer name and amount required", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const url = editId ? `/api/billing/receipts/${editId}` : "/api/billing/receipts";
      const method = editId ? "PUT" : "POST";

      // Build multi-invoice payload if multi-invoice mode is active
      const chosenInvoices = multiInvoiceMode ? invoiceResults.filter(i => selectedInvoiceIds.has(i.id)) : [];
      const payload = multiInvoiceMode && chosenInvoices.length > 0
        ? { ...form, invoice_ids: chosenInvoices.map(i => i.id), invoice_nos: chosenInvoices.map(i => i.invoice_no) }
        : form;

      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        toast({ title: editId ? "Receipt updated" : "Receipt created" });
        setDialogOpen(false); load();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error, variant: "destructive" });
      }
    } catch { toast({ title: "Error", description: "Failed to save", variant: "destructive" }); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/billing/receipts/${id}`, { method: "DELETE" });
      if (res.ok) { toast({ title: "Receipt deleted" }); load(); }
      else { const e = await res.json(); toast({ title: "Error", description: e.error, variant: "destructive" }); }
    } catch { toast({ title: "Delete failed", variant: "destructive" }); }
    setDeleteId(null);
  };

  const amountChanged = (val: string) => {
    const amt = parseFloat(val) || 0;
    const tax = parseFloat(form.tax_amount) || 0;
    setForm((f: any) => ({ ...f, amount: val, total_amount: (amt + tax).toString() }));
  };

  const taxChanged = (val: string) => {
    const amt = parseFloat(form.amount) || 0;
    const tax = parseFloat(val) || 0;
    setForm((f: any) => ({ ...f, tax_amount: val, total_amount: (amt + tax).toString() }));
  };

  const typeInfo = (t: string) => RECEIPT_TYPES.find(rt => rt.value === t) || RECEIPT_TYPES[0];

  const F = (field: string, label: string, type = "text", colSpan = false) => (
    <div className={colSpan ? "col-span-2" : ""}>
      <Label className="text-xs">{label}</Label>
      <Input className="mt-1" type={type} value={form[field] || ""}
        onChange={e => setForm((f: any) => ({ ...f, [field]: e.target.value }))} />
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/billing")}>
            <ArrowLeft className="w-4 h-4 mr-1" />Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Payment Receipts</h1>
            <p className="text-sm text-muted-foreground">{receipts.length} receipts</p>
          </div>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />New Receipt</Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by receipt #, customer..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {RECEIPT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {deleteId && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-destructive" /><span>Delete this receipt?</span></div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(deleteId)}>Delete</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {loading ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Loading...</CardContent></Card>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">
            <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No receipts found</p>
          </CardContent></Card>
        ) : filtered.map(r => (
          <Card key={r.id} className={`hover:shadow-md transition-shadow ${r.cancelled ? "opacity-50" : ""}`}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-blue-600">{r.receipt_no}</span>
                    <Badge className={`text-xs ${typeInfo(r.receipt_type).color}`}>{typeInfo(r.receipt_type).label}</Badge>
                  </div>
                  <div className="mt-1 text-sm font-medium">{r.customer_name}</div>
                  <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-4">
                    <span>{new Date(r.receipt_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    <span>{r.payment_method?.replace("_", " ")}</span>
                    {r.invoice_no && <span>Inv: {r.invoice_no}</span>}
                    <span>{r.company_name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{formatINR(parseFloat(r.total_amount || "0"))}</span>
                  <Button size="sm" variant="outline" onClick={() => window.open(`/api/billing/receipts/${r.id}/pdf`, "_blank")}><Eye className="w-4 h-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeleteId(r.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit Receipt" : "New Payment Receipt"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Type & Company */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Receipt Type *</Label>
                <Select value={form.receipt_type} onValueChange={v => setForm((f: any) => ({ ...f, receipt_type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{RECEIPT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Company *</Label>
                <Select value={form.company_id} onValueChange={v => setForm((f: any) => ({ ...f, company_id: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{companies.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Date</Label>
                <Input className="mt-1" type="date" value={form.receipt_date} onChange={e => setForm((f: any) => ({ ...f, receipt_date: e.target.value }))} />
              </div>
            </div>

            {/* Search Invoice by Number — quick direct lookup */}
            <div className="border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10 p-3 rounded-md space-y-2">
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase">Quick: Search by Invoice/Bill Number</p>
              <div className="relative">
                <Input
                  placeholder="Type invoice number e.g. DDS/INV/2627/0248..."
                  value={invoiceNoSearch}
                  onChange={e => setInvoiceNoSearch(e.target.value)}
                  className="bg-white dark:bg-background"
                />
                {invoiceNoResults.length > 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 bg-background border rounded-md shadow-lg max-h-56 overflow-y-auto mt-1">
                    {invoiceNoResults.map((inv: any, i: number) => (
                      <div key={i}
                        className="p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer text-sm border-b last:border-0 flex items-center justify-between"
                        onClick={() => selectInvoiceByNumber(inv)}>
                        <div>
                          <span className="font-mono font-semibold text-purple-700 dark:text-purple-300">{inv.invoice_no}</span>
                          <span className="text-muted-foreground ml-2">{inv.customer_name}</span>
                        </div>
                        <span className="text-xs font-medium">{formatINR(parseFloat(inv.total_amount || "0"))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[10px] text-purple-500">Selecting an invoice here auto-fills the customer and links the payment to that invoice below.</p>
            </div>

            {/* Customer Search */}
            <div className="border p-3 rounded-md space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase">Customer Details</p>
              <div className="relative">
                <Input placeholder="Search customer by name/phone..." value={customerSearch}
                  onChange={e => { setCustomerSearch(e.target.value); }} />
                {customerResults.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {customerResults.map((c: any, i: number) => (
                      <div key={i} className="p-2 hover:bg-muted cursor-pointer text-sm" onClick={() => selectCustomer(c)}>
                        <span className="font-medium">{c.name}</span> <span className="text-muted-foreground">{c.phone}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {F("customer_name", "Name *")}
                {F("customer_phone", "Phone")}
                {F("customer_address", "Address", "text", true)}
                {F("customer_city", "City")}
                {F("customer_state", "State")}
                {F("customer_pin", "PIN")}
                {F("customer_gstin", "GSTIN")}
                {F("consumer_number", "Consumer Number")}
              </div>
            </div>

            {/* Link to Invoice */}
            {invoiceResults.length > 0 && (
              <div className="border p-3 rounded-md">
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Link to Invoice/Quotation</p>
                <Select value={form.invoice_id ? String(form.invoice_id) : ""} onValueChange={v => {
                  const inv = invoiceResults.find(i => String(i.id) === v);
                  if (inv) selectInvoice(inv);
                }}>
                  <SelectTrigger><SelectValue placeholder="Select invoice..." /></SelectTrigger>
                  <SelectContent>{invoiceResults.map(inv => (
                    <SelectItem key={inv.id} value={String(inv.id)}>{inv.invoice_no} — {formatINR(parseFloat(inv.total_amount || "0"))}</SelectItem>
                  ))}</SelectContent>
                </Select>
              </div>
            )}

            {/* Payment Details */}
            <div className="border p-3 rounded-md space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase">Payment Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Payment Method</Label>
                  <Select value={form.payment_method} onValueChange={v => setForm((f: any) => ({ ...f, payment_method: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {F("reference_number", "Reference/Cheque No.")}
                <div>
                  <Label className="text-xs">Amount *</Label>
                  <Input className="mt-1" type="number" value={form.amount} onChange={e => amountChanged(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Tax Amount</Label>
                  <Input className="mt-1" type="number" value={form.tax_amount} onChange={e => taxChanged(e.target.value)} />
                </div>
                <div className="col-span-2 bg-muted/50 p-2 rounded text-center">
                  <span className="text-sm text-muted-foreground">Total: </span>
                  <span className="text-xl font-bold">{formatINR(parseFloat(form.total_amount) || 0)}</span>
                </div>
              </div>
              {F("description", "Description", "text", true)}
            </div>

            {/* Plant Spec (for down payment) */}
            {(
              <div className="border p-3 rounded-md space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase">Plant Specification</p>
                  {F("consumer_number", "Consumer Number")}
                  <div>
                    <Label className="text-xs">Plant Capacity</Label>
                    <Select value={form.plant_capacity||""} onValueChange={v => setForm((f: any) => ({...f, plant_capacity: v}))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select capacity..." /></SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7,8,9,10,12,15,20,25,30,40,50,60,75,100,150,200,250,300,500,750,1000].map(k => (
                          <SelectItem key={k} value={k+" KW"}>{k} KW</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Solar Panel</Label>
                    <Select value={form.panel_spec||""} onValueChange={v => setForm((f: any) => ({...f, panel_spec: v}))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select panel..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="550W DCR PERC Bifacial">550W DCR PERC Bifacial</SelectItem>
                        <SelectItem value="560W DCR TopCon Bifacial">560W DCR TopCon Bifacial</SelectItem>
                        <SelectItem value="580W DCR TopCon Bifacial">580W DCR TopCon Bifacial</SelectItem>
                        <SelectItem value="590W TopCon Bifacial">590W TopCon Bifacial</SelectItem>
                        <SelectItem value="600W TopCon Bifacial">600W TopCon Bifacial</SelectItem>
                        <SelectItem value="600W TopCon DCR Bifacial">600W TopCon DCR Bifacial</SelectItem>
                        <SelectItem value="500W DCR Bifacial">500W DCR Bifacial</SelectItem>
                        <SelectItem value="550W Bifacial Mono PERC">550W Bifacial Mono PERC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Inverter</Label>
                    <Select value={form.inverter_spec||""} onValueChange={v => setForm((f: any) => ({...f, inverter_spec: v}))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select inverter..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3KW On-Grid Inverter">3KW On-Grid</SelectItem>
                        <SelectItem value="5KW On-Grid Inverter">5KW On-Grid</SelectItem>
                        <SelectItem value="3.6KW 24V Hybrid IP21">3.6KW 24V Hybrid IP21</SelectItem>
                        <SelectItem value="3.6KW 48V Hybrid IP21">3.6KW 48V Hybrid IP21</SelectItem>
                        <SelectItem value="3KW 48V HF Hybrid IP65">3KW 48V HF Hybrid IP65</SelectItem>
                        <SelectItem value="5KW 1PH HF Hybrid IP65">5KW 1PH HF Hybrid IP65</SelectItem>
                        <SelectItem value="5KW 3PH HF Hybrid IP65">5KW 3PH HF Hybrid IP65</SelectItem>
                        <SelectItem value="10KW HF Hybrid IP65">10KW HF Hybrid IP65</SelectItem>
                        <SelectItem value="20KW HF Hybrid IP65">20KW HF Hybrid IP65</SelectItem>
                        <SelectItem value="3KW Off-Grid Elegoria">3KW Off-Grid Elegoria</SelectItem>
                        <SelectItem value="5KW Off-Grid Elegoria">5KW Off-Grid Elegoria</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Battery</Label>
                    <Select value={form.battery_spec||""} onValueChange={v => setForm((f: any) => ({...f, battery_spec: v}))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select battery..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100Ah Lithium 5.12kWh">100Ah Lithium 5.12kWh</SelectItem>
                        <SelectItem value="150Ah Lithium 7.68kWh">150Ah Lithium 7.68kWh</SelectItem>
                        <SelectItem value="150Ah/60mo Tall Tubular">150Ah/60mo Tall Tubular</SelectItem>
                        <SelectItem value="150Ah/60mo Tubular PTT">150Ah/60mo Tubular PTT</SelectItem>
                        <SelectItem value="200Ah/60mo Tall Tubular">200Ah/60mo Tall Tubular</SelectItem>
                        <SelectItem value="200Ah/72mo Tubular PTT">200Ah/72mo Tubular PTT</SelectItem>
                        <SelectItem value="No Battery (On-Grid)">No Battery (On-Grid)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
              </div>
            )}

            <div>{F("notes", "Notes", "text", true)}</div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editId ? "Update" : "Create Receipt"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
