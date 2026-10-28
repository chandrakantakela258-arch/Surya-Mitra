/**
 * Invoice Detail — /admin/billing/invoices/:id
 * View invoice with line items, record payments, print
 */
import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Printer, IndianRupee, Ban, Loader2, Pencil, Trash2 } from "lucide-react";

function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
}

export default function InvoiceDetail() {
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [payAmt, setPayAmt] = useState("");
  const [payMode, setPayMode] = useState("bank_transfer");
  const [payRef, setPayRef] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [editPayId, setEditPayId] = useState<number | null>(null);
  const [editAmt, setEditAmt] = useState("");
  const [editMode, setEditMode] = useState("bank_transfer");
  const [editRef, setEditRef] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/billing/invoices/${params.id}`).then(r => r.json()).then(setInvoice).finally(() => setLoading(false));
    loadPayments();
  };
  const loadPayments = () => {
    fetch(`/api/billing/invoices/${params.id}/payments`).then(r => r.json()).then(d => setPayments(Array.isArray(d) ? d : [])).catch(() => setPayments([]));
  };
  useEffect(() => { load(); }, [params.id]);

  const openEditPayment = (p: any) => {
    setEditPayId(p.id);
    setEditAmt(String(p.amount));
    setEditMode(p.payment_mode || "bank_transfer");
    setEditRef(p.reference_no || "");
    setEditDate(p.payment_date?.split("T")[0] || new Date().toISOString().split("T")[0]);
  };

  const saveEditPayment = async () => {
    if (!editPayId || !editAmt || parseFloat(editAmt) <= 0) return;
    setEditSaving(true);
    try {
      await fetch(`/api/billing/payments/${editPayId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(editAmt), payment_mode: editMode, reference_no: editRef, payment_date: editDate }),
      });
      setEditPayId(null);
      load();
    } catch (e) { console.error(e); } finally { setEditSaving(false); }
  };

  const deletePayment = async (id: number) => {
    if (!confirm("Delete this payment record? Invoice balance will be recalculated.")) return;
    try {
      await fetch(`/api/billing/payments/${id}`, { method: "DELETE" });
      load();
    } catch (e) { console.error(e); }
  };

  const recordPayment = async () => {
    if (!payAmt || parseFloat(payAmt) <= 0) return;
    setSaving(true);
    try {
      await fetch(`/api/billing/invoices/${params.id}/payment`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(payAmt), payment_mode: payMode, reference_no: payRef, payment_date: payDate }),
      });
      setShowPayment(false); setPayAmt(""); setPayRef("");
      load();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const cancelInvoice = async () => {
    if (!confirm("Are you sure you want to cancel this invoice?")) return;
    const reason = prompt("Cancel reason:");
    await fetch(`/api/billing/invoices/${params.id}/cancel`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reason || "Cancelled" }),
    });
    load();
  };

  const statusColor: Record<string, string> = { paid: "bg-emerald-100 text-emerald-800", partial: "bg-amber-100 text-amber-800", unpaid: "bg-red-100 text-red-800" };

  if (loading) return <div className="p-6"><div className="h-96 bg-gray-50 animate-pulse rounded-lg" /></div>;
  if (!invoice) return <div className="p-6 text-center text-gray-500">Invoice not found</div>;

  const inv = invoice;
  const items = inv.items || [];
  const isInter = parseFloat(inv.igst_total || "0") > 0;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/billing/invoices")}><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
          <div>
            <h1 className="text-2xl font-bold">{inv.invoice_no}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={statusColor[inv.payment_status]}>{inv.payment_status}</Badge>
              {inv.cancelled && <Badge variant="destructive">Cancelled</Badge>}
              <span className="text-sm text-gray-500">{new Date(inv.invoice_date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!inv.cancelled && inv.payment_status !== "paid" && (
            <Button variant="outline" onClick={() => setShowPayment(!showPayment)}>
              <IndianRupee className="w-4 h-4 mr-1" />Record Payment
            </Button>
          )}
          <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" />Print</Button>
          <Button variant="outline" className="text-orange-600 border-orange-400 hover:bg-orange-50" onClick={() => window.open(`/api/billing/invoices/${inv.id}/pdf`, "_blank")}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Download PDF
          </Button>
          {!inv.cancelled && <Button variant="outline" className="text-red-600" onClick={cancelInvoice}><Ban className="w-4 h-4 mr-1" />Cancel</Button>}
        </div>
      </div>

      {/* Payment Form */}
      {showPayment && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4 grid grid-cols-5 gap-3 items-end">
            <div><Label>Amount *</Label><Input type="number" value={payAmt} onChange={e => setPayAmt(e.target.value)} placeholder={inv.balance_due} /></div>
            <div><Label>Mode</Label>
              <Select value={payMode} onValueChange={setPayMode}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="rtgs">RTGS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Reference / UTR</Label><Input value={payRef} onChange={e => setPayRef(e.target.value)} /></div>
            <div><Label>Date</Label><Input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} /></div>
            <Button onClick={recordPayment} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Payment"}
            </Button>
          </CardContent>
        </Card>
      )}


      {/* Payment History */}
      {payments.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <IndianRupee className="w-4 h-4" /> Payment History ({payments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Amount</th>
                    <th className="py-2 pr-3">Mode</th>
                    <th className="py-2 pr-3">Reference</th>
                    <th className="py-2 pr-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2 pr-3">{new Date(p.payment_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="py-2 pr-3 font-medium text-emerald-700">{formatINR(parseFloat(p.amount))}</td>
                      <td className="py-2 pr-3 capitalize">{(p.payment_mode || "").replace("_", " ")}</td>
                      <td className="py-2 pr-3 text-gray-600">{p.reference_no || "—"}</td>
                      <td className="py-2 pr-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => openEditPayment(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="outline" className="text-destructive" onClick={() => deletePayment(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Payment Modal */}
      {editPayId !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditPayId(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-base">Edit Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Amount *</Label>
                <Input type="number" value={editAmt} onChange={e => setEditAmt(e.target.value)} />
              </div>
              <div>
                <Label>Mode</Label>
                <Select value={editMode} onValueChange={setEditMode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="rtgs">RTGS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reference / UTR</Label>
                <Input value={editRef} onChange={e => setEditRef(e.target.value)} />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditPayId(null)}>Cancel</Button>
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={saveEditPayment} disabled={editSaving}>
                  {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Payment"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invoice Content (print-friendly) */}
      <Card className="print:shadow-none print:border-none" id="invoice-print">
        <CardContent className="p-0 space-y-0">

          {/* ── Professional Header ── */}
          <div style={{background:"#1a3a6b"}} className="rounded-t-lg overflow-hidden">
            {/* Orange accent top bar */}
            <div style={{background:"#e07b2a",height:"5px"}} />
            <div className="flex items-center justify-between px-6 py-4">
              {/* Logo + Company Info */}
              <div className="flex items-center gap-4">
                <img src="/uploads/pdf-inserts/divyanshi_logo.png" alt="Logo"
                  style={{width:"72px",height:"72px",objectFit:"contain",background:"white",borderRadius:"8px",padding:"4px"}}
                  onError={(e:any)=>{e.target.style.display="none"}} />
                <div>
                  <h2 style={{color:"white",fontSize:"15px",fontWeight:"700"}}>{inv.company_name}</h2>
                  {inv.company_cin && <p style={{color:"#aac4ff",fontSize:"10px"}}>{`CIN: ${inv.company_cin} | GSTIN: ${inv.company_gstin||""}`}</p>}
                  {!inv.company_cin && inv.company_gstin && <p style={{color:"#aac4ff",fontSize:"10px"}}>{`GSTIN: ${inv.company_gstin}`}</p>}
                  {inv.head_office && <p style={{color:"#aac4ff",fontSize:"10px"}}>{inv.head_office}</p>}
                  {inv.bihar_address && <p style={{color:"#aac4ff",fontSize:"10px"}}>{inv.bihar_address}</p>}
                  {!inv.head_office && <p style={{color:"#aac4ff",fontSize:"10px"}}>{inv.company_address}, {inv.company_city}</p>}
                  <p style={{color:"#aac4ff",fontSize:"10px"}}>Web: {inv.company_website||"divyanshisolar.in"} | Ph: {inv.company_phone||"9801005212"}</p>
                </div>
              </div>
              {/* TAX INVOICE title */}
              <div className="text-right">
                <div style={{color:"#e07b2a",fontSize:"28px",fontWeight:"900",letterSpacing:"2px"}}>TAX INVOICE</div>
                <div style={{background:"rgba(255,255,255,0.1)",borderRadius:"6px",padding:"8px 12px",marginTop:"6px",textAlign:"left"}}>
                  <p style={{color:"white",fontSize:"11px",fontWeight:"600"}}>Invoice No: {inv.invoice_no}</p>
                  <p style={{color:"#aac4ff",fontSize:"10px"}}>Date: {new Date(inv.invoice_date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</p>
                  {inv.due_date && <p style={{color:"#aac4ff",fontSize:"10px"}}>Due: {new Date(inv.due_date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</p>}
                </div>
              </div>
            </div>
            {/* GSTIN Banner */}
            <div style={{background:"#e07b2a",padding:"5px",textAlign:"center"}}>
              <span style={{color:"white",fontWeight:"700",fontSize:"11px",letterSpacing:"0.5px"}}>GSTIN: {inv.company_gstin||""}</span>
            </div>
          </div>

          {/* ── Bill To + Invoice Details ── */}
          <div className="grid grid-cols-2 gap-0 border-b">
            <div className="p-5 border-r">
              <p style={{fontSize:"10px",fontWeight:"700",color:"#6b7280",textTransform:"uppercase",marginBottom:"6px"}}>Bill To</p>
              <p style={{fontSize:"15px",fontWeight:"700",color:"#1a3a6b"}}>{inv.customer_name}</p>
              {inv.customer_gstin && <p style={{fontSize:"11px",color:"#374151",marginTop:"2px"}}>GSTIN: {inv.customer_gstin}</p>}
              <p style={{fontSize:"11px",color:"#6b7280",marginTop:"4px"}}>{inv.customer_address}</p>
              <p style={{fontSize:"11px",color:"#6b7280"}}>{inv.customer_city}, {inv.customer_state} {inv.customer_pin}</p>
              {inv.customer_phone && <p style={{fontSize:"11px",color:"#6b7280"}}>Ph: {inv.customer_phone}</p>}
            </div>
            <div className="p-5">
              <p style={{fontSize:"10px",fontWeight:"700",color:"#6b7280",textTransform:"uppercase",marginBottom:"6px"}}>Invoice Details</p>
              {[
                ["Invoice No", inv.invoice_no],
                ["Date", new Date(inv.invoice_date).toLocaleDateString("en-IN")],
                ["Due Date", inv.due_date ? new Date(inv.due_date).toLocaleDateString("en-IN") : "—"],
                ["Place of Supply", inv.place_of_supply||"—"],
                ["Supply Type", isInter?"Inter-State (IGST)":"Intra-State (CGST+SGST)"],
              ].map(([k,v])=>(
                <div key={k} className="flex justify-between" style={{fontSize:"11px",marginBottom:"3px"}}>
                  <span style={{color:"#6b7280"}}>{k}</span>
                  <span style={{fontWeight:"600",color:"#111827"}}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 space-y-5">

          {/* Line Items Table */}
          <table className="w-full text-sm border">
            <thead>
              <tr style={{background:"#1a3a6b",color:"white"}} className="text-xs uppercase">
                <th className="p-2 text-left">#</th>
                <th className="p-2 text-left">Description</th>
                <th className="p-2 text-center">HSN</th>
                <th className="p-2 text-right">Qty</th>
                <th className="p-2 text-right">Rate</th>
                <th className="p-2 text-right">Disc</th>
                <th className="p-2 text-right">Taxable</th>
                <th className="p-2 text-right">{isInter ? "IGST" : "CGST"}</th>
                {!isInter && <th className="p-2 text-right">SGST</th>}
                <th className="p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it: any, i: number) => (
                <tr key={it.id} className="border-b">
                  <td className="p-2 text-gray-400">{i + 1}</td>
                  <td className="p-2 font-medium">{it.description || it.product_name}</td>
                  <td className="p-2 text-center text-gray-500">{it.hsn_code}</td>
                  <td className="p-2 text-right">{it.quantity} {it.unit}</td>
                  <td className="p-2 text-right">{formatINR(parseFloat(it.rate))}</td>
                  <td className="p-2 text-right text-gray-500">{parseFloat(it.discount_percent) > 0 ? `${it.discount_percent}%` : "—"}</td>
                  <td className="p-2 text-right">{formatINR(parseFloat(it.taxable_value))}</td>
                  <td className="p-2 text-right text-gray-600">
                    {formatINR(isInter ? parseFloat(it.igst_amount) : parseFloat(it.cgst_amount))}
                    <br /><span className="text-xs">@{isInter ? it.igst_rate : it.cgst_rate}%</span>
                  </td>
                  {!isInter && (
                    <td className="p-2 text-right text-gray-600">
                      {formatINR(parseFloat(it.sgst_amount))}
                      <br /><span className="text-xs">@{it.sgst_rate}%</span>
                    </td>
                  )}
                  <td className="p-2 text-right font-bold">{formatINR(parseFloat(it.total_amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Taxable Amount</span><span>{formatINR(parseFloat(inv.taxable_amount))}</span></div>
              {isInter ? (
                <div className="flex justify-between"><span className="text-gray-500">IGST</span><span>{formatINR(parseFloat(inv.igst_total))}</span></div>
              ) : (
                <>
                  <div className="flex justify-between"><span className="text-gray-500">CGST</span><span>{formatINR(parseFloat(inv.cgst_total))}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">SGST</span><span>{formatINR(parseFloat(inv.sgst_total))}</span></div>
                </>
              )}
              {parseFloat(inv.round_off) !== 0 && (
                <div className="flex justify-between"><span className="text-gray-500">Round Off</span><span>{inv.round_off}</span></div>
              )}
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <span>Total</span><span className="text-emerald-700">{formatINR(parseFloat(inv.total_amount))}</span>
              </div>
              <p className="text-xs text-gray-500 italic pt-1">{inv.amount_in_words}</p>
              {parseFloat(inv.amount_paid) > 0 && (
                <>
                  <div className="flex justify-between border-t pt-1"><span className="text-gray-500">Paid</span><span className="text-emerald-600">{formatINR(parseFloat(inv.amount_paid))}</span></div>
                  <div className="flex justify-between font-bold"><span>Balance Due</span><span className="text-red-600">{formatINR(parseFloat(inv.balance_due))}</span></div>
                </>
              )}
            </div>
          </div>

          {/* Bank Details */}
          {inv.bank_name && (
            <div className="border-t pt-4 text-sm">
              <h4 className="font-medium text-gray-700 mb-1">Bank Details</h4>
              <p className="text-gray-600">Bank: {inv.bank_name} | A/C: {inv.bank_account} | IFSC: {inv.bank_ifsc}</p>
            </div>
          )}

          {/* Terms */}
          {inv.terms && (
            <div className="border-t pt-4 text-xs text-gray-500">
              <h4 className="font-medium text-gray-600 mb-1">Terms & Conditions</h4>
              <p>{inv.terms}</p>
            </div>
          )}

          {/* Signature & Seal */}
          <div className="border-t pt-4 grid grid-cols-2 gap-8 mt-4">
            <div>
              <p style={{fontSize:"11px",color:"#6b7280",marginBottom:"4px"}}>Customer Acknowledgement</p>
              <div style={{border:"1px dashed #d1d5db",borderRadius:"6px",height:"70px",display:"flex",alignItems:"flex-end",padding:"6px"}}>
                <div style={{width:"100%",borderTop:"1px solid #374151",paddingTop:"4px",fontSize:"10px",color:"#6b7280",textAlign:"center"}}>
                  Signature &amp; Date
                </div>
              </div>
            </div>
            <div className="text-right">
              <p style={{fontSize:"11px",color:"#6b7280",marginBottom:"4px"}}>For {inv.company_name}</p>
              <div style={{height:"70px",display:"flex",alignItems:"center",justifyContent:"flex-end"}}>
                <img src="/uploads/pdf-inserts/divyanshi_signature.jpg" alt="Signature"
                  style={{maxHeight:"65px",maxWidth:"160px",objectFit:"contain"}}
                  onError={(e:any)=>{e.target.style.display="none"}} />
              </div>
              <div style={{borderTop:"1px solid #374151",paddingTop:"4px",fontSize:"10px",color:"#6b7280",textAlign:"right"}}>
                Authorised Signatory
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{background:"#1a3a6b",borderRadius:"0 0 8px 8px",margin:"16px -20px -20px",padding:"10px 20px",textAlign:"center"}}>
            <p style={{color:"#aac4ff",fontSize:"10px"}}>{inv.company_name} | {inv.company_website||"divyanshisolar.in"} | {inv.company_phone||"9801005212"} | GSTIN: {inv.company_gstin||""}</p>
          </div>

          </div>{/* end inner p-5 div */}
        </CardContent>
      </Card>
    </div>
  );
}
