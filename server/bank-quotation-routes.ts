import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { pool } from "./db";

// Saved copies of every quotation downloaded from Generate Quotation (quotation-generator.tsx)
function requireLogin(req: Request, res: Response, next: NextFunction) {
  const r: any = req;
  if ((typeof r.isAuthenticated === "function" && r.isAuthenticated()) || r.user || r.session?.userId || r.session?.user) return next();
  res.status(401).json({ error: "Not logged in" });
}

const str = (v: any, n: number) => (v == null || v === "" ? null : String(v).slice(0, n));
const num = (v: any) => { const x = Number(v); return Number.isFinite(x) ? x : null; };

export function registerBankQuotationRoutes(app: Express) {
  app.post("/api/bank-quotations", requireLogin, async (req: Request, res: Response) => {
    try {
      const b = req.body || {};
      if (b.pdfError) console.error("[bank-quotations] PDF generation failed for", b.quoteNo, "-", String(b.pdfError).slice(0, 500));
      const quoteNo = str(b.quoteNo, 40);
      const customerId = str(b.customerId, 64);
      if (!quoteNo || !customerId) return res.status(400).json({ error: "quoteNo and customerId are required" });
      const { rows } = await pool.query(
        `INSERT INTO bank_quotations
           (quote_no, customer_id, customer_name, phone, bank_name, ifsc, capacity_kw, inverter_type, brand, total_amount, config, pdf_error)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (quote_no, customer_id, capacity_kw, total_amount, brand) DO UPDATE SET
           customer_name = EXCLUDED.customer_name, phone = EXCLUDED.phone,
           bank_name = EXCLUDED.bank_name, ifsc = EXCLUDED.ifsc,
           inverter_type = EXCLUDED.inverter_type, config = EXCLUDED.config,
           pdf_error = EXCLUDED.pdf_error,
           download_count = bank_quotations.download_count + 1, updated_at = now()
         RETURNING id, download_count`,
        [quoteNo, customerId, str(b.customerName, 200), str(b.phone, 20), str(b.bankName, 120), str(b.ifsc, 20),
         num(b.capacityKw), str(b.inverterType, 20), str(b.brand, 20) || "divyanshi", num(b.totalAmount),
         b.config ? JSON.stringify(b.config) : null, str(b.pdfError, 500)]
      );
      res.json(rows[0]);
    } catch (e: any) {
      console.error("[bank-quotations] save:", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/bank-quotations/:id/pdf", requireLogin,
    express.raw({ type: "application/pdf", limit: "25mb" }),
    async (req: Request, res: Response) => {
      try {
        const id = Number(req.params.id);
        const buf = req.body as Buffer;
        if (!Number.isInteger(id)) return res.status(400).json({ error: "Bad id" });
        if (!Buffer.isBuffer(buf) || buf.length < 100 || buf.subarray(0, 5).toString("latin1") !== "%PDF-")
          return res.status(400).json({ error: "Body is not a PDF" });
        const r = await pool.query(
          "UPDATE bank_quotations SET pdf_data = $1, pdf_size = $2, pdf_error = NULL, updated_at = now() WHERE id = $3",
          [buf, buf.length, id]
        );
        if (!r.rowCount) return res.status(404).json({ error: "Quotation not found" });
        res.json({ ok: true, size: buf.length });
      } catch (e: any) {
        console.error("[bank-quotations] pdf:", e.message);
        res.status(500).json({ error: e.message });
      }
    });

  app.get("/api/bank-quotations", requireLogin, async (req: Request, res: Response) => {
    try {
      const q = String(req.query.q || "").trim();
      const params: any[] = [];
      let where = "";
      if (q) {
        params.push(`%${q}%`);
        where = "WHERE quote_no ILIKE $1 OR customer_name ILIKE $1 OR phone ILIKE $1 OR bank_name ILIKE $1";
      }
      const { rows } = await pool.query(
        `SELECT id, quote_no, customer_id, customer_name, phone, bank_name, ifsc, capacity_kw, inverter_type,
                brand, total_amount, download_count, pdf_size, pdf_error, (pdf_data IS NOT NULL) AS has_pdf,
                created_at, updated_at
           FROM bank_quotations ${where}
          ORDER BY updated_at DESC LIMIT 500`,
        params
      );
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/bank-quotations/:id", requireLogin, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: "Bad id" });
      const { rows } = await pool.query(
        `SELECT id, quote_no, customer_id, customer_name, phone, bank_name, ifsc, capacity_kw,
                inverter_type, brand, total_amount, config, download_count, created_at
           FROM bank_quotations WHERE id = $1`, [id]
      );
      if (!rows[0]) return res.status(404).json({ error: "Quotation not found" });
      res.json(rows[0]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/bank-quotations/:id/pdf", requireLogin, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).send("Bad id");
      const { rows } = await pool.query(
        "SELECT customer_name, capacity_kw, pdf_data FROM bank_quotations WHERE id = $1", [id]
      );
      if (!rows[0]?.pdf_data) return res.status(404).send("PDF not found for this quotation");
      const who = String(rows[0].customer_name || "customer").replace(/[^A-Za-z0-9]+/g, "_");
      const name = `Quotation_${who}_${Number(rows[0].capacity_kw) || ""}KW.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `${req.query.download ? "attachment" : "inline"}; filename="${name}"`);
      res.send(rows[0].pdf_data);
    } catch (e: any) { res.status(500).send(e.message); }
  });

  app.delete("/api/bank-quotations/:id", requireLogin, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: "Bad id" });
      const r = await pool.query("DELETE FROM bank_quotations WHERE id = $1", [id]);
      if (!r.rowCount) return res.status(404).json({ error: "Quotation not found" });
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
}
