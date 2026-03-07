import { Button } from "@/components/ui/button";
import { PenLine, RotateCcw } from "lucide-react";
import { forwardRef, useImperativeHandle, useState } from "react";

export type SignaturePadHandle = {
  getDataURL: () => string;
  hasStrokes: () => boolean;
  clear: () => void;
};

type Props = {
  onChange?: (hasStrokes: boolean) => void;
  name?: string;
};

const SignaturePad = forwardRef<SignaturePadHandle, Props>(
  ({ onChange, name }, ref) => {
    const [isSigned, setIsSigned] = useState(false);
    const [signatureText, setSignatureText] = useState("");

    const generateSignatureDataURL = (text: string): string => {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 120;
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";

      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the signature text
      ctx.fillStyle = "#1e2d5a";
      ctx.font = "italic 42px 'Instrument Serif', 'Georgia', serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);

      // Draw a subtle underline
      const textMetrics = ctx.measureText(text);
      const lineY = canvas.height / 2 + 26;
      const lineX = canvas.width / 2 - textMetrics.width / 2;
      ctx.strokeStyle = "#1e2d5a";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lineX, lineY);
      ctx.lineTo(lineX + textMetrics.width, lineY);
      ctx.stroke();

      return canvas.toDataURL("image/png");
    };

    const handleSign = () => {
      const text = name?.trim() || "Signature";
      setSignatureText(text);
      setIsSigned(true);
      onChange?.(true);
    };

    const handleClear = () => {
      setSignatureText("");
      setIsSigned(false);
      onChange?.(false);
    };

    useImperativeHandle(ref, () => ({
      getDataURL: () => {
        if (!isSigned) return "";
        return generateSignatureDataURL(signatureText);
      },
      hasStrokes: () => isSigned,
      clear: handleClear,
    }));

    return (
      <div className="space-y-2">
        {/* Signature box */}
        <div
          className="relative overflow-hidden bg-white"
          style={{
            height: "160px",
            border: isSigned
              ? "2px solid oklch(0.7 0.02 240)"
              : "2px dashed oklch(0.75 0.025 240)",
            borderRadius: "0.375rem",
          }}
        >
          {isSigned ? (
            /* Signed state */
            <div className="w-full h-full flex flex-col items-center justify-center px-4">
              <span
                className="signature-text text-center leading-none"
                style={{
                  fontFamily: "'Instrument Serif', 'Georgia', serif",
                  fontStyle: "italic",
                  fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                  color: "#1e2d5a",
                  borderBottom: "1.5px solid #1e2d5a",
                  paddingBottom: "4px",
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {signatureText}
              </span>
            </div>
          ) : (
            /* Unsigned state — click to sign */
            <button
              type="button"
              onClick={handleSign}
              data-ocid="module.click_to_sign_button"
              className="w-full h-full flex flex-col items-center justify-center gap-2 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={
                {
                  "--tw-ring-color": "oklch(var(--ring))",
                } as React.CSSProperties
              }
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "oklch(0.93 0.015 240)" }}
              >
                <PenLine
                  className="w-5 h-5"
                  style={{ color: "oklch(var(--primary))" }}
                />
              </div>
              <span
                className="text-sm font-body font-semibold"
                style={{ color: "oklch(var(--primary))" }}
              >
                Click to Sign
              </span>
              <span
                className="text-xs font-body"
                style={{ color: "oklch(0.6 0.02 240)" }}
              >
                Generates a typed signature
              </span>
            </button>
          )}
        </div>

        {/* Status row */}
        <div className="flex items-center justify-between">
          <div
            className="text-xs font-body"
            style={{ color: "oklch(0.55 0.03 245)" }}
          >
            {isSigned
              ? "✓ Signature captured"
              : "Signature is required to complete"}
          </div>
          {isSigned && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              data-ocid="module.clear_signature_button"
              className="gap-1.5 text-xs h-7"
            >
              <RotateCcw className="w-3 h-3" />
              Clear
            </Button>
          )}
        </div>
      </div>
    );
  },
);

SignaturePad.displayName = "SignaturePad";

export default SignaturePad;
