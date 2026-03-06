import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export type SignaturePadHandle = {
  getDataURL: () => string;
  hasStrokes: () => boolean;
  clear: () => void;
};

type Props = {
  onChange?: (hasStrokes: boolean) => void;
};

const SignaturePad = forwardRef<SignaturePadHandle, Props>(
  ({ onChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawingRef = useRef(false);
    const hasStrokesRef = useRef(false);
    const [hasStrokes, setHasStrokes] = useState(false);

    const getCtx = useCallback((): CanvasRenderingContext2D | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      return canvas.getContext("2d");
    }, []);

    const getCanvasPos = useCallback(
      (
        e: MouseEvent | Touch,
        canvas: HTMLCanvasElement,
      ): { x: number; y: number } => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY,
        };
      },
      [],
    );

    const initCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.strokeStyle = "#1e2d5a";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }, []);

    useEffect(() => {
      initCanvas();
    }, [initCanvas]);

    // Resize observer to handle canvas sizing
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resizeObserver = new ResizeObserver(() => {
        // Save current image data
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Resize
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // Restore
        ctx.putImageData(imageData, 0, 0);
        initCanvas();
      });

      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      resizeObserver.observe(canvas);

      return () => resizeObserver.disconnect();
    }, [initCanvas]);

    const startDrawing = useCallback(
      (x: number, y: number) => {
        const ctx = getCtx();
        if (!ctx) return;
        isDrawingRef.current = true;
        ctx.beginPath();
        ctx.moveTo(x, y);
      },
      [getCtx],
    );

    const draw = useCallback(
      (x: number, y: number) => {
        if (!isDrawingRef.current) return;
        const ctx = getCtx();
        if (!ctx) return;
        ctx.lineTo(x, y);
        ctx.stroke();

        if (!hasStrokesRef.current) {
          hasStrokesRef.current = true;
          setHasStrokes(true);
          onChange?.(true);
        }
      },
      [getCtx, onChange],
    );

    const stopDrawing = useCallback(() => {
      isDrawingRef.current = false;
    }, []);

    const clear = useCallback(() => {
      const canvas = canvasRef.current;
      const ctx = getCtx();
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasStrokesRef.current = false;
      setHasStrokes(false);
      onChange?.(false);
    }, [getCtx, onChange]);

    // Mouse events
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const handleMouseDown = (e: MouseEvent) => {
        const pos = getCanvasPos(e, canvas);
        startDrawing(pos.x, pos.y);
      };
      const handleMouseMove = (e: MouseEvent) => {
        const pos = getCanvasPos(e, canvas);
        draw(pos.x, pos.y);
      };
      const handleMouseUp = () => stopDrawing();
      const handleMouseLeave = () => stopDrawing();

      canvas.addEventListener("mousedown", handleMouseDown);
      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("mouseup", handleMouseUp);
      canvas.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        canvas.removeEventListener("mousedown", handleMouseDown);
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseup", handleMouseUp);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
      };
    }, [startDrawing, draw, stopDrawing, getCanvasPos]);

    // Touch events
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        const touch = e.touches[0];
        const pos = getCanvasPos(touch, canvas);
        startDrawing(pos.x, pos.y);
      };
      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        const touch = e.touches[0];
        const pos = getCanvasPos(touch, canvas);
        draw(pos.x, pos.y);
      };
      const handleTouchEnd = (e: TouchEvent) => {
        e.preventDefault();
        stopDrawing();
      };

      canvas.addEventListener("touchstart", handleTouchStart, {
        passive: false,
      });
      canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
      canvas.addEventListener("touchend", handleTouchEnd, { passive: false });

      return () => {
        canvas.removeEventListener("touchstart", handleTouchStart);
        canvas.removeEventListener("touchmove", handleTouchMove);
        canvas.removeEventListener("touchend", handleTouchEnd);
      };
    }, [startDrawing, draw, stopDrawing, getCanvasPos]);

    useImperativeHandle(ref, () => ({
      getDataURL: () => {
        const canvas = canvasRef.current;
        if (!canvas) return "";
        return canvas.toDataURL("image/png");
      },
      hasStrokes: () => hasStrokesRef.current,
      clear,
    }));

    return (
      <div className="space-y-2">
        <div className="relative">
          {/* Canvas container */}
          <div
            className="relative border-2 border-border rounded-md overflow-hidden bg-white"
            style={{ height: "160px" }}
          >
            <canvas
              ref={canvasRef}
              data-ocid="module.signature_canvas"
              className="signature-canvas w-full h-full block"
              style={{ touchAction: "none" }}
            />
            {/* Watermark */}
            {!hasStrokes && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                <div className="text-center">
                  <div
                    className="text-sm font-display font-semibold tracking-widest uppercase"
                    style={{ color: "oklch(0.82 0.015 240)" }}
                  >
                    Sign Here
                  </div>
                  <div
                    className="mt-1 text-xs"
                    style={{ color: "oklch(0.78 0.012 240)" }}
                  >
                    Draw your signature with mouse or finger
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Baseline */}
        <div className="flex items-center justify-between">
          <div
            className="text-xs font-body"
            style={{ color: "oklch(0.55 0.03 245)" }}
          >
            {hasStrokes
              ? "✓ Signature captured"
              : "Signature is required to complete"}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clear}
            data-ocid="module.clear_signature_button"
            className="gap-1.5 text-xs h-7"
          >
            <RotateCcw className="w-3 h-3" />
            Clear
          </Button>
        </div>
      </div>
    );
  },
);

SignaturePad.displayName = "SignaturePad";

export default SignaturePad;
