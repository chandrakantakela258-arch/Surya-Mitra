import { PDFDocument } from "pdf-lib";
import { getInsertPdfBytes } from "./livguardInsertData";

export type ProposalType = "dcr" | "nonDcr";

/**
 * Merge proposal with Livguard insert pages.
 * Insert pages go AFTER page 2 (Cover + Install Details),
 * BEFORE the remaining content (Solar Benefits, About, etc.)
 * Uses embedded PDF data — no server fetch needed.
 */
export async function mergeWithLivguardInsert(
  proposalBytes: Uint8Array | ArrayBuffer,
  proposalType: ProposalType
): Promise<Uint8Array> {
  const proposalDoc = await PDFDocument.load(proposalBytes);
  const insertBytes = getInsertPdfBytes(proposalType);
  const insertDoc = await PDFDocument.load(insertBytes);

  const merged = await PDFDocument.create();
  const proposalPageCount = proposalDoc.getPageCount();
  const insertPageIndices = insertDoc.getPageIndices();

  // 1. First 2 proposal pages (Cover + Install Details)
  const firstTwo = await merged.copyPages(proposalDoc, [0, 1]);
  for (const p of firstTwo) merged.addPage(p);

  // 2. ALL insert pages (Certificate if Non-DCR + 5 product pages)
  const inserts = await merged.copyPages(insertDoc, insertPageIndices);
  for (const p of inserts) merged.addPage(p);

  // 3. Remaining proposal pages (page 3 onwards)
  const remainingIndices = Array.from({ length: proposalPageCount - 2 }, (_, i) => i + 2);
  if (remainingIndices.length > 0) {
    const rest = await merged.copyPages(proposalDoc, remainingIndices);
    for (const p of rest) merged.addPage(p);
  }

  return await merged.save();
}

export function downloadPdfBlob(pdfBytes: Uint8Array, filename: string): void {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
