import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Package, Plus, AlertTriangle, Save, Loader2, Pencil, Search, Filter } from "lucide-react";

interface Product {
  id: number; name: string; model_code: string; hsn_code: string; category: string; subcategory: string;
  unit: string; default_sale_price: string; default_purchase_price: string; gst_rate: string;
  description: string; warranty: string; is_active: boolean;
}
interface StockItem {
  id: number; name: string; category: string; hsn_code: string; unit: string;
  current_qty: string; reserved_qty: string; available_qty: string;
  reorder_level: string; low_stock: boolean;
  default_sale_price: string; default_purchase_price: string; stock_value: string;
}

function formatINR(n: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n); }

const SUBCATS: Record<string, string> = {
  panel_dcr: "Solar Panels — DCR",
  panel_nondcr: "Solar Panels — Non-DCR",
  inverter_ip65: "Solar Inverter — IP65 Hybrid",
  inverter_small_pwm: "Solar Inverter — Small Range (PWM)",
  inverter_offgrid: "Solar Inverter — Off-Grid (MPPT/PCU)",
  inverter_gi_ongrid: "Solar Inverter — On-Grid (GI)",
  inverter_gih: "Solar Inverter — Grid Interactive Hybrid",
  battery_leadacid: "Lead Acid Battery",
  battery_lithium: "Lithium Battery",
  combo_hybrid: "Complete Plant — Hybrid Solar",
  combo_ongrid: "Complete Plant — On-Grid Solar",
  combo_offgrid: "Complete Plant — Off-Grid Solar",
  combo_lithium: "Complete Plant — Lithium Hybrid",
  structure: "Mounting Structure",
  electrical: "Electrical Components",
  service: "Installation Services",
  misc: "Miscellaneous",
};

const ALL_CATS = Object.keys(SUBCATS);

