/**
 * Billing Customer List — /admin/billing/customers
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Users, ArrowLeft, Pencil, Trash2, AlertTriangle, Phone, Mail, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATES = [
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
  { code: "30", name: "Goa" }, { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" }, { code: "34", name: "Puducherry" },
  { code: "36", name: "Telangana" }, { code: "37", name: "Andhra Pradesh" },
];

interface Customer {
  id: number; name: string; gstin: string; pan: string;
  address: string; city: string; state: string; state_code: string; pin: string;
  phone: string; email: string; customer_type: string;
  plant_capacity: string; panel_spec: string; inverter_spec: string; battery_spec: string; consumer_number: string;
}

const emptyCustomer: Customer = {
  id: 0, name: "", gstin: "", pan: "", address: "", city: "",
  state: "Bihar", state_code: "10", pin: "", phone: "", email: "",
  customer_type: "B2C",
  plant_capacity: "", panel_spec: "", inverter_spec: "", battery_spec: "", consumer_number: ""
};

export default function BillingCustomerList() {
  const [, navigate] = useLocation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Customer>({ ...emptyCustomer });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    fetch("/api/billing/customers").then(r => r.json())
      .then(data => setCustomers(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = customers.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return c.name?.toLowerCase().includes(s) || c.phone?.includes(s) ||
      c.gstin?.toLowerCase().includes(s) || c.city?.toLowerCase().includes(s) ||
      c.email?.toLowerCase().includes(s);
  });

  const openNew = () => { setForm({ ...emptyCustomer }); setDialogOpen(true); };
  const openEdit = (c: Customer) => { setForm({ ...c }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name required", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const isEdit = form.id > 0;
      const res = await fetch(
        isEdit ? `/api/billing/customers/${form.id}` : "/api/billing/customers",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      if (res.ok) {
        toast({ title: isEdit ? "Customer updated" : "Customer created" });
        setDialogOpen(false);
        load();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/billing/customers/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Customer deleted" }); load();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
    setDeleteId(null);
  };

  const F = (field: keyof Customer, label: string, type = "text", colSpan = false) => (
    <div className={colSpan ? "col-span-2" : ""}>
      <Label className="text-xs">{label}</Label>
      <Input className="mt-1" type={type} value={(form as any)[field] || ""}
        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
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
            <h1 className="text-2xl font-bold">Billing Customers</h1>
            <p className="text-sm text-muted-foreground">{customers.length} customers</p>
          </div>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Add Customer</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by name, phone, email, GSTIN..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {deleteId && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span className="font-medium">Delete this customer permanently?</span>
            </div>
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
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No customers found</p>
          </CardContent></Card>
        ) : filtered.map(c => (
          <Card key={c.id} className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-base">{c.name}</span>
                    <Badge variant="outline" className="text-xs">{c.customer_type}</Badge>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground flex flex-wrap gap-x-4">
                    {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
                    {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-3">
                    {c.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.address}{c.city ? `, ${c.city}` : ""}</span>}
                    {c.state && <span>{c.state} ({c.state_code})</span>}
                    {c.gstin && <span>GSTIN: {c.gstin}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive hover:text-destructive"
                    onClick={() => { if(confirm("Delete this customer permanently?")) handleDelete(c.id); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id > 0 ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {F("name", "Customer Name *", "text", true)}
            {F("phone", "Phone")}
            {F("email", "Email", "email")}
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={form.customer_type} onValueChange={v => setForm(f => ({ ...f, customer_type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="B2C">B2C</SelectItem>
                  <SelectItem value="B2B">B2B</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {F("gstin", "GSTIN")}
            {F("pan", "PAN")}
            {F("address", "Address", "text", true)}
            {F("city", "City")}
            {F("pin", "PIN Code")}
            <div>
              <Label className="text-xs">State</Label>
              <Select value={form.state_code} onValueChange={v => {
                const st = STATES.find(s => s.code === v);
                setForm(f => ({ ...f, state: st?.name || "", state_code: v }));
              }}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATES.map(s => <SelectItem key={s.code} value={s.code}>{s.name} ({s.code})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          <div className="col-span-2 border-t pt-3 mt-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">Plant Specification</p>
            </div>
            {F("consumer_number", "Consumer Number")}
            {F("plant_capacity", "Plant Capacity (e.g. 3KW)")}
            {F("panel_spec", "Panel Specification")}
            {F("inverter_spec", "Inverter Specification")}
            {F("battery_spec", "Battery Specification")}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : form.id > 0 ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
