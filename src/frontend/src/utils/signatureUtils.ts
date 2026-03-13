export function textToSignatureImage(text: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 80;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "italic 36px Georgia, serif";
  ctx.fillStyle = "#1a1a2e";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 12, 40);
  return canvas.toDataURL("image/png");
}
