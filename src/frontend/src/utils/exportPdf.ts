import type { CompletionRecord, TrainingModule } from "@/hooks/useTrainingData";

// jsPDF is loaded from CDN at runtime to avoid a missing npm package.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsPDFInstance = any;

async function loadJsPDF(): Promise<{ new (opts: object): JsPDFInstance }> {
  return new Promise((resolve, reject) => {
    if ((window as unknown as Record<string, unknown>).jspdf) {
      resolve(
        (window as unknown as Record<string, unknown>).jspdf as JsPDFInstance,
      );
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.onload = () => {
      const w = window as unknown as Record<string, unknown>;
      if (w.jspdf) {
        resolve((w.jspdf as Record<string, unknown>).jsPDF as JsPDFInstance);
      } else {
        reject(new Error("jsPDF not found on window after script load"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load jsPDF from CDN"));
    document.head.appendChild(script);
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function drawPageHeader(doc: JsPDFInstance, pageW: number): void {
  const navy = [22, 40, 80] as const;
  const teal = [30, 130, 130] as const;
  const white = [255, 255, 255] as const;
  const margin = 20;

  doc.setFillColor(...navy);
  doc.rect(0, 0, pageW, 38, "F");
  doc.setFillColor(...teal);
  doc.rect(0, 36, pageW, 3, "F");

  doc.setTextColor(...white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Training Manager", margin, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(180, 195, 215);
  doc.text("Compliance & Training Platform", margin, 26);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(130, 165, 200);
  doc.text("COMPLETION RECORD", pageW - margin, 18, { align: "right" });
}

function drawPageFooter(
  doc: JsPDFInstance,
  pageW: number,
  pageH: number,
  pageNum: number,
  pageCount: number,
): void {
  const margin = 20;
  const lightGrey = [245, 246, 248] as const;
  const teal = [30, 130, 130] as const;
  const midGrey = [160, 165, 175] as const;

  const footerY = pageH - 22;

  doc.setFillColor(...lightGrey);
  doc.rect(0, footerY - 6, pageW, 28, "F");
  doc.setFillColor(...teal);
  doc.rect(0, footerY - 6, pageW, 1, "F");

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...midGrey);
  doc.text(
    "By signing, the trainee confirms they have read and understood this training document in full.",
    pageW / 2,
    footerY + 4,
    { align: "center", maxWidth: pageW - margin * 2 },
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(190, 195, 205);
  doc.text(`Page ${pageNum} of ${pageCount}`, pageW - margin, footerY + 12, {
    align: "right",
  });
  doc.text(
    `Generated: ${new Date().toLocaleString("en-GB")}`,
    margin,
    footerY + 12,
  );
}

function checkNewPage(
  doc: JsPDFInstance,
  cursor: number,
  neededHeight: number,
  pageW: number,
  pageH: number,
  pages: { count: number },
): number {
  const safeBottom = pageH - 40;
  if (cursor + neededHeight > safeBottom) {
    // Draw footer on current page before adding new one
    drawPageFooter(doc, pageW, pageH, pages.count, pages.count + 1);
    doc.addPage();
    pages.count += 1;
    drawPageHeader(doc, pageW);
    return 52; // reset cursor below header
  }
  return cursor;
}

function drawSectionLabel(
  doc: JsPDFInstance,
  label: string,
  x: number,
  y: number,
  contentW: number,
): number {
  const navy = [22, 40, 80] as const;
  const white = [255, 255, 255] as const;

  doc.setFillColor(...navy);
  doc.rect(x, y, contentW, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...white);
  doc.text(label, x + 3, y + 5);
  return y + 7;
}

function drawCheckboxRow(
  doc: JsPDFInstance,
  items: { label: string; checked: boolean }[],
  x: number,
  y: number,
  contentW: number,
): number {
  const darkText = [28, 32, 42] as const;
  const teal = [30, 130, 130] as const;

  const colW = contentW / items.length;
  items.forEach((item, idx) => {
    const cx = x + idx * colW + 3;
    const cy = y + 1;

    // Draw checkbox square
    if (item.checked) {
      doc.setFillColor(...teal);
      doc.rect(cx, cy, 4, 4, "F");
      // White checkmark
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.6);
      doc.line(cx + 0.8, cy + 2.2, cx + 1.8, cy + 3.2);
      doc.line(cx + 1.8, cy + 3.2, cx + 3.2, cy + 1);
    } else {
      doc.setDrawColor(...teal);
      doc.setLineWidth(0.5);
      doc.rect(cx, cy, 4, 4);
    }

    // Label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...darkText);
    doc.text(item.label, cx + 5.5, cy + 3.2);
  });

  return y + 10;
}

/**
 * Generates and downloads a full sign-off form PDF for a completed training module.
 */
export async function exportCompletionPdf(
  module: TrainingModule,
  completion: CompletionRecord,
): Promise<void> {
  const JsPDF = await loadJsPDF();
  const doc: JsPDFInstance = new JsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageW = 210;
  const pageH = 297;
  const margin = 20;
  const contentW = pageW - margin * 2;

  // ── Colour palette ────────────────────────────────────────────────────────
  const navy = [22, 40, 80] as const;
  const teal = [30, 130, 130] as const;
  const green = [39, 150, 96] as const;
  const lightGrey = [245, 246, 248] as const;
  const midGrey = [160, 165, 175] as const;
  const darkText = [28, 32, 42] as const;
  const white = [255, 255, 255] as const;
  const borderGrey = [220, 225, 232] as const;

  // Page counter for multi-page support
  const pages = { count: 1 };

  // ── Page 1 header ────────────────────────────────────────────────────────
  drawPageHeader(doc, pageW);

  let cursor = 52;

  // ── MODULE TITLE + DESCRIPTION ───────────────────────────────────────────
  doc.setTextColor(...darkText);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  const titleLines = doc.splitTextToSize(module.title, contentW) as string[];
  cursor = checkNewPage(
    doc,
    cursor,
    titleLines.length * 8 + 10,
    pageW,
    pageH,
    pages,
  );
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
    cursor = checkNewPage(
      doc,
      cursor,
      descLines.length * 5 + 8,
      pageW,
      pageH,
      pages,
    );
    doc.text(descLines, margin, cursor);
    cursor += descLines.length * 5 + 4;
  }

  // Divider
  cursor += 4;
  doc.setDrawColor(...borderGrey);
  doc.setLineWidth(0.4);
  doc.line(margin, cursor, pageW - margin, cursor);
  cursor += 10;

  // ── "TRAINING COMPLETED" STAMP ────────────────────────────────────────────
  cursor = checkNewPage(doc, cursor, 32, pageW, pageH, pages);
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
  cursor += stampH + 12;

  // ── INFO ROW: Full Name + Date Completed ──────────────────────────────────
  cursor = checkNewPage(doc, cursor, 28, pageW, pageH, pages);
  const colW2 = (contentW - 6) / 2;
  const cellH = 22;
  const infoCells = [
    {
      label: "FULL NAME",
      value: completion.userName,
      x: margin,
    },
    {
      label: "DATE COMPLETED",
      value: new Date(completion.completedAt).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      x: margin + colW2 + 6,
    },
  ];

  for (const cell of infoCells) {
    doc.setFillColor(...lightGrey);
    doc.setDrawColor(...borderGrey);
    doc.setLineWidth(0.3);
    doc.roundedRect(cell.x, cursor, colW2, cellH, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...midGrey);
    doc.text(cell.label, cell.x + 4, cursor + 7);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...darkText);
    const valLines = doc.splitTextToSize(cell.value, colW2 - 8) as string[];
    doc.text(valLines, cell.x + 4, cursor + 15);
  }
  cursor += cellH + 12;

  // ── TYPE OF TRAINING ──────────────────────────────────────────────────────
  cursor = checkNewPage(doc, cursor, 24, pageW, pageH, pages);
  cursor = drawSectionLabel(doc, "TYPE OF TRAINING", margin, cursor, contentW);
  cursor += 3;

  const trainingType = completion.trainingType;
  const trainingItems = [
    { label: "Policy", checked: trainingType?.policy ?? false },
    { label: "SOP", checked: trainingType?.sop ?? false },
    {
      label: "Operational Manual",
      checked: trainingType?.operationalManual ?? false,
    },
  ];
  cursor = drawCheckboxRow(doc, trainingItems, margin, cursor, contentW);
  cursor += 8;

  // ── STEPS OF RELEASE PROCESS ──────────────────────────────────────────────
  cursor = checkNewPage(doc, cursor, 24, pageW, pageH, pages);
  cursor = drawSectionLabel(
    doc,
    "STEPS OF RELEASE PROCESS",
    margin,
    cursor,
    contentW,
  );
  cursor += 3;

  const releaseSteps = completion.releaseSteps;
  const releaseItems = [
    { label: "Read Out Loud", checked: releaseSteps?.readOutLoud ?? false },
    { label: "Demonstration", checked: releaseSteps?.demonstration ?? false },
    { label: "Role Playing", checked: releaseSteps?.rolePlaying ?? false },
    {
      label: "Independent Execution",
      checked: releaseSteps?.independentExecution ?? false,
    },
  ];
  cursor = drawCheckboxRow(doc, releaseItems, margin, cursor, contentW);
  cursor += 8;

  // ── TEAM MEMBER TRAINING ACKNOWLEDGEMENT ──────────────────────────────────
  cursor = checkNewPage(doc, cursor, 12, pageW, pageH, pages);
  cursor = drawSectionLabel(
    doc,
    "TEAM MEMBER TRAINING ACKNOWLEDGEMENT",
    margin,
    cursor,
    contentW,
  );
  cursor += 4;

  // Instruction paragraph
  const ackIntroText =
    "Please read each statement below and initial each one. By doing so, you acknowledge that these steps have been completed and confirm your ability to perform the tasks as outlined in the training document specified above in the Information Section.";
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(...midGrey);
  const ackIntroLines = doc.splitTextToSize(ackIntroText, contentW) as string[];
  cursor = checkNewPage(
    doc,
    cursor,
    ackIntroLines.length * 4.5 + 6,
    pageW,
    pageH,
    pages,
  );
  doc.text(ackIntroLines, margin, cursor);
  cursor += ackIntroLines.length * 4.5 + 5;

  const ackInitials = completion.acknowledgementInitials;
  const ackStatements = [
    {
      text: "My manager and I read the document out loud together.",
      initial: ackInitials?.step1 ?? "",
    },
    {
      text: "I have been shown how to properly complete the tasks in this document.",
      initial: ackInitials?.step2 ?? "",
    },
    {
      text: "I have demonstrated that I can properly complete the tasks in this document.",
      initial: ackInitials?.step3 ?? "",
    },
    {
      text: "I completed the tasks in this document independently without any assistance.",
      initial: ackInitials?.step4 ?? "",
    },
  ];

  const ackRowH = 11;
  const initBoxW = 22;
  const textAreaW = contentW - initBoxW - 8;

  for (let i = 0; i < ackStatements.length; i++) {
    const stmt = ackStatements[i];
    const stmtLines = doc.splitTextToSize(
      `• ${stmt.text}`,
      textAreaW,
    ) as string[];
    const rowH = Math.max(ackRowH, stmtLines.length * 4.5 + 4);

    cursor = checkNewPage(doc, cursor, rowH + 2, pageW, pageH, pages);

    // Row background (alternate)
    if (i % 2 === 0) {
      doc.setFillColor(250, 251, 253);
    } else {
      doc.setFillColor(...white);
    }
    doc.setDrawColor(...borderGrey);
    doc.setLineWidth(0.3);
    doc.rect(margin, cursor, contentW, rowH, "FD");

    // Statement text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...darkText);
    doc.text(stmtLines, margin + 3, cursor + 4.5);

    // Initials box (right side)
    const initX = margin + textAreaW + 5;
    doc.setFillColor(...lightGrey);
    doc.setDrawColor(...teal);
    doc.setLineWidth(0.4);
    doc.rect(initX, cursor + 1.5, initBoxW, rowH - 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...navy);
    const initVal = stmt.initial || "______";
    doc.text(initVal, initX + initBoxW / 2, cursor + rowH / 2 + 1.5, {
      align: "center",
    });

    cursor += rowH + 1;
  }
  cursor += 8;

  // ── ACKNOWLEDGMENT OF RECEIPT OF TRAINING ─────────────────────────────────
  cursor = checkNewPage(doc, cursor, 30, pageW, pageH, pages);
  cursor = drawSectionLabel(
    doc,
    "ACKNOWLEDGMENT OF RECEIPT OF TRAINING",
    margin,
    cursor,
    contentW,
  );
  cursor += 4;

  const receiptText =
    "By signing this form, the team member acknowledges that they have received this training and are now fully capable of adhering to the guidelines outlined in this document. The manager confirms that the training has been completed, understanding has been ensured, and the employee is fully prepared to follow the procedures specified in this document.";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...darkText);
  const receiptLines = doc.splitTextToSize(receiptText, contentW) as string[];
  cursor = checkNewPage(
    doc,
    cursor,
    receiptLines.length * 4.5 + 6,
    pageW,
    pageH,
    pages,
  );
  doc.text(receiptLines, margin, cursor);
  cursor += receiptLines.length * 4.5 + 10;

  // ── SIGNATURE BLOCKS ──────────────────────────────────────────────────────
  const sigBlockW = (contentW - 8) / 2;
  const sigBoxH = 30;
  const sigImgH = 18;
  const sigLineY = cursor + 5 + sigImgH + 3;

  cursor = checkNewPage(doc, cursor, sigBoxH + 24, pageW, pageH, pages);

  const sigBlocks = [
    {
      label: "TEAM MEMBER'S SIGNATURE",
      sigData: completion.signatureData,
      name: completion.userName,
      date: new Date(completion.completedAt).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      x: margin,
    },
    {
      label: "MANAGER'S SIGNATURE",
      sigData: completion.managerSignatureData,
      name: completion.managerName ?? "",
      date: new Date(completion.completedAt).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      x: margin + sigBlockW + 8,
    },
  ];

  for (const block of sigBlocks) {
    // Section label bar
    doc.setFillColor(...lightGrey);
    doc.setDrawColor(...borderGrey);
    doc.setLineWidth(0.3);
    doc.rect(block.x, cursor, sigBlockW, 7, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...midGrey);
    doc.text(block.label, block.x + 3, cursor + 5);

    // Signature image area
    const sigAreaY = cursor + 8;
    doc.setFillColor(252, 253, 255);
    doc.setDrawColor(...borderGrey);
    doc.setLineWidth(0.3);
    doc.rect(block.x, sigAreaY, sigBlockW, sigImgH, "FD");

    if (block.sigData?.startsWith("data:")) {
      try {
        const imgFormat = block.sigData.includes("image/png") ? "PNG" : "JPEG";
        doc.addImage(
          block.sigData,
          imgFormat,
          block.x + 2,
          sigAreaY + 1,
          sigBlockW - 4,
          sigImgH - 2,
          undefined,
          "FAST",
        );
      } catch {
        // Show placeholder line if image fails
        doc.setDrawColor(...midGrey);
        doc.setLineWidth(0.4);
        doc.line(
          block.x + 4,
          sigAreaY + sigImgH / 2,
          block.x + sigBlockW - 4,
          sigAreaY + sigImgH / 2,
        );
      }
    } else {
      // Blank signature line
      doc.setDrawColor(...midGrey);
      doc.setLineWidth(0.4);
      doc.line(
        block.x + 4,
        sigAreaY + sigImgH - 4,
        block.x + sigBlockW - 4,
        sigAreaY + sigImgH - 4,
      );
    }

    // Name below signature
    const nameY = sigAreaY + sigImgH + 5;
    doc.setDrawColor(...borderGrey);
    doc.setLineWidth(0.25);
    doc.line(block.x, nameY + 1, block.x + sigBlockW, nameY + 1);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...darkText);
    doc.text(block.name || "", block.x + 2, nameY - 0.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...midGrey);
    doc.text("Name", block.x + 2, nameY + 5);

    // Date
    const dateY = nameY + 9;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...darkText);
    doc.text(`Date: ${block.date}`, block.x + 2, dateY);

    void sigLineY; // suppress unused warning
  }

  cursor += 7 + sigImgH + 22;

  // ── FOOTER ────────────────────────────────────────────────────────────────
  // Update total page count now that we know it
  const totalPages = pages.count;
  drawPageFooter(doc, pageW, pageH, totalPages, totalPages);

  // ── SAVE ─────────────────────────────────────────────────────────────────
  const safeName = module.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  doc.save(`${safeName}-completion.pdf`);
}
