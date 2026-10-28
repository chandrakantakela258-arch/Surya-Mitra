import fs from "fs";
const LETTERHEAD = "/root/surya-mitra-host/uploads/pdf-inserts/divyanshi_letterhead.jpg";
const SIGNATURE = "/root/surya-mitra-host/uploads/pdf-inserts/divyanshi_director_signature.jpg";
const BODY_TOP = 200;
const AGENCY = {
  name: "Divyanshi Digital Services Pvt Ltd",
  signatory: "Nivedita Singh",
  address: "Bank of India Building, Naubatpur, Mashurhi Road, Vill-Piprawan, Panchayat Jaitipur, Block-Naubatpur, Patna, Bihar 801109",
  contact: "9801005212",
  email: "chandrakant@divyanshisolar.in",
};
function drawHead(doc: any) {
  try { if (fs.existsSync(LETTERHEAD)) doc.image(LETTERHEAD, 0, 0, { width: doc.page.width, height: doc.page.height }); } catch (e) {}
}
export function buildAnnexure1(doc: any, d: any) {
  drawHead(doc);
  const M = 55, W = doc.page.width - M * 2, DK = "#000000";
  const joined = Array.isArray(d.to_lines) ? d.to_lines.join(" ") : "";
  const discom = d.discom || (/NBPDCL/i.test(joined) ? "NBPDCL" : "SBPDCL");
  const circle = d.circle || "East";
  const lab = d.lab || (discom === "NBPDCL" ? "Chapra East" : `${circle} Circle`);
  const a = d.agency || AGENCY;
  let y = BODY_TOP, h = 0;
  const brk = (need: number) => { if (y + need > doc.page.height - 95) { doc.addPage(); drawHead(doc); y = BODY_TOP; } };
  doc.fillColor(DK).font("Helvetica-Bold").fontSize(12);
  const t = "Annexure - I", tw = doc.widthOfString(t), tx = M + (W - tw) / 2;
  doc.text(t, tx, y);
  doc.moveTo(tx, y + 14).lineTo(tx + tw, y + 14).lineWidth(0.8).stroke(DK);
  y += 26;
  doc.fontSize(10).font("Helvetica-Bold");
  doc.text(`Letter No.: ${d.letter_no || ""}`, M, y, { width: W / 2 });
  doc.text(`Date: ${d.date_str || ""}`, M + W / 2, y, { width: W / 2, align: "right" });
  y += 22;
  doc.font("Helvetica-Bold").text("To,", M, y); y += 15;
  doc.font("Helvetica");
  doc.text("Chief Engineer (Project-I) Urban", M + 40, y); y += 13;
  doc.text(discom, M + 40, y); y += 18;
  const sub = `Sub:- Request letter for testing of solar meters for in ${lab} MRT lab under ${discom}.`;
  doc.font("Helvetica-Bold");
  h = doc.heightOfString(sub, { width: W });
  doc.text(sub, M, y, { width: W }); y += h + 6;
  const refs: string[] = [];
  if (d.ref1_no) refs.push(`Letter No- ${d.ref1_no} dtd ${d.ref1_date || ""} Regarding testing of solar meters under PM Surya Ghar Yojna.`);
  if (d.prev_cert && d.prev_cert.letter_no) refs.push(`Meter Utilization Certificate No- ${d.prev_cert.letter_no} dtd ${d.prev_cert.date_str || ""} (Annexure-II) of the solar meters issued earlier.`);
  if (refs.length) {
    doc.font("Helvetica-Bold").text("Ref:", M, y); y += 14;
    doc.font("Helvetica");
    refs.forEach((rt: string, i: number) => {
      const ln = `${i + 1}.  ${rt}`;
      const hr = doc.heightOfString(ln, { width: W - 30 });
      doc.text(ln, M + 25, y, { width: W - 30 }); y += hr + 4;
    });
  }
  y += 6;
  doc.font("Helvetica-Bold").text("Sir,", M, y); y += 18;
  const n = (d.items || []).length;
  const body = `With reference to the subject mentioned above, we are submitting following ${n} no of solar meters for testing in ${lab} MRT under ${discom}.`;
  doc.font("Helvetica").fontSize(10);
  h = doc.heightOfString(body, { width: W, align: "justify", lineGap: 2 });
  doc.text(body, M, y, { width: W, align: "justify", lineGap: 2 });
  y += h + 14;
  const COLS = [45, 180, 260];
  const HEAD = ["S.No", "Solar Meter Serial No", "Solar Meter Make"];
  const colX: number[] = [];
  COLS.reduce((acc, w, i) => { colX[i] = M + acc; return acc + w; }, 0);
  const vline = (p: number, q: number) => colX.forEach((x, i) => { if (i > 0) doc.moveTo(x, p).lineTo(x, q).lineWidth(0.7).stroke(DK); });
  brk(70);
  doc.rect(M, y, W, 18).lineWidth(0.7).stroke(DK);
  doc.font("Helvetica-Bold").fontSize(10).text("Single Phase Meter", M, y + 5, { width: W, align: "center" });
  y += 18;
  doc.font("Helvetica-Bold").fontSize(9);
  let hh = 0;
  HEAD.forEach((s, i) => { hh = Math.max(hh, doc.heightOfString(s, { width: COLS[i] - 8 })); });
  hh += 10;
  doc.rect(M, y, W, hh).stroke(DK);
  HEAD.forEach((s, i) => doc.text(s, colX[i] + 4, y + 5, { width: COLS[i] - 8 }));
  vline(y, y + hh); y += hh;
  (d.items || []).forEach((it: any, idx: number) => {
    const vals = [String(idx + 1), it.meter_serial_no || "", it.meter_make || ""];
    doc.font("Helvetica").fontSize(9);
    let rh = 0;
    vals.forEach((v, i) => { rh = Math.max(rh, doc.heightOfString(String(v), { width: COLS[i] - 8 })); });
    rh += 9; brk(rh);
    doc.rect(M, y, W, rh).stroke(DK);
    vals.forEach((v, i) => doc.text(String(v), colX[i] + 4, y + 4, { width: COLS[i] - 8 }));
    vline(y, y + rh); y += rh;
  });
  y += 14; brk(50);
  if (d.prev_cert && d.prev_cert.letter_no) {
    const att = `The Meter Utilization Certificate (Annexure-II) No- ${d.prev_cert.letter_no} dtd ${d.prev_cert.date_str || ""}, showing 80% or more utilization of the solar meters issued to us earlier, is attached herewith for your kind reference.`;
    doc.font("Helvetica").fontSize(10);
    const ha = doc.heightOfString(att, { width: W, align: "justify", lineGap: 2 });
    brk(ha + 20);
    doc.text(att, M, y, { width: W, align: "justify", lineGap: 2 });
    y += ha + 12;
  }
  const close = "Therefore, we kindly request you to test the above mentioned meters at the earliest and support us so that we can proceed further.";
  doc.font("Helvetica").fontSize(10);
  h = doc.heightOfString(close, { width: W, align: "justify", lineGap: 2 });
  doc.text(close, M, y, { width: W, align: "justify", lineGap: 2 });
  y += h + 24; brk(180);
  doc.font("Helvetica").fontSize(10);
  ["Thanks & Regards", "Sign & seal of the vendor"].forEach(l => { doc.text(l, M + 40, y, { width: W - 40 }); y += 14; });
  try { if (fs.existsSync(SIGNATURE)) { doc.image(SIGNATURE, M + 40, y + 2, { width: 165 }); y += 68; } } catch (e) {}
  doc.font("Helvetica").fontSize(10);
  [`Name: ${a.signatory || AGENCY.signatory}`, `Agency Name- ${a.name || AGENCY.name}`,
   `Address of Agency- ${a.address || AGENCY.address}`, `Contact no- ${a.contact || AGENCY.contact}`,
   `Email id- ${a.email || AGENCY.email}`].forEach(l => {
    const lh = doc.heightOfString(l, { width: W - 40 });
    doc.text(l, M + 40, y, { width: W - 40 }); y += lh + 3;
  });
  return y;
}
