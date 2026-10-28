import type { Express, Request, Response } from "express";
import { pool } from "./db";
import PDFDocument from "pdfkit";
import { buildAnnexure2 } from "./annexure2-util";
import { sendEmail } from "./gmail";
import { DISCOM_INFO } from "./meter-testing-routes";

const fmtD = (d: any) => d ? new Date(d).toLocaleDateString("en-GB") : "";

async function loadCtx(letterId: number, overrides: any[] = []) {
  const { rows } = await pool.query("SELECT * FROM meter_testing_letters WHERE id = $1", [letterId]);
  if (!rows.length) throw new Error("Testing letter not found");
  const L = rows[0];
  const raw: any[] = Array.isArray(L.items) ? L.items : [];
  const ids = raw.map(i => i.customer_id).filter(Boolean);
  const map: any = {};
  if (ids.length) {
    const { rows: bc } = await pool.query(
      "SELECT id, name, consumer_number, division, sub_division, ca_number FROM billing_customers WHERE id = ANY($1::int[])", [ids]);
    bc.forEach(c => { map[c.id] = c; });
  }
  const ov: any = {};
  overrides.forEach(o => { if (o.meter_serial_no) ov[o.meter_serial_no] = o; });
  const items = raw.map(it => {
    const c = map[it.customer_id] || {};
    const o = ov[it.meter_serial_no] || {};
    return {
      meter_serial_no: it.meter_serial_no || "",
      meter_make: it.meter_make || "",
      phase: o.phase || it.phase || "Single Phase",
      ca_no: o.ca_no || c.ca_number || it.consumer_number || c.consumer_number || "",
      app_no: o.app_no || "",
      consumer_name: o.consumer_name || it.customer_name || c.name || "",
      division: o.division || c.division || "",
      sub_division: o.sub_division || c.sub_division || "",
    };
  });
  const { rows: co } = await pool.query(
    "SELECT name, head_office, bihar_address, address_line1, address_line2, phone, email FROM billing_companies ORDER BY id LIMIT 1");
  const c0: any = co[0] || {};
  return { L, items, agency: {
    name: c0.name || "", signatory: "",
    address: c0.head_office || [c0.address_line1, c0.address_line2].filter(Boolean).join(", ") || c0.bihar_address || "", contact: c0.phone || "", email: c0.email || "" } };
}