export default function StockPage() {
  const [, navigate] = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [tab, setTab] = useState<"stock" | "products">("products");

  // Edit product dialog
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Stock adjust dialog
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNote, setAdjustNote] = useState("");

  // Add product dialog
  const [showAdd, setShowAdd] = useState(false);
  const [newProd, setNewProd] = useState({ name: "", model_code: "", hsn_code: "85414011", category: "panel", subcategory: "panel_dcr", unit: "Nos", default_sale_price: "", default_purchase_price: "", gst_rate: "12", description: "", warranty: "" });

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/billing/products").then(r => r.json()),
      fetch("/api/billing/stock").then(r => r.json()),
    ]).then(([p, s]) => {
      setProducts(Array.isArray(p) ? p : []);
      setStock(Array.isArray(s) ? s : []);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  // Filter products
  const filtered = products.filter(p => {
    if (catFilter !== "all" && p.subcategory !== catFilter && p.category !== catFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !(p.model_code || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Group by subcategory
  const grouped = filtered.reduce((acc, p) => {
    const key = p.subcategory || p.category || "misc";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {} as Record<string, Product[]>);

  // Stats
  const totalProducts = products.length;
  const totalValue = stock.reduce((s, i) => s + parseFloat(i.stock_value || "0"), 0);
  const lowStockCount = stock.filter(s => s.low_stock).length;
  const categories = [...new Set(products.map(p => p.subcategory || p.category))].sort();

  // Edit handlers
  const openEdit = (p: Product) => {
    setEditProduct(p);
    setEditForm({
      name: p.name, model_code: p.model_code || "", hsn_code: p.hsn_code, category: p.category,
      subcategory: p.subcategory || "", unit: p.unit, default_sale_price: p.default_sale_price,
      default_purchase_price: p.default_purchase_price, gst_rate: p.gst_rate, description: p.description || "",
      warranty: p.warranty || "",
    });
  };

  const saveEdit = async () => {
    if (!editProduct) return;
    setSaving(true);
    try {
      await fetch(`/api/billing/products/${editProduct.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      setEditProduct(null);
      load();
    } catch (e) { console.error(e); alert("Save failed"); }
    finally { setSaving(false); }
  };

  const doAdjust = async () => {
    if (!adjustProduct || !adjustQty) return;
    setSaving(true);
    try {
      await fetch("/api/billing/stock/adjust", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: adjustProduct.id, quantity: parseFloat(adjustQty), notes: adjustNote || "Manual adjustment" }),
      });
      setAdjustProduct(null); setAdjustQty(""); setAdjustNote("");
      load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const addProduct = async () => {
    if (!newProd.name) { alert("Product name required"); return; }
    setSaving(true);
    try {
      await fetch("/api/billing/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProd,
          default_sale_price: parseFloat(newProd.default_sale_price) || 0,
          default_purchase_price: parseFloat(newProd.default_purchase_price) || 0,
          gst_rate: parseFloat(newProd.gst_rate) || 12,
        }),
      });
      setShowAdd(false);
      setNewProd({ name: "", model_code: "", hsn_code: "85414011", category: "panel", subcategory: "panel_dcr", unit: "Nos", default_sale_price: "", default_purchase_price: "", gst_rate: "12", description: "", warranty: "" });
      load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  // Find stock for a product
  const getStock = (productName: string) => stock.find(s => s.name === productName);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/billing")}><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Products & Stock</h1>
            <p className="text-xs md:text-sm text-gray-500">{totalProducts} products | {lowStockCount} low stock</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === "products" ? "default" : "outline"} size="sm" onClick={() => setTab("products")}>Products</Button>
          <Button variant={tab === "stock" ? "default" : "outline"} size="sm" onClick={() => setTab("stock")}><Package className="w-4 h-4 mr-1" />Stock</Button>
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-1" />Add</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-gray-500 uppercase">Products</p>
          <p className="text-lg md:text-2xl font-bold">{totalProducts}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-gray-500 uppercase">Categories</p>
          <p className="text-lg md:text-2xl font-bold">{categories.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-gray-500 uppercase">Stock Value</p>
          <p className="text-lg md:text-2xl font-bold text-emerald-700">{formatINR(totalValue)}</p>
        </CardContent></Card>
        <Card className={lowStockCount > 0 ? "border-red-200" : ""}><CardContent className="p-3 text-center">
          <p className="text-xs text-gray-500 uppercase">Low Stock</p>
          <p className={`text-lg md:text-2xl font-bold ${lowStockCount > 0 ? "text-red-600" : ""}`}>{lowStockCount}</p>
        </CardContent></Card>
      </div>

      {/* Search + Filter */}
      <Card>
        <CardContent className="p-3 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input className="pl-9" placeholder="Search by name or model code..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-full sm:w-64"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories ({totalProducts})</SelectItem>
              {categories.map(c => (
                <SelectItem key={c} value={c}>{SUBCATS[c] || c} ({products.filter(p => (p.subcategory || p.category) === c).length})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Product List by Category */}
      {loading ? (
        <Card><CardContent className="p-8 text-center text-gray-400">Loading products...</CardContent></Card>
      ) : Object.keys(grouped).length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-400">No products found</CardContent></Card>
      ) : (
        Object.entries(grouped).sort(([a], [b]) => (SUBCATS[a] || a).localeCompare(SUBCATS[b] || b)).map(([subcat, prods]) => (
          <Card key={subcat}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm md:text-base flex items-center justify-between">
                <span>{SUBCATS[subcat] || subcat}</span>
                <Badge variant="outline">{prods.length} items</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm">
                  <thead><tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase">
                    <th className="p-2 md:p-3 text-left">Product</th>
                    <th className="p-2 md:p-3 text-center hidden md:table-cell">HSN</th>
                    <th className="p-2 md:p-3 text-right">Cost Price</th>
                    <th className="p-2 md:p-3 text-right">Sale Price</th>
                    <th className="p-2 md:p-3 text-center">GST</th>
                    {tab === "stock" && <th className="p-2 md:p-3 text-right">Stock</th>}
                    <th className="p-2 md:p-3 text-center w-24">Actions</th>
                  </tr></thead>
                  <tbody>{prods.map(p => {
                    const st = getStock(p.name);
                    return (
                      <tr key={p.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 md:p-3">
                          <div className="font-medium text-xs md:text-sm">{p.name}</div>
                          <div className="text-[10px] md:text-xs text-gray-400">{p.model_code || ""} {p.warranty ? `| ${p.warranty}` : ""}</div>
                        </td>
                        <td className="p-2 md:p-3 text-center text-gray-500 hidden md:table-cell">{p.hsn_code}</td>
                        <td className="p-2 md:p-3 text-right text-gray-500">{formatINR(parseFloat(p.default_purchase_price))}</td>
                        <td className="p-2 md:p-3 text-right font-medium">{formatINR(parseFloat(p.default_sale_price))}</td>
                        <td className="p-2 md:p-3 text-center"><Badge className="bg-blue-100 text-blue-800 text-[10px]">{p.gst_rate}%</Badge></td>
                        {tab === "stock" && (
                          <td className="p-2 md:p-3 text-right">
                            {st ? (
                              <span className={parseFloat(st.current_qty) <= parseFloat(st.reorder_level) ? "text-red-600 font-bold" : ""}>
                                {parseFloat(st.current_qty)} {p.unit}
                                {parseFloat(st.current_qty) <= parseFloat(st.reorder_level) && <AlertTriangle className="w-3 h-3 inline ml-1 text-red-500" />}
                              </span>
                            ) : "—"}
                          </td>
                        )}
                        <td className="p-2 md:p-3 text-center">
                          <div className="flex gap-1 justify-center">
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openEdit(p)}>
                              <Pencil className="w-3 h-3 mr-1" />Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-emerald-600" onClick={() => { setAdjustProduct(p); setAdjustQty(""); setAdjustNote(""); }}>
                              <Plus className="w-3 h-3 mr-1" />Stock
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* ═══ Edit Product Dialog ═══ */}
      <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Product</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Product Name</Label><Input value={editForm.name || ""} onChange={e => setEditForm({...editForm, name: e.target.value})} /></div>
            <div><Label>Model Code</Label><Input value={editForm.model_code || ""} onChange={e => setEditForm({...editForm, model_code: e.target.value})} /></div>
            <div><Label>HSN Code</Label><Input value={editForm.hsn_code || ""} onChange={e => setEditForm({...editForm, hsn_code: e.target.value})} /></div>
            <div><Label>Cost Price (₹)</Label><Input type="number" value={editForm.default_purchase_price || ""} onChange={e => setEditForm({...editForm, default_purchase_price: e.target.value})} /></div>
            <div><Label>Sale Price (₹)</Label><Input type="number" value={editForm.default_sale_price || ""} onChange={e => setEditForm({...editForm, default_sale_price: e.target.value})} /></div>
            <div><Label>GST Rate %</Label>
              <Select value={String(editForm.gst_rate || "12")} onValueChange={v => setEditForm({...editForm, gst_rate: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[0,5,12,18,28].map(r => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Unit</Label><Input value={editForm.unit || ""} onChange={e => setEditForm({...editForm, unit: e.target.value})} /></div>
            <div><Label>Category</Label>
              <Select value={editForm.subcategory || editForm.category || ""} onValueChange={v => setEditForm({...editForm, subcategory: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(SUBCATS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Warranty</Label><Input value={editForm.warranty || ""} onChange={e => setEditForm({...editForm, warranty: e.target.value})} /></div>
            <div className="col-span-2"><Label>Description</Label><Input value={editForm.description || ""} onChange={e => setEditForm({...editForm, description: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProduct(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Stock Adjust Dialog ═══ */}
      <Dialog open={!!adjustProduct} onOpenChange={() => setAdjustProduct(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Adjust Stock: {adjustProduct?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Quantity (+ve to add, -ve to remove)</Label><Input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} placeholder="e.g. 10 or -5" autoFocus /></div>
            <div><Label>Note / Reason</Label><Input value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="Purchase from Livguard / Sold to customer" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustProduct(null)}>Cancel</Button>
            <Button onClick={doAdjust} disabled={saving || !adjustQty} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Add Product Dialog ═══ */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Product Name *</Label><Input value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})} /></div>
            <div><Label>Model Code</Label><Input value={newProd.model_code} onChange={e => setNewProd({...newProd, model_code: e.target.value})} /></div>
            <div><Label>HSN Code *</Label><Input value={newProd.hsn_code} onChange={e => setNewProd({...newProd, hsn_code: e.target.value})} /></div>
            <div><Label>Category</Label>
              <Select value={newProd.subcategory} onValueChange={v => setNewProd({...newProd, subcategory: v, category: v.split("_")[0]})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(SUBCATS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Unit</Label><Input value={newProd.unit} onChange={e => setNewProd({...newProd, unit: e.target.value})} /></div>
            <div><Label>Cost Price (₹)</Label><Input type="number" value={newProd.default_purchase_price} onChange={e => setNewProd({...newProd, default_purchase_price: e.target.value})} /></div>
            <div><Label>Sale Price (₹)</Label><Input type="number" value={newProd.default_sale_price} onChange={e => setNewProd({...newProd, default_sale_price: e.target.value})} /></div>
            <div><Label>GST %</Label>
              <Select value={newProd.gst_rate} onValueChange={v => setNewProd({...newProd, gst_rate: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[0,5,12,18,28].map(r => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Warranty</Label><Input value={newProd.warranty} onChange={e => setNewProd({...newProd, warranty: e.target.value})} /></div>
            <div className="col-span-2"><Label>Description</Label><Input value={newProd.description} onChange={e => setNewProd({...newProd, description: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={addProduct} disabled={saving || !newProd.name}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}Add Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
