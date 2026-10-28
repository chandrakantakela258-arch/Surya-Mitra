import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, Download, Mail, Send, Search, Plus, Trash2, ArrowLeft,
  Package, ChevronDown, ChevronRight, Phone, User, Building2, Loader2
} from "lucide-react";

// ── Segment icons & colors ───────────────────────────────────
const SEGMENT_META: Record<string, { icon: string; color: string }> = {
  "Solar Panels":                         { icon: "☀️", color: "#f59e0b" },
  "Solar Inverter IPD 21":                { icon: "⚡", color: "#3b82f6" },
  "Solar High Frequency Inverter IP65":   { icon: "🔌", color: "#8b5cf6" },
  "Ongrid Inverter":                      { icon: "🔗", color: "#10b981" },
  "Offgrid Inverter":                     { icon: "🔋", color: "#06b6d4" },
  "Acid Lead Battery":                    { icon: "🪫", color: "#ef4444" },
  "Lithium Battery":                      { icon: "🔋", color: "#22c55e" },
  "Solar EPC Power Project":              { icon: "🏗️", color: "#1e3a5f" },
};

// ── Segment display order ────────────────────────────────────
const SEGMENT_ORDER = [
  "Solar Panels",
  "Solar Inverter IPD 21",
  "Solar High Frequency Inverter IP65",
  "Ongrid Inverter",
  "Offgrid Inverter",
  "Acid Lead Battery",
  "Lithium Battery",
  "Solar EPC Power Project",
];

