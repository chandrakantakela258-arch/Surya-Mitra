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
import { ArrowLeft, Printer, IndianRupee, Ban, Loader2 } from "lucide-react";

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

  const load = () => {
    setLoading(true);
    fetch(`/api/billing/invoices/${params.id}`).then(r => r.json()).then(setInvoice).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [params.id]);

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

      {/* Invoice Content (print-friendly) */}
      <Card className="print:shadow-none print:border-none" id="invoice-print">
        <CardContent className="p-8 space-y-6">
          {/* Company + Customer */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{inv.company_name}</h2>
              {inv.company_gstin && <p className="text-sm text-gray-600">GSTIN: {inv.company_gstin}</p>}
              <p className="text-sm text-gray-500">{inv.company_address}, {inv.company_city}</p>
              <p className="text-sm text-gray-500">{inv.company_state} | {inv.company_phone}</p>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-medium text-gray-500 uppercase">Bill To</h3>
              <p className="text-base font-bold">{inv.customer_name}</p>
              {inv.customer_gstin && <p className="text-sm text-gray-600">GSTIN: {inv.customer_gstin}</p>}
              <p className="text-sm text-gray-500">{inv.customer_address}</p>
              <p className="text-sm text-gray-500">{inv.customer_city}, {inv.customer_state} {inv.customer_pin}</p>
            </div>
          </div>

          {/* Invoice Meta */}
          <div className="grid grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg text-sm">
            <div><span className="text-gray-500">Invoice No:</span><br /><strong>{inv.invoice_no}</strong></div>
            <div><span className="text-gray-500">Date:</span><br /><strong>{new Date(inv.invoice_date).toLocaleDateString("en-IN")}</strong></div>
            <div><span className="text-gray-500">Due Date:</span><br /><strong>{inv.due_date ? new Date(inv.due_date).toLocaleDateString("en-IN") : "—"}</strong></div>
            <div><span className="text-gray-500">Place of Supply:</span><br /><strong>{inv.place_of_supply || "—"}</strong></div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-800 text-white text-xs uppercase">
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
        </CardContent>
      </Card>
    </div>
  );
}
