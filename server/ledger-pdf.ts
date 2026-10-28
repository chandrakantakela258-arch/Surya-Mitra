import fs from "fs";
const LETTERHEAD = "/root/surya-mitra-host/uploads/pdf-inserts/divyanshi_letterhead.jpg";
const SIGNATURE = "/root/surya-mitra-host/uploads/pdf-inserts/divyanshi_signature.jpg";
const BODY_TOP = 200;
const PRIM = "#0a2a69", DGY = "#17243d", MGY = "#6b7a99", LINE = "#c9d4e6";

const inr = (n: any) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const drcr = (n: number) => (n >= 0 ? inr(n) + " Dr" : inr(-n) + " Cr");
const dmy = (s: any) => { if (!s) return ""; const d = new Date(s);
  return String(d.getDate()).padStart(2, "0") + "-" +
    ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()] + "-" + d.getFullYear(); };

function head(doc: any) {
  try { if (fs.existsSync(LETTERHEAD)) doc.image(LETTERHEAD, 0, 0, { width: doc.page.width, height: doc.page.height }); } catch (e) {}
}

export function buildLedgerPdf(doc: any, d: any) {
  head(doc);
  const M = 45, W = doc.page.width - M * 2;
  const COLS = [62, 108, 105, 75, 75, 80];
  const HEAD = ["Date", "Particulars", "Reference", "Debit (Rs)", "Credit (Rs)", "Balance"];
  const colX: number[] = []; COLS.reduce((a, w, i) => { colX[i] = M + a; return a + w; }, 0);
  const RIGHT = [false, false, false, true, true, true];
  let y = BODY_TOP;
  const brk = (need: number) => { if (y + need > doc.page.height - 100) { doc.addPage(); head(doc); y = BODY_TOP; drawHeadRow(); } };
  const vline = (a: number, b: number) => colX.forEach((x: number, i: number) => { if (i > 0) doc.moveTo(x, a).lineTo(x, b).lineWidth(0.5).stroke(LINE); });

  // title
  doc.fillColor(PRIM).font("Helvetica-Bold").fontSize(15);
  const t = "STATEMENT OF ACCOUNT", tw = doc.widthOfString(t);
  doc.text(t, M + (W - tw) / 2, y);
  doc.moveTo(M + (W - tw) / 2, y + 19).lineTo(M + (W + tw) / 2, y + 19).lineWidth(1).stroke(PRIM);
  y += 32;

  // party block
  doc.fillColor(MGY).fontSize(8).font("Helvetica-Bold").text(d.type === "vendor" ? "VENDOR" : "CUSTOMER", M, y);
  doc.fillColor(DGY).fontSize(13).font("Helvetica-Bold").text(d.party.name || "", M, y + 11, { width: W * 0.62 });
  let py = y + 11 + doc.heightOfString(d.party.name || "", { width: W * 0.62 }) + 2;
  doc.fillColor(MGY).fontSize(8.5).font("Helvetica");
  [d.party.address, [d.party.city, d.party.state].filter(Boolean).join(", "),
   d.party.phone ? "Phone: " + d.party.phone : null, d.party.gstin ? "GSTIN: " + d.party.gstin : null]
    .filter(Boolean).forEach((l: any) => {
      const h = doc.heightOfString(String(l), { width: W * 0.62 });
      doc.text(String(l), M, py, { width: W * 0.62 }); py += h + 1.5;
    });
  doc.fillColor(MGY).fontSize(8.5).font("Helvetica")
     .text("Period: " + (d.from ? dmy(d.from) : "Beginning") + "  to  " + (d.to ? dmy(d.to) : dmy(new Date())),
           M + W * 0.64, y + 12, { width: W * 0.36, align: "right" });
  doc.text("Generated: " + dmy(new Date()), M + W * 0.64, y + 26, { width: W * 0.36, align: "right" });
  y = Math.max(py, y + 44) + 10;

  function drawHeadRow() {
    doc.rect(M, y, W, 20).fill(PRIM);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(8.5);
    HEAD.forEach((h: string, i: number) => doc.text(h, colX[i] + 4, y + 6, { width: COLS[i] - 8, align: RIGHT[i] ? "right" : "left" }));
    y += 20;
  }
  brk(60); drawHeadRow();

  const row = (cells: any[], opts: any = {}) => {
    doc.font(opts.bold ? "Helvetica-Bold" : "Helvetica").fontSize(8.5);
    let h = 0;
    cells.forEach((c: any, i: number) => { h = Math.max(h, doc.heightOfString(String(c || ""), { width: COLS[i] - 8 })); });
    h += 9; brk(h);
    if (opts.fill) doc.rect(M, y, W, h).fill(opts.fill);
    doc.rect(M, y, W, h).lineWidth(0.5).stroke(LINE);
    doc.fillColor(opts.color || DGY).font(opts.bold ? "Helvetica-Bold" : "Helvetica").fontSize(8.5);
    cells.forEach((c: any, i: number) => doc.text(String(c || ""), colX[i] + 4, y + 4.5,
      { width: COLS[i] - 8, align: RIGHT[i] ? "right" : "left" }));
    vline(y, y + h);
    y += h;
  };

  row(["", "Opening Balance", "", "", "", drcr(d.opening)], { bold: true, fill: "#eef3fb" });
  (d.lines || []).forEach((l: any) => row([dmy(l.dt), l.kind + (l.payment_mode ? " (" + l.payment_mode + ")" : ""),
    l.ref || "-", l.debit ? inr(l.debit) : "", l.credit ? inr(l.credit) : "", drcr(l.balance)]));
  if (!(d.lines || []).length) row(["", "No approved GST invoices or payments in this period", "", "", "", ""], { color: MGY });
  row(["", "Total", "", inr(d.total_debit), inr(d.total_credit), drcr(d.closing)], { bold: true, fill: "#eef3fb" });

  // closing balance callout
  y += 12; brk(46);
  doc.rect(M + W * 0.42, y, W * 0.58, 38).fill("#fef0e6").strokeColor(PRIM).lineWidth(1).stroke();
  doc.fillColor(MGY).fontSize(8).font("Helvetica-Bold")
     .text(d.closing >= 0 ? (d.type === "vendor" ? "NET PAYABLE" : "NET RECEIVABLE") : "ADVANCE / EXCESS",
           M + W * 0.42 + 10, y + 7);
  doc.fillColor(PRIM).fontSize(16).font("Helvetica-Bold")
     .text("Rs. " + drcr(d.closing), M + W * 0.42 + 10, y + 18, { width: W * 0.58 - 20 });
  y += 50;

  // note + signature
  brk(120);
  doc.fillColor(MGY).fontSize(7.5).font("Helvetica-Oblique")
     .text("Includes approved GST invoices, credit notes and payments only. Draft, proforma, quotation and cancelled documents are excluded.",
           M, y, { width: W * 0.58 });
  y += 24;
  const sx = M + W - 190;
  doc.fillColor(DGY).fontSize(9).font("Helvetica-Bold").text("For Divyanshi Digital Services Pvt Ltd", sx, y, { width: 190, align: "right" });
  try { if (fs.existsSync(SIGNATURE)) doc.image(SIGNATURE, sx + 30, y + 14, { width: 160 }); } catch (e) {}
  doc.moveTo(sx, y + 78).lineTo(sx + 190, y + 78).lineWidth(0.6).stroke("#aaaaaa");
  doc.fillColor(MGY).fontSize(8).font("Helvetica").text("Authorised Signatory", sx, y + 82, { width: 190, align: "right" });
  doc.fillColor(MGY).fontSize(7.5).font("Helvetica-Oblique")
     .text("This is a computer generated statement.", M, y + 82);
  return y;
}
