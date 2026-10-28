import type { Express, Request, Response } from "express";
import { pool } from "./db";

const tok = () => Math.random().toString(36).slice(2, 8).toUpperCase();
const ten = (v: any) => String(v || "").replace(/\D/g, "").slice(-10);

export function registerPublicSolarRoutes(app: Express) {

  // ── 1. shop owner scans the standee QR and adds a customer he knows ──
  app.post("/api/public/shop-add-customer", async (req: Request, res: Response) => {
    const b = req.body || {};
    const shopName = String(b.shop_name || "").trim();
    const owner = String(b.shop_owner || "").trim();
    const phone = ten(b.customer_phone);
    if (!shopName) return res.status(400).json({ error: "Shop name required" });
    if (!owner) return res.status(400).json({ error: "Shop owner name required" });
    if (phone.length !== 10) return res.status(400).json({ error: "Customer WhatsApp number must be 10 digits" });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // same shop (name + owner) keeps the same token, so the dashboard link is stable
      let { rows: sh } = await client.query(
        "SELECT * FROM shops WHERE lower(name)=lower($1) AND lower(coalesce(owner,''))=lower($2) LIMIT 1",
        [shopName, owner]);
      let shop = sh[0];
      if (!shop) {
        let t = tok();
        for (let i = 0; i < 5; i++) {
          const { rows } = await client.query("SELECT 1 FROM shops WHERE token=$1", [t]);
          if (!rows.length) break; t = tok();
        }
        const ins = await client.query(
          `INSERT INTO shops (token, name, owner, lat, lng, accuracy)
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
          [t, shopName, owner, b.shop_lat || null, b.shop_lng || null, b.shop_accuracy || null]);
        shop = ins.rows[0];
      } else if (b.shop_lat && !shop.lat) {
        await client.query("UPDATE shops SET lat=$1, lng=$2, accuracy=$3 WHERE id=$4",
          [b.shop_lat, b.shop_lng, b.shop_accuracy || null, shop.id]);
      }
      // one invite per customer per shop
      const { rows: ex } = await client.query(
        "SELECT * FROM shop_customers WHERE shop_id=$1 AND customer_phone=$2 LIMIT 1", [shop.id, phone]);
      let inv = ex[0];
      if (!inv) {
        let ct = tok() + tok();
        const insc = await client.query(
          `INSERT INTO shop_customers (shop_id, token, customer_phone, customer_name, status)
           VALUES ($1,$2,$3,$4,'pending') RETURNING *`,
          [shop.id, ct, phone, String(b.customer_name || "").trim() || null]);
        inv = insc.rows[0];
      }
      await client.query("COMMIT");
      console.info("[shop add]", shopName, "|", owner, "-> customer", phone, "invite", inv.token);
      res.json({ ok: true, shop_token: shop.token, invite_token: inv.token,
                 customer_phone: phone, already: !!ex[0] });
    } catch (e: any) {
      try { await client.query("ROLLBACK"); } catch {}
      console.error("[shop add error]", e.message);
      res.status(500).json({ error: e.message });
    } finally { client.release(); }
  });

  // ── 2. customer opens their unique link: prefill ──
  app.get("/api/public/invite/:token", async (req: Request, res: Response) => {
    try {
      const { rows } = await pool.query(
        `SELECT c.token, c.customer_phone, c.customer_name, c.consumer_number, c.address,
                c.status, s.name AS shop_name, s.owner AS shop_owner
           FROM shop_customers c JOIN shops s ON s.id = c.shop_id
          WHERE c.token = $1`, [req.params.token]);
      if (!rows.length) return res.status(404).json({ error: "Link not valid" });
      res.json(rows[0]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── 3. customer submits their details ──
  app.post("/api/public/invite/:token", async (req: Request, res: Response) => {
    const b = req.body || {};
    const name = String(b.name || "").trim();
    if (!name) return res.status(400).json({ error: "Name required" });
    if (!String(b.address || "").trim()) return res.status(400).json({ error: "Address required" });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows: inv } = await client.query(
        `SELECT c.*, s.name AS shop_name, s.owner AS shop_owner, s.lat AS shop_lat, s.lng AS shop_lng
           FROM shop_customers c JOIN shops s ON s.id=c.shop_id WHERE c.token=$1 FOR UPDATE`,
        [req.params.token]);
      if (!inv.length) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Link not valid" }); }
      const i = inv[0];
      await client.query(
        `UPDATE shop_customers SET customer_name=$1, consumer_number=$2, address=$3,
            cust_lat=$4, cust_lng=$5, cust_accuracy=$6, status='filled', filled_at=NOW()
          WHERE id=$7`,
        [name, b.consumer_number || null, String(b.address).trim(),
         b.cust_lat || null, b.cust_lng || null, b.cust_accuracy || null, i.id]);
      // mirror into the existing lead table so it shows with all other leads
      await client.query(
        `INSERT INTO solar_bot_leads
           (phone, mobile_number, name, consumer_number, visit_address,
            shop_name, shop_owner, shop_lat, shop_lng, lead_source, status, language)
         VALUES ($1,$1,$2,$3,$4,$5,$6,$7,$8,'qr_shop','New','hi')
         ON CONFLICT (phone) DO UPDATE SET
           name = COALESCE(NULLIF(EXCLUDED.name,''), solar_bot_leads.name),
           consumer_number = COALESCE(NULLIF(EXCLUDED.consumer_number,''), solar_bot_leads.consumer_number),
           visit_address = COALESCE(NULLIF(EXCLUDED.visit_address,''), solar_bot_leads.visit_address),
           shop_name = COALESCE(solar_bot_leads.shop_name, EXCLUDED.shop_name),
           shop_owner = COALESCE(solar_bot_leads.shop_owner, EXCLUDED.shop_owner),
           lead_source = COALESCE(solar_bot_leads.lead_source, EXCLUDED.lead_source)`,
        [i.customer_phone, name, b.consumer_number || null, String(b.address).trim(),
         i.shop_name, i.shop_owner, i.shop_lat, i.shop_lng]);
      await client.query("COMMIT");
      console.info("[invite filled]", i.customer_phone, "| shop:", i.shop_name);
      res.json({ ok: true });
    } catch (e: any) {
      try { await client.query("ROLLBACK"); } catch {}
      console.error("[invite error]", e.message);
      res.status(500).json({ error: e.message });
    } finally { client.release(); }
  });

  // ── 3b. shop looks up its own dashboard by shop name + owner ──
  app.post("/api/public/shop-lookup", async (req: Request, res: Response) => {
    const b = req.body || {};
    try {
      const { rows } = await pool.query(
        "SELECT token, name, owner FROM shops WHERE lower(name)=lower($1) AND lower(coalesce(owner,''))=lower($2) LIMIT 1",
        [String(b.shop_name || "").trim(), String(b.shop_owner || "").trim()]);
      if (!rows.length) return res.status(404).json({ error: "इस नाम से कोई shop दर्ज नहीं है" });
      res.json(rows[0]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── 3c. open shop link: anyone with it fills their own details ──
  app.get("/api/public/shop-info/:token", async (req: Request, res: Response) => {
    try {
      const { rows } = await pool.query("SELECT token, name, owner FROM shops WHERE token=$1", [req.params.token]);
      if (!rows.length) return res.status(404).json({ error: "Link not valid" });
      res.json(rows[0]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/public/shop-join/:token", async (req: Request, res: Response) => {
    const b = req.body || {};
    const phone = ten(b.phone);
    const name = String(b.name || "").trim();
    if (!name) return res.status(400).json({ error: "Name required" });
    if (phone.length !== 10) return res.status(400).json({ error: "10-digit WhatsApp number required" });
    if (!String(b.address || "").trim()) return res.status(400).json({ error: "Address required" });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows: sh } = await client.query("SELECT * FROM shops WHERE token=$1", [req.params.token]);
      if (!sh.length) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Link not valid" }); }
      const shop = sh[0];
      let ct = tok() + tok();
      await client.query(
        `INSERT INTO shop_customers (shop_id, token, customer_phone, customer_name, consumer_number,
            address, cust_lat, cust_lng, cust_accuracy, status, filled_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'filled',NOW())
         ON CONFLICT (shop_id, customer_phone) DO UPDATE SET
            customer_name=EXCLUDED.customer_name,
            consumer_number=COALESCE(NULLIF(EXCLUDED.consumer_number,''), shop_customers.consumer_number),
            address=COALESCE(NULLIF(EXCLUDED.address,''), shop_customers.address),
            cust_lat=COALESCE(EXCLUDED.cust_lat, shop_customers.cust_lat),
            cust_lng=COALESCE(EXCLUDED.cust_lng, shop_customers.cust_lng),
            status='filled', filled_at=NOW()`,
        [shop.id, ct, phone, name, b.consumer_number || null, String(b.address).trim(),
         b.cust_lat || null, b.cust_lng || null, b.cust_accuracy || null]);
      await client.query(
        `INSERT INTO solar_bot_leads
           (phone, mobile_number, name, consumer_number, visit_address,
            shop_name, shop_owner, shop_lat, shop_lng, lead_source, status, language)
         VALUES ($1,$1,$2,$3,$4,$5,$6,$7,$8,'qr_shop','New','hi')
         ON CONFLICT (phone) DO UPDATE SET
           name = COALESCE(NULLIF(EXCLUDED.name,''), solar_bot_leads.name),
           consumer_number = COALESCE(NULLIF(EXCLUDED.consumer_number,''), solar_bot_leads.consumer_number),
           visit_address = COALESCE(NULLIF(EXCLUDED.visit_address,''), solar_bot_leads.visit_address),
           shop_name = COALESCE(solar_bot_leads.shop_name, EXCLUDED.shop_name),
           shop_owner = COALESCE(solar_bot_leads.shop_owner, EXCLUDED.shop_owner)`,
        [phone, name, b.consumer_number || null, String(b.address).trim(),
         shop.name, shop.owner, shop.lat, shop.lng]);
      await client.query("COMMIT");
      console.info("[shop join]", phone, "| shop:", shop.name);
      res.json({ ok: true });
    } catch (e: any) {
      try { await client.query("ROLLBACK"); } catch {}
      console.error("[shop join error]", e.message);
      res.status(500).json({ error: e.message });
    } finally { client.release(); }
  });

  // ── 4. shop partner dashboard ──
  app.get("/api/public/shop/:token", async (req: Request, res: Response) => {
    try {
      const { rows: sh } = await pool.query("SELECT * FROM shops WHERE token=$1", [req.params.token]);
      if (!sh.length) return res.status(404).json({ error: "Shop link not valid" });
      const { rows: cust } = await pool.query(
        `SELECT token, customer_name, customer_phone, consumer_number, address,
                cust_lat, cust_lng, status, progress, progress_updated_at, created_at, filled_at
           FROM shop_customers WHERE shop_id=$1 ORDER BY created_at DESC`, [sh[0].id]);
      res.json({ shop: { token: sh[0].token, name: sh[0].name, owner: sh[0].owner,
                         lat: sh[0].lat, lng: sh[0].lng }, customers: cust });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── 5. admin: every shop and every customer ──
  app.get("/api/admin/shop-partner-leads", async (_req: Request, res: Response) => {
    try {
      const { rows } = await pool.query(
        `SELECT c.token, c.customer_name AS name, c.customer_phone AS phone, c.consumer_number,
                c.address AS visit_address, c.status, c.progress, c.progress_updated_at,
                c.created_at, c.filled_at,
                c.cust_lat, c.cust_lng,
                s.name AS shop_name, s.owner AS shop_owner, s.token AS shop_token,
                s.lat AS shop_lat, s.lng AS shop_lng
           FROM shop_customers c JOIN shops s ON s.id=c.shop_id
          ORDER BY c.created_at DESC LIMIT 1000`);
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/admin/shop-customer/:token", async (req: Request, res: Response) => {
    const ALLOWED = ["", "logged_in", "loan_processed", "loan_disbursed", "installed", "subsidy_received"];
    const pg = String(req.body?.progress ?? "");
    if (!ALLOWED.includes(pg)) return res.status(400).json({ error: "Unknown stage: " + pg });
    try {
      const { rows } = await pool.query(
        `UPDATE shop_customers SET progress = $1, progress_updated_at = NOW()
          WHERE token = $2 RETURNING token, progress`,
        [pg || null, req.params.token]);
      if (!rows.length) return res.status(404).json({ error: "Customer not found" });
      console.info("[stage]", req.params.token, "->", pg || "(none)");
      res.json({ ok: true, progress: rows[0].progress });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/admin/shop-leads", async (_req: Request, res: Response) => {
    try {
      const { rows } = await pool.query(
        `SELECT s.name AS shop_name, s.owner AS shop_owner, s.token AS shop_token,
                s.lat, s.lng, count(c.id) AS leads,
                count(c.id) FILTER (WHERE c.status='filled') AS filled,
                count(c.id) FILTER (WHERE c.progress='installed' OR c.progress='subsidy_received') AS installed,
                max(c.created_at) AS last_lead
           FROM shops s LEFT JOIN shop_customers c ON c.shop_id=s.id
          GROUP BY 1,2,3,4,5 ORDER BY leads DESC`);
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
}
