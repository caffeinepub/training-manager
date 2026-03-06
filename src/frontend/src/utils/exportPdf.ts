import type { CompletionRecord, TrainingModule } from "@/hooks/useTrainingData";
import { jsPDF } from "jspdf";

/**
 * Generates and downloads a professional PDF completion certificate
 * for a completed training module.
 */
export async function exportCompletionPdf(
  module: TrainingModule,
  completion: CompletionRecord,
): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = 210;
  const pageH = 297;
  const margin = 20;
  const contentW = pageW - margin * 2;

  // ── Colour palette ────────────────────────────────────────────────────────
  const navy = [22, 40, 80] as const; // dark navy header bg
  const teal = [30, 130, 130] as const; // accent / completed stamp
  const green = [39, 150, 96] as const; // success green
  const lightGrey = [245, 246, 248] as const;
  const midGrey = [160, 165, 175] as const;
  const darkText = [28, 32, 42] as const;
  const white = [255, 255, 255] as const;

  // ────────────────────────────────────────────────────────────────────────────
  // HEADER BAR
  // ────────────────────────────────────────────────────────────────────────────
  doc.setFillColor(...navy);
  doc.rect(0, 0, pageW, 38, "F");

  // Accent stripe
  doc.setFillColor(...teal);
  doc.rect(0, 36, pageW, 3, "F");

  // Title
  doc.setTextColor(...white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Training Manager", margin, 18);

  // Sub-title
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(180, 195, 215);
  doc.text("Compliance & Training Platform", margin, 26);

  // Right-aligned: "COMPLETION RECORD"
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(130, 165, 200);
  doc.text("COMPLETION RECORD", pageW - margin, 18, { align: "right" });

  // ────────────────────────────────────────────────────────────────────────────
  // MODULE TITLE + DESCRIPTION
  // ────────────────────────────────────────────────────────────────────────────
  let cursor = 52;

  doc.setTextColor(...darkText);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  const titleLines = doc.splitTextToSize(module.title, contentW) as string[];
  doc.text(titleLines, margin, cursor);
  cursor += titleLines.length * 8 + 4;

  if (module.description) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...midGrey);
    const descLines = doc.splitTextToSize(
      module.description,
      contentW,
    ) as string[];
    doc.text(descLines, margin, cursor);
    cursor += descLines.length * 5 + 4;
  }

  // Divider
  cursor += 4;
  doc.setDrawColor(220, 225, 232);
  doc.setLineWidth(0.4);
  doc.line(margin, cursor, pageW - margin, cursor);
  cursor += 10;

  // ────────────────────────────────────────────────────────────────────────────
  // "TRAINING COMPLETED" STAMP
  // ────────────────────────────────────────────────────────────────────────────
  const stampH = 18;
  const stampW = 80;
  const stampX = (pageW - stampW) / 2;

  doc.setFillColor(232, 250, 242);
  doc.setDrawColor(...green);
  doc.setLineWidth(1.2);
  doc.roundedRect(stampX, cursor, stampW, stampH, 4, 4, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...green);
  doc.text("✓  TRAINING COMPLETED", pageW / 2, cursor + 11, {
    align: "center",
  });

  cursor += stampH + 14;

  // ────────────────────────────────────────────────────────────────────────────
  // COMPLETION DETAILS GRID
  // ────────────────────────────────────────────────────────────────────────────
  const colW = (contentW - 8) / 3; // 3 columns with 4 mm gaps
  const cellH = 22;
  const cells = [
    {
      label: "FULL NAME",
      value: completion.userName,
      x: margin,
    },
    {
      label: "INITIALS",
      value: completion.initials,
      x: margin + colW + 4,
    },
    {
      label: "DATE COMPLETED",
      value: new Date(completion.completedAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      x: margin + (colW + 4) * 2,
    },
  ];

  for (const cell of cells) {
    // Card background
    doc.setFillColor(...lightGrey);
    doc.setDrawColor(220, 225, 232);
    doc.setLineWidth(0.3);
    doc.roundedRect(cell.x, cursor, colW, cellH, 2, 2, "FD");

    // Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...midGrey);
    doc.text(cell.label, cell.x + 4, cursor + 7);

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...darkText);
    const valLines = doc.splitTextToSize(cell.value, colW - 8) as string[];
    doc.text(valLines, cell.x + 4, cursor + 15);
  }

  cursor += cellH + 12;

  // ────────────────────────────────────────────────────────────────────────────
  // SIGNATURE SECTION
  // ────────────────────────────────────────────────────────────────────────────
  const sigBoxW = 90;
  const sigBoxH = 38;
  const sigBoxX = margin;

  doc.setFillColor(...lightGrey);
  doc.setDrawColor(220, 225, 232);
  doc.setLineWidth(0.3);
  doc.roundedRect(sigBoxX, cursor, sigBoxW, sigBoxH, 2, 2, "FD");

  // Label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...midGrey);
  doc.text("SIGNATURE", sigBoxX + 4, cursor + 7);

  // Embed the signature image
  if (completion.signatureData?.startsWith("data:")) {
    try {
      // jsPDF accepts base64 data URLs directly
      const imgFormat = completion.signatureData.includes("image/png")
        ? "PNG"
        : "JPEG";
      doc.addImage(
        completion.signatureData,
        imgFormat,
        sigBoxX + 4,
        cursor + 10,
        sigBoxW - 8,
        sigBoxH - 14,
        undefined,
        "FAST",
      );
    } catch {
      // Fallback: show placeholder text
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(...midGrey);
      doc.text(
        "[Signature on file]",
        sigBoxX + sigBoxW / 2,
        cursor + sigBoxH / 2 + 2,
        {
          align: "center",
        },
      );
    }
  }

  // Initials badge on the right
  const initBadgeX = sigBoxX + sigBoxW + 10;
  const initBadgeW = 40;
  const initBadgeH = sigBoxH;

  doc.setFillColor(...lightGrey);
  doc.setDrawColor(220, 225, 232);
  doc.setLineWidth(0.3);
  doc.roundedRect(initBadgeX, cursor, initBadgeW, initBadgeH, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...midGrey);
  doc.text("INITIALS", initBadgeX + 4, cursor + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...darkText);
  doc.text(
    completion.initials,
    initBadgeX + initBadgeW / 2,
    cursor + initBadgeH - 8,
    {
      align: "center",
    },
  );

  cursor += sigBoxH + 14;

  // ────────────────────────────────────────────────────────────────────────────
  // MODULE INFO (Google Doc link reference)
  // ────────────────────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...midGrey);
  doc.text(`Source document: ${module.googleDocUrl}`, margin, cursor, {
    maxWidth: contentW,
  });
  cursor += 10;

  // ────────────────────────────────────────────────────────────────────────────
  // FOOTER
  // ────────────────────────────────────────────────────────────────────────────
  const footerY = pageH - 22;

  // Footer background
  doc.setFillColor(...lightGrey);
  doc.rect(0, footerY - 6, pageW, 28, "F");

  // Footer accent line
  doc.setFillColor(...teal);
  doc.rect(0, footerY - 6, pageW, 1, "F");

  // Legal text
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...midGrey);
  const legalText =
    "By signing, the trainee confirms they have read and understood this training document in full.";
  doc.text(legalText, pageW / 2, footerY + 4, {
    align: "center",
    maxWidth: contentW,
  });

  // Page number
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(190, 195, 205);
  doc.text("Page 1 of 1", pageW - margin, footerY + 12, { align: "right" });

  // Generated timestamp
  doc.text(
    `Generated: ${new Date().toLocaleString("en-GB")}`,
    margin,
    footerY + 12,
  );

  // ────────────────────────────────────────────────────────────────────────────
  // SAVE
  // ────────────────────────────────────────────────────────────────────────────
  const safeName = module.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  doc.save(`${safeName}-completion.pdf`);
}