// ── Indian states for GST ────────────────────────────────────
const INDIAN_STATES = [
  { code: "01", name: "Jammu & Kashmir" }, { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" }, { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" }, { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" }, { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" }, { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" }, { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" }, { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" }, { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" }, { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" }, { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" }, { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" }, { code: "24", name: "Gujarat" },
  { code: "27", name: "Maharashtra" }, { code: "29", name: "Karnataka" },
  { code: "32", name: "Kerala" }, { code: "33", name: "Tamil Nadu" },
  { code: "36", name: "Telangana" }, { code: "37", name: "Andhra Pradesh" },
];

const GST_RATES = ["0", "5", "12", "18", "28"];

interface Product {
  id: number;
  name: string;
  price: number;
  hsn_code: string;
  gst_rate: number;
  unit: string;
  segment: string;
  sub_segment?: string;
  is_combo: boolean;
  specifications?: any;
}

interface LineItem {
  key: string;
  product_id: number | null;
  product_name: string;
  hsn_code: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percent: number;
  gst_rate: number;
  segment?: string;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
  city: string;
  state: string;
  state_code: string;
  pin: string;
}

export default function QuotationForm() {
  const { toast } = useToast();
  
  // ── State ──────────────────────────────────────────────────
  const [companyId, setCompanyId] = useState("1");
  const [companies, setCompanies] = useState<any[]>([]);
  const [segments, setSegments] = useState<Record<string, Product[]>>({});
  const [expandedSegments, setExpandedSegments] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Customer
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerForm, setCustomerForm] = useState({
    name: "", phone: "", email: "", gstin: "",
    address: "", city: "", state: "Bihar", state_code: "10", pin: ""
  });
  
  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    createEmptyLine()
  ]);
  
  // Quotation meta
  const [notes, setNotes] = useState("");
  const [validDays, setValidDays] = useState("15");
  const [savedQuotationId, setSavedQuotationId] = useState<number | null>(null);
  
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // ── Load data ──────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch("/api/billing/products/segments").then(r => r.json()),
      fetch("/api/billing/companies").then(r => r.json()),
    ]).then(([prodData, compData]) => {
      setSegments(prodData.segments || {});
      setCompanies(compData.companies || compData || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      toast({ title: "Error", description: "Failed to load products", variant: "destructive" });
      setLoading(false);
    });
  }, []);
  
  // ── Customer search with debounce ──────────────────────────
  useEffect(() => {
    if (customerSearch.length < 2) {
      setCustomerResults([]);
      setShowCustomerDropdown(false);
      return;
    }
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/billing/customers/search?q=${encodeURIComponent(customerSearch)}`);
        const data = await res.json();
        setCustomerResults(data.customers || []);
        setShowCustomerDropdown(true);
      } catch (err) {
        console.error(err);
      }
    }, 300);
  }, [customerSearch]);
  
  // ── Select customer from dropdown ──────────────────────────
  function selectCustomer(cust: Customer) {
    setSelectedCustomer(cust);
    setCustomerForm({
      name: cust.name || "",
      phone: cust.phone || "",
      email: cust.email || "",
      gstin: cust.gstin || "",
      address: cust.address || "",
      city: cust.city || cust.district || "",
      state: cust.state || "Bihar",
      state_code: cust.state_code || "10",
      pin: cust.pin || "",
    });
    setCustomerSearch(cust.name);
    setShowCustomerDropdown(false);
  }
  
  // ── Line item helpers ──────────────────────────────────────
  function createEmptyLine(): LineItem {
    return {
      key: Math.random().toString(36).slice(2),
      product_id: null,
      product_name: "",
      hsn_code: "",
      quantity: 1,
      unit: "Pcs",
      unit_price: 0,
      discount_percent: 0,
      gst_rate: 12,
    };
  }
  
  function addProductToQuotation(product: Product) {
    const existing = lineItems.find(li => li.product_id === product.id);
    if (existing) {
      setLineItems(prev => prev.map(li =>
        li.product_id === product.id ? { ...li, quantity: li.quantity + 1 } : li
      ));
      toast({ title: "Quantity Updated", description: `${product.name} qty +1` });
      return;
    }
    
    const newLine: LineItem = {
      key: Math.random().toString(36).slice(2),
      product_id: product.id,
      product_name: product.name,
      hsn_code: product.hsn_code,
      quantity: 1,
      unit: product.unit || "Pcs",
      unit_price: product.price,
      discount_percent: 0,
      gst_rate: product.gst_rate || 12,
      segment: product.segment,
    };
    
    // Replace first empty line or add new
    const emptyIdx = lineItems.findIndex(li => !li.product_id && !li.product_name);
    if (emptyIdx >= 0) {
      setLineItems(prev => prev.map((li, i) => i === emptyIdx ? newLine : li));
    } else {
      setLineItems(prev => [...prev, newLine]);
    }
    
    toast({ title: "Added", description: product.name });
  }
  
  function updateLineItem(key: string, field: keyof LineItem, value: any) {
    setLineItems(prev => prev.map(li => li.key === key ? { ...li, [field]: value } : li));
  }
  
  function removeLine(key: string) {
    setLineItems(prev => {
      const filtered = prev.filter(li => li.key !== key);
      return filtered.length === 0 ? [createEmptyLine()] : filtered;
    });
  }
  
  // ── Calculations ───────────────────────────────────────────
  const companyState = companies.find(c => c.id === Number(companyId))?.state_code || "10";
  const isIntraState = companyState === customerForm.state_code;
  
  const calculations = lineItems.map(li => {
    const amount = li.quantity * li.unit_price;
    const discountAmt = amount * li.discount_percent / 100;
    const taxable = amount - discountAmt;
    const gstAmt = taxable * li.gst_rate / 100;
    const cgst = isIntraState ? gstAmt / 2 : 0;
    const sgst = isIntraState ? gstAmt / 2 : 0;
    const igst = isIntraState ? 0 : gstAmt;
    return { amount, discountAmt, taxable, cgst, sgst, igst, total: taxable + gstAmt };
  });
  
  const totals = calculations.reduce((acc, c) => ({
    subtotal: acc.subtotal + c.taxable,
    cgst: acc.cgst + c.cgst,
    sgst: acc.sgst + c.sgst,
    igst: acc.igst + c.igst,
    grand: acc.grand + c.total,
  }), { subtotal: 0, cgst: 0, sgst: 0, igst: 0, grand: 0 });
  
  // ── Toggle segment ────────────────────────────────────────
  function toggleSegment(seg: string) {
    setExpandedSegments(prev => {
      const next = new Set(prev);
      next.has(seg) ? next.delete(seg) : next.add(seg);
      return next;
    });
  }
  
  // ── Save quotation ────────────────────────────────────────
  async function saveQuotation() {
    if (!customerForm.name) {
      toast({ title: "Error", description: "Customer name is required", variant: "destructive" });
      return;
    }
    if (lineItems.every(li => !li.product_name && !li.product_id)) {
      toast({ title: "Error", description: "Add at least one product", variant: "destructive" });
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        company_id: Number(companyId),
        invoice_type: "quotation",
        customer_id: selectedCustomer?.id || null,
        customer_name: customerForm.name,
        buyer_gstin: customerForm.gstin,
        buyer_address: customerForm.address,
        buyer_city: customerForm.city,
        buyer_state: customerForm.state,
        buyer_state_code: customerForm.state_code,
        buyer_pin: customerForm.pin,
        buyer_phone: customerForm.phone,
        buyer_email: customerForm.email,
        due_date: new Date(Date.now() + Number(validDays) * 86400000).toISOString().split("T")[0],
        notes,
        items: lineItems.filter(li => li.product_name || li.product_id).map(li => ({
          product_id: li.product_id,
          description: li.product_name,
          product_name: li.product_name,
          hsn_code: li.hsn_code,
          quantity: li.quantity,
          unit: li.unit,
          unit_price: li.unit_price,
          discount_percent: li.discount_percent,
          gst_rate: li.gst_rate,
        })),
      };
      
      const res = await fetch("/api/billing/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      
      setSavedQuotationId(data.invoice?.id || data.id);
      toast({ title: "✅ Quotation Saved!", description: `${data.invoice?.invoice_no || 'Saved'}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }
  
  // ── PDF / Email / WhatsApp actions ─────────────────────────
  function openPDF() {
    if (!savedQuotationId) {
      toast({ title: "Save first", description: "Please save the quotation before downloading PDF", variant: "destructive" });
      return;
    }
    window.print();
  }
  
  async function sendEmail() {
    if (!savedQuotationId) {
      toast({ title: "Save first", description: "Please save the quotation first", variant: "destructive" });
      return;
    }
    const email = customerForm.email;
    if (!email) return;
    
    try {
      const res = await fetch(`/api/billing/quotations/${savedQuotationId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      // Fallback: open mailto
      const subject = encodeURIComponent(`Quotation — Divyanshi Solar`);
      const body = encodeURIComponent(
        `Dear ${customerForm.name},\n\nPlease find your quotation.\nTotal: ₹${totals.grand.toLocaleString('en-IN')}\n\nView: ${window.location.origin}/api/billing/quotations/${savedQuotationId}/pdf\n\nThank you,\nDivyanshi Solar\n📞 9801005212`
      );
      window.open(`mailto:${email}?subject=${subject}&body=${body}`);
      toast({ title: "✅ Email", description: `Opening mail client for ${email}` });
    } catch (err) {
      console.error(err);
    }
  }
  
  async function sendWhatsApp() {
    if (!savedQuotationId) {
      toast({ title: "Save first", description: "Please save the quotation first", variant: "destructive" });
      return;
    }
    const phone = customerForm.phone || prompt("Enter customer WhatsApp number:");
    if (!phone) return;
    
    try {
      const res = await fetch(`/api/billing/quotations/${savedQuotationId}/send-whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      
      if (data.whatsapp_url) {
        window.open(data.whatsapp_url, "_blank");
      }
      toast({ title: "✅ WhatsApp", description: "Opening WhatsApp" });
    } catch (err) {
      console.error(err);
    }
  }
  
  // ── Render ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-lg">Loading product catalog...</span>
      </div>
    );
  }
  
  const orderedSegments = SEGMENT_ORDER.filter(s => segments[s]?.length > 0);
  // Add any segments not in our order
  Object.keys(segments).forEach(s => {
    if (!orderedSegments.includes(s) && segments[s]?.length > 0) {
      orderedSegments.push(s);
    }
  });
  
  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">Create Quotation</h1>
            <p className="text-sm text-muted-foreground">Select products by segment, auto-fill customer</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openPDF} disabled={!savedQuotationId}>
            <Download className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button variant="outline" onClick={sendEmail} disabled={!savedQuotationId}
            className="text-blue-600 border-blue-300 hover:bg-blue-50">
            <Mail className="w-4 h-4 mr-2" /> Email
          </Button>
          <Button variant="outline" onClick={sendWhatsApp} disabled={!savedQuotationId}
            className="text-green-600 border-green-300 hover:bg-green-50">
            <Phone className="w-4 h-4 mr-2" /> WhatsApp
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ═══ LEFT: Product Catalog by Segment ═══ */}
        <div className="lg:col-span-1 space-y-2 max-h-[85vh] overflow-y-auto pr-2">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
            📦 Product Catalog
          </h3>
          
          {orderedSegments.map(segName => {
            const meta = SEGMENT_META[segName] || { icon: "📦", color: "#6b7280" };
            const products = segments[segName] || [];
            const isOpen = expandedSegments.has(segName);
            
            return (
              <div key={segName} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSegment(segName)}
                  className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
                  style={{ borderLeft: `4px solid ${meta.color}` }}
                >
                  <span className="flex items-center gap-2 font-medium text-sm">
                    <span>{meta.icon}</span>
                    {segName}
                    <Badge variant="secondary" className="text-xs">{products.length}</Badge>
                  </span>
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                
                {isOpen && (
                  <div className="border-t divide-y">
                    {products.map((prod: Product) => (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between p-2 px-3 hover:bg-accent/30 cursor-pointer group text-sm"
                        onClick={() => addProductToQuotation(prod)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{prod.name}</div>
                          <div className="text-xs text-muted-foreground">
                            HSN: {prod.hsn_code} | GST: {prod.gst_rate}%
                            {prod.is_combo && <Badge className="ml-1 text-[10px] py-0" variant="default">COMBO</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <span className="font-semibold text-primary whitespace-nowrap">
                            ₹{prod.price.toLocaleString('en-IN')}
                          </span>
                          <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 text-green-600 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* ═══ RIGHT: Quotation Form ═══ */}
        <div className="lg:col-span-2 space-y-6">
          {/* ── Company & Customer ─────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Billing Company
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            
            {/* Customer search + auto-populate */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="w-4 h-4" /> Customer (Auto-populate)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name, phone, email, GSTIN..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setSelectedCustomer(null);
                    }}
                    className="pl-9"
                  />
                  
                  {showCustomerDropdown && customerResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {customerResults.map(cust => (
                        <div
                          key={cust.id}
                          className="p-2 px-3 hover:bg-accent cursor-pointer border-b last:border-0"
                          onClick={() => selectCustomer(cust)}
                        >
                          <div className="font-medium text-sm">{cust.name}</div>
                          <div className="text-xs text-muted-foreground">
                            📞 {cust.phone} {cust.email && `| ✉️ ${cust.email}`}
                            {cust.gstin && ` | GST: ${cust.gstin}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedCustomer && (
                  <p className="text-xs text-green-600 mt-1">✅ Auto-filled from: {selectedCustomer.name}</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* ── Customer details ──────────────────────────── */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Customer Name *</Label>
                  <Input value={customerForm.name} onChange={e => setCustomerForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input value={customerForm.phone} onChange={e => setCustomerForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input value={customerForm.email} onChange={e => setCustomerForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">GSTIN</Label>
                  <Input value={customerForm.gstin} onChange={e => setCustomerForm(f => ({ ...f, gstin: e.target.value }))} placeholder="Optional" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Address</Label>
                  <Input value={customerForm.address} onChange={e => setCustomerForm(f => ({ ...f, address: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">City</Label>
                  <Input value={customerForm.city} onChange={e => setCustomerForm(f => ({ ...f, city: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">State</Label>
                  <Select value={customerForm.state_code} onValueChange={v => {
                    const st = INDIAN_STATES.find(s => s.code === v);
                    setCustomerForm(f => ({ ...f, state: st?.name || "", state_code: v }));
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map(s => (
                        <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* ── Line Items Table ──────────────────────────── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4" /> Line Items
                </span>
                <Button size="sm" variant="outline" onClick={() => setLineItems(prev => [...prev, createEmptyLine()])}>
                  <Plus className="w-3 h-3 mr-1" /> Add Row
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-primary/5 text-left">
                      <th className="p-2 w-8">#</th>
                      <th className="p-2">Product</th>
                      <th className="p-2 w-16">HSN</th>
                      <th className="p-2 w-16">Qty</th>
                      <th className="p-2 w-24">Rate (₹)</th>
                      <th className="p-2 w-16">Disc%</th>
                      <th className="p-2 w-16">GST%</th>
                      <th className="p-2 w-24 text-right">Amount</th>
                      <th className="p-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((li, idx) => {
                      const calc = calculations[idx];
                      return (
                        <tr key={li.key} className="border-b hover:bg-accent/20">
                          <td className="p-2 text-center text-muted-foreground">{idx + 1}</td>
                          <td className="p-2">
                            <Input
                              value={li.product_name}
                              onChange={e => updateLineItem(li.key, "product_name", e.target.value)}
                              placeholder="Product name or custom description"
                              className="h-8 text-sm"
                            />
                            {li.segment && (
                              <span className="text-[10px] text-muted-foreground">{li.segment}</span>
                            )}
                          </td>
                          <td className="p-2">
                            <Input value={li.hsn_code} onChange={e => updateLineItem(li.key, "hsn_code", e.target.value)}
                              className="h-8 text-sm w-16" />
                          </td>
                          <td className="p-2">
                            <Input type="number" value={li.quantity} min={1}
                              onChange={e => updateLineItem(li.key, "quantity", Number(e.target.value))}
                              className="h-8 text-sm w-16" />
                          </td>
                          <td className="p-2">
                            <Input type="number" value={li.unit_price} min={0}
                              onChange={e => updateLineItem(li.key, "unit_price", Number(e.target.value))}
                              className="h-8 text-sm w-24" />
                          </td>
                          <td className="p-2">
                            <Input type="number" value={li.discount_percent} min={0} max={100}
                              onChange={e => updateLineItem(li.key, "discount_percent", Number(e.target.value))}
                              className="h-8 text-sm w-16" />
                          </td>
                          <td className="p-2">
                            <Select value={String(li.gst_rate)} onValueChange={v => updateLineItem(li.key, "gst_rate", Number(v))}>
                              <SelectTrigger className="h-8 text-sm w-16"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {GST_RATES.map(r => <SelectItem key={r} value={r}>{r}%</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-2 text-right font-medium">
                            ₹{(calc?.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-2">
                            <Button variant="ghost" size="sm" onClick={() => removeLine(li.key)}
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* ── Totals ────────────────────────────────── */}
              <div className="flex justify-between mt-4">
                <div className="space-y-2 w-64">
                  <div>
                    <Label className="text-xs">Notes</Label>
                    <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Additional notes..." rows={3} className="text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Valid for (days)</Label>
                    <Input type="number" value={validDays} onChange={e => setValidDays(e.target.value)}
                      className="w-24 h-8 text-sm" />
                  </div>
                </div>
                
                <div className="w-72 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium">₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {isIntraState ? (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <span>CGST</span>
                        <span>₹{totals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>SGST</span>
                        <span>₹{totals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-muted-foreground">
                      <span>IGST</span>
                      <span>₹{totals.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t-2 border-primary font-bold text-lg text-primary">
                    <span>Grand Total</span>
                    <span>₹{totals.grand.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isIntraState ? "Intra-State (CGST + SGST)" : "Inter-State (IGST)"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* ── Action Buttons ────────────────────────────── */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => window.history.back()}>Cancel</Button>
            <Button onClick={saveQuotation} disabled={saving} className="min-w-[160px]">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              {savedQuotationId ? "Update Quotation" : "Save Quotation"}
            </Button>
          </div>
          
          {/* ── Post-save actions ─────────────────────────── */}
          {savedQuotationId && (
            <Card className="border-green-300 bg-green-50/50">
              <CardContent className="pt-4">
                <p className="text-sm font-medium text-green-800 mb-3">
                  ✅ Quotation saved! Now you can:
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={openPDF} className="bg-amber-500 hover:bg-amber-600">
                    <Download className="w-4 h-4 mr-2" /> Download PDF
                  </Button>
                  <Button size="sm" onClick={sendEmail} className="bg-blue-500 hover:bg-blue-600">
                    <Mail className="w-4 h-4 mr-2" /> Send via Email
                  </Button>
                  <Button size="sm" onClick={sendWhatsApp} className="bg-green-600 hover:bg-green-700">
                    <Send className="w-4 h-4 mr-2" /> Send via WhatsApp
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
