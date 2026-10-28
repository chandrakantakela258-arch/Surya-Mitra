import PDFDocument from "pdfkit";
import { PDFDocument as PDFLib } from "pdf-lib";
import { pool } from "./db";
import { buildAnnexure2 } from "./annexure2-util";

const fmtD = (d: any) => d ? new Date(d).toLocaleDateString("en-IN",
  { day: "2-digit", month: "long", year: "numeric" }) : "";

/** Newest utilization certificate for this DISCOM, or null when none issued yet. */
export async function prevCertFor(discom: string): Promise<any | null> {
  const dc = String(discom || "SBPDCL").toUpperCase();
  const { rows } = await pool.query(
    `SELECT * FROM meter_utilization_letters
      WHERE upper(coalesce(discom,'SBPDCL')) = $1
      ORDER BY created_at DESC, id DESC LIMIT 1`, [dc]);
  if (!rows.length) return null;
  const C = rows[0];
  const { rows: co } = await pool.query(
    "SELECT name, head_office, bihar_address, address_line1, address_line2, phone, email FROM billing_companies ORDER BY id LIMIT 1");
  const c0: any = co[0] || {};
  return {
    letter_no: C.letter_no,
    date_str: fmtD(C.created_at),
    discom: dc,
    data: {
      letter_no: C.letter_no, date_str: fmtD(C.created_at), discom: C.discom,
      circle: C.circle, mrt: C.mrt, ref1_no: C.ref1_no, ref1_date: C.ref1_date,
      ref2_no: C.testing_letter_no, ref2_date: fmtD(C.testing_letter_date),
      items: Array.isArray(C.items) ? C.items : [],
      agency: { name: c0.name || "", signatory: "",
        address: c0.head_office || [c0.address_line1, c0.address_line2].filter(Boolean).join(", ") || c0.bihar_address || "",
        contact: c0.phone || "", email: c0.email || "" },
    },
  };
}

/** Render a saved utilization certificate (Annexure-II) to its own PDF buffer. */
export function annexure2Buffer(data: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margins: { top: 0, bottom: 0, left: 0, right: 0 } });
      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
      buildAnnexure2(doc, data);
      doc.end();
    } catch (e) { reject(e); }
  });
}

/** Append the certificate's pages after the request letter's pages. */
export async function mergePdfs(first: Buffer, second: Buffer): Promise<Buffer> {
  const out = await PDFLib.create();
  for (const buf of [first, second]) {
    const src = await PDFLib.load(buf);
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach(p => out.addPage(p));
  }
  return Buffer.from(await out.save());
}
