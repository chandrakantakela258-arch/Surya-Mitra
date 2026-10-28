import type { Express, Request, Response } from "express";
import { pool } from "./db";
import PDFDocument from "pdfkit";
import { buildLedgerPdf } from "./ledger-pdf";

const iso = (d: any) => {
  if (!d) return "";
  const x = d instanceof Date ? d : new Date(d);
  return isNaN(x.getTime()) ? String(d).slice(0, 10)
    : new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export function registerLedgerRoutes(app: Express) {

  // parties for the dropdown
  app.get("/api/billing/ledger/parties", async (req: Request, res: Response) => {
    const type = String(req.query.type || "customer");
    try {
      if (type === "vendor") {
        const { rows } = await pool.query(
          `SELECT v.id, v.name, v.phone, v.gstin,
                  (SELECT count(*) FROM billing_vendor_bills b WHERE b.vendor_id = v.id) AS docs
             FROM billing_vendors v ORDER BY v.name`);
        return res.json(rows);
      }
      const { rows } = await pool.query(
        `SELECT c.id, c.name, c.phone, c.gstin,
                count(i.id) AS docs,
                COALESCE(sum(i.total_amount),0)::numeric(14,2) AS billed
           FROM billing_customers c
           LEFT JOIN billing_invoices i
             ON i.customer_id = c.id AND i.invoice_type='tax_invoice'
            AND i.approval_status='approved' AND NOT i.cancelled
          GROUP BY c.id, c.name, c.phone, c.gstin
          HAVING count(i.id) > 0
          ORDER BY c.name`);
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  async function statement(type: string, id: string, from: string, to: string) {
    {
      const rows: any[] = [];
      let party: any = {};

      if (type === "vendor") {
        const { rows: v } = await pool.query("SELECT * FROM billing_vendors WHERE id=$1", [id]);
        if (!v.length) { const e: any = new Error("Vendor not found"); e.status = 404; throw e; }
        party = v[0];
        const { rows: bills } = await pool.query(
          `SELECT bill_no AS ref, bill_date AS dt, total_amount AS amt, 'Purchase Bill' AS kind
             FROM billing_vendor_bills WHERE vendor_id=$1`, [id]);
        bills.forEach(b => rows.push({ ...b, debit: 0, credit: Number(b.amt) }));
        const { rows: pays } = await pool.query(
          `SELECT COALESCE(reference_no,'') AS ref, payment_date AS dt, amount AS amt,
                  'Payment Made' AS kind, payment_mode
             FROM billing_payments WHERE party_type='vendor' AND party_id=$1`, [id]);
        pays.forEach(p => rows.push({ ...p, debit: Number(p.amt), credit: 0 }));
      } else {
        const { rows: c } = await pool.query("SELECT * FROM billing_customers WHERE id=$1", [id]);
        if (!c.length) { const e: any = new Error("Customer not found"); e.status = 404; throw e; }
        party = c[0];
        // approved GST invoices only — no drafts, no cancelled, no proforma/quotation
        const { rows: inv } = await pool.query(
          `SELECT invoice_no AS ref, invoice_date AS dt, total_amount AS amt, 'GST Invoice' AS kind
             FROM billing_invoices
            WHERE customer_id=$1 AND invoice_type='tax_invoice'
              AND approval_status='approved' AND NOT cancelled`, [id]);
        inv.forEach(i => rows.push({ ...i, debit: Number(i.amt), credit: 0 }));
        const { rows: cn } = await pool.query(
          `SELECT invoice_no AS ref, invoice_date AS dt, total_amount AS amt, 'Credit Note' AS kind
             FROM billing_invoices
            WHERE customer_id=$1 AND invoice_type='credit_note'
              AND approval_status='approved' AND NOT cancelled`, [id]);
        cn.forEach(i => rows.push({ ...i, debit: 0, credit: Number(i.amt) }));
        const { rows: rc } = await pool.query(
          `SELECT receipt_no AS ref, receipt_date AS dt, total_amount AS amt,
                  'Receipt' AS kind, payment_method AS payment_mode
             FROM billing_receipts WHERE customer_id=$1`, [id]);
        rc.forEach(r => rows.push({ ...r, debit: 0, credit: Number(r.amt) }));
        // payments recorded outside the receipt module
        const { rows: pay } = await pool.query(
          `SELECT COALESCE(p.reference_no,'') AS ref, p.payment_date AS dt, p.amount AS amt,
                  'Payment Received' AS kind, p.payment_mode
             FROM billing_payments p
            WHERE p.party_type='customer' AND p.party_id=$1
              AND NOT EXISTS (SELECT 1 FROM billing_receipts r
                               WHERE r.customer_id = p.party_id
                                 AND r.receipt_date = p.payment_date
                                 AND r.total_amount = p.amount)`, [id]);
        pay.forEach(p => rows.push({ ...p, debit: 0, credit: Number(p.amt) }));
      }

      rows.forEach(r => { r.dt = iso(r.dt); });
      rows.sort((a, b) => a.dt.localeCompare(b.dt) || String(a.ref).localeCompare(String(b.ref)));

      // split into opening (before "from") and the statement period
      let opening = 0;
      const lines: any[] = [];
      for (const r of rows) {
        if (from && r.dt < from) { opening += r.debit - r.credit; continue; }
        if (to && r.dt > to) continue;
        lines.push(r);
      }
      let bal = opening;
      const out = lines.map(r => { bal += r.debit - r.credit; return { ...r, balance: bal }; });
      const totDr = out.reduce((s, r) => s + r.debit, 0);
      const totCr = out.reduce((s, r) => s + r.credit, 0);
      return {
        party: { id: party.id, name: party.name, phone: party.phone, gstin: party.gstin,
                 address: party.address, city: party.city, state: party.state },
        type, from: from || null, to: to || null,
        opening, lines: out, total_debit: totDr, total_credit: totCr, closing: bal,
      };
    }
  }

  app.get("/api/billing/ledger/:type/:id", async (req: Request, res: Response) => {
    try {
      const d = await statement(req.params.type, req.params.id,
        String(req.query.from || ""), String(req.query.to || ""));
      res.json(d);
    } catch (e: any) { res.status(e.status || 500).json({ error: e.message }); }
  });

  // official PDF on the company letterhead, with seal and signature
  app.get("/api/billing/ledger/:type/:id/pdf", async (req: Request, res: Response) => {
    try {
      const d = await statement(req.params.type, req.params.id,
        String(req.query.from || ""), String(req.query.to || ""));
      const doc = new PDFDocument({ size: "A4", margins: { top: 0, bottom: 0, left: 0, right: 0 } });
      const safe = String(d.party.name || "ledger").replace(/[^A-Za-z0-9]+/g, "_").slice(0, 40);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="Ledger_${safe}.pdf"`);
      doc.pipe(res);
      buildLedgerPdf(doc, d);
      doc.end();
    } catch (e: any) { res.status(e.status || 500).json({ error: e.message }); }
  });
}