function stream(res: Response, d: any, filename: string) {
  const doc = new PDFDocument({ size: "A4", margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  doc.pipe(res);
  buildAnnexure2(doc, d);
  doc.end();
}

export function registerMeterUtilizationRoutes(app: Express) {
  app.get("/api/meter-utilization/testing-letters", async (_req: Request, res: Response) => {
    try {
      const { rows } = await pool.query(
        `SELECT id, letter_no, discom, created_at::date AS letter_date,
                COALESCE(jsonb_array_length(items), 0) AS meters
           FROM meter_testing_letters ORDER BY id DESC`);
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/meter-utilization/preview/:letterId", async (req: Request, res: Response) => {
    try {
      const { L, items, agency } = await loadCtx(Number(req.params.letterId));
      stream(res, { letter_no: "(draft)", date_str: fmtD(new Date()), discom: L.discom,
        circle: String(req.query.circle || ""), mrt: String(req.query.mrt || ""),
        ref1_no: String(req.query.ref1_no || "149"), ref1_date: String(req.query.ref1_date || "22/05/2025"),
        ref2_no: L.letter_no, ref2_date: fmtD(L.created_at), items, agency },
        `Utilization_Preview_${L.letter_no.replace(/\//g, "-")}.pdf`);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/meter-utilization/generate", async (req: Request, res: Response) => {
    try {
      const b = req.body || {};
      const { L, items, agency } = await loadCtx(Number(b.testing_letter_id), b.items || []);
      const year = new Date().getFullYear();
      const { rows: n } = await pool.query(
        "SELECT COUNT(*)::int + 1 AS seq FROM meter_utilization_letters WHERE discom = $1 AND EXTRACT(YEAR FROM created_at) = $2", [L.discom, year]);
      const letterNo = `DDSPL/MUC/${L.discom || "SBPDCL"}/${String(n[0].seq).padStart(3, "0")}/${year}`;
      await pool.query(
        `INSERT INTO meter_utilization_letters
          (letter_no, testing_letter_id, testing_letter_no, testing_letter_date, discom, circle, mrt, ref1_no, ref1_date, items, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [letterNo, L.id, L.letter_no, L.created_at, L.discom, b.circle || null, b.mrt || null,
         b.ref1_no || "149", b.ref1_date || "22/05/2025", JSON.stringify(items), b.created_by || null]);
      stream(res, { letter_no: letterNo, date_str: fmtD(new Date()), discom: L.discom,
        circle: b.circle, mrt: b.mrt, ref1_no: b.ref1_no || "149", ref1_date: b.ref1_date || "22/05/2025",
        ref2_no: L.letter_no, ref2_date: fmtD(L.created_at), items, agency },
        `Utilization_${letterNo.replace(/\//g, "-")}.pdf`);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/meter-utilization/customer-search", async (req: Request, res: Response) => {
    try {
      const q = String(req.query.q || "").trim();
      if (q.length < 2) return res.json([]);
      const { rows } = await pool.query(
        `SELECT id, name, consumer_number, ca_number, division, sub_division, address, city
           FROM billing_customers
          WHERE name ILIKE $1 OR consumer_number ILIKE $1 OR ca_number ILIKE $1
          ORDER BY name LIMIT 10`, ["%" + q + "%"]);
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/meter-utilization/:id", async (req: Request, res: Response) => {
    try {
      const { rows } = await pool.query("SELECT * FROM meter_utilization_letters WHERE id = $1", [req.params.id]);
      if (!rows.length) return res.status(404).json({ error: "Certificate not found" });
      res.json(rows[0]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put("/api/meter-utilization/:id", async (req: Request, res: Response) => {
    try {
      const b = req.body || {};
      const items = Array.isArray(b.items) ? b.items : [];
      if (!items.length) throw new Error("At least one meter row is required");
      const { rows } = await pool.query(
        `UPDATE meter_utilization_letters
            SET circle = COALESCE($1, circle), mrt = COALESCE($2, mrt),
                ref1_no = COALESCE($3, ref1_no), ref1_date = COALESCE($4, ref1_date), items = $5
          WHERE id = $6 RETURNING *`,
        [b.circle || null, b.mrt || null, b.ref1_no || null, b.ref1_date || null,
         JSON.stringify(items), req.params.id]);
      if (!rows.length) return res.status(404).json({ error: "Certificate not found" });
      res.json({ ok: true, letter: rows[0] });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  async function renderSaved(id: string) {
    const { rows } = await pool.query("SELECT * FROM meter_utilization_letters WHERE id = $1", [id]);
    if (!rows.length) throw new Error("Certificate not found");
    const C = rows[0];
    const { rows: co } = await pool.query(
      "SELECT name, head_office, bihar_address, address_line1, address_line2, phone, email FROM billing_companies ORDER BY id LIMIT 1");
    const c0: any = co[0] || {};
    return { C, data: {
      letter_no: C.letter_no, date_str: fmtD(C.created_at), discom: C.discom,
      circle: C.circle, mrt: C.mrt, ref1_no: C.ref1_no, ref1_date: C.ref1_date,
      ref2_no: C.testing_letter_no, ref2_date: fmtD(C.testing_letter_date),
      items: Array.isArray(C.items) ? C.items : [],
      agency: { name: c0.name || "", signatory: "",
        address: c0.head_office || [c0.address_line1, c0.address_line2].filter(Boolean).join(", ") || c0.bihar_address || "",
        contact: c0.phone || "", email: c0.email || "" } } };
  }

  app.get("/api/meter-utilization/:id/pdf", async (req: Request, res: Response) => {
    try {
      const { C, data } = await renderSaved(req.params.id);
      stream(res, data, `${C.letter_no.replace(/\//g, "_")}.pdf`);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/meter-utilization/:id/send-email", async (req: Request, res: Response) => {
    try {
      const { C, data } = await renderSaved(req.params.id);
      const info = (DISCOM_INFO as any)[(C.discom || "SBPDCL").toUpperCase()] || (DISCOM_INFO as any).SBPDCL;
      const doc = new PDFDocument({ size: "A4", margins: { top: 0, bottom: 0, left: 0, right: 0 } });
      const chunks: Buffer[] = [];
      doc.on("data", (x: Buffer) => chunks.push(x));
      const done = new Promise<Buffer>(r => doc.on("end", () => r(Buffer.concat(chunks))));
      buildAnnexure2(doc, data);
      doc.end();
      const pdf = await done;
      const n = (data.items || []).length;
      const html = `<div style="font-family:Arial,sans-serif;max-width:700px">
        <p>Respected Sir/Madam,</p>
        <p>Please find attached <b>${C.letter_no}</b> &mdash; the 80% or more utilization report (Annexure-II)
           for the solar meters submitted vide our letter <b>${C.testing_letter_no}</b> dated ${fmtD(C.testing_letter_date)}.</p>
        <p>Total meters: <b>${n}</b>${C.circle ? ` | Circle: <b>${C.circle}</b>` : ""}${C.mrt ? ` | MRT: <b>${C.mrt}</b>` : ""}</p>
        <p>Kindly acknowledge receipt.</p>
        <p>Thanks &amp; Regards,<br/>${data.agency.name}<br/>${data.agency.contact}</p></div>`;
      const r = await sendEmail({
        to: info.email,
        subject: `${C.letter_no} — Meter Utilization Report (Annexure-II) against ${C.testing_letter_no}`,
        html,
        attachments: [{ filename: `${C.letter_no.replace(/\//g, "_")}.pdf`, content: pdf }],
      } as any);
      if (!(r as any)?.success) throw new Error((r as any)?.error || "Email failed");
      await pool.query("UPDATE meter_utilization_letters SET sent_at = NOW() WHERE id = $1", [req.params.id]);
      res.json({ success: true, to: info.email });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/meter-utilization/list", async (_req: Request, res: Response) => {
    try {
      const { rows } = await pool.query(
        `SELECT id, letter_no, testing_letter_no, created_at::date AS issued,
                COALESCE(jsonb_array_length(items), 0) AS meters, sent_at, discom, circle, mrt
           FROM meter_utilization_letters ORDER BY id DESC`);
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
}
