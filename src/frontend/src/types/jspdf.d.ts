// Minimal type shim for jsPDF so TypeScript doesn't error on import.
// The actual runtime import is done via CDN / dynamic load in exportPdf.ts.
declare module "jspdf" {
  interface jsPDFOptions {
    orientation?: "portrait" | "landscape";
    unit?: "mm" | "pt" | "cm" | "in" | "px";
    format?: string | number[];
  }

  class jsPDF {
    constructor(options?: jsPDFOptions);
    setFillColor(r: number, g: number, b: number): this;
    setDrawColor(r: number, g: number, b: number): this;
    setTextColor(r: number, g: number, b: number): this;
    setFont(fontName: string, fontStyle?: string): this;
    setFontSize(size: number): this;
    setLineWidth(width: number): this;
    rect(x: number, y: number, w: number, h: number, style?: string): this;
    roundedRect(
      x: number,
      y: number,
      w: number,
      h: number,
      rx: number,
      ry: number,
      style?: string,
    ): this;
    line(x1: number, y1: number, x2: number, y2: number): this;
    text(
      text: string | string[],
      x: number,
      y: number,
      options?: { align?: string; maxWidth?: number },
    ): this;
    splitTextToSize(text: string, maxWidth: number): string[];
    addImage(
      imageData: string,
      format: string,
      x: number,
      y: number,
      w: number,
      h: number,
      alias?: string,
      compression?: string,
    ): this;
    save(filename: string): void;
  }

  export { jsPDF };
}
