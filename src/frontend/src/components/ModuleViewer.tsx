import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CompletionRecord, TrainingModule } from "@/hooks/useTrainingData";
import { exportCompletionPdf } from "@/utils/exportPdf";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Pen,
  ShieldCheck,
  User,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import SignaturePad, { type SignaturePadHandle } from "./SignaturePad";

type Props = {
  module: TrainingModule;
  completion: CompletionRecord | undefined;
  onBack: () => void;
  onComplete: (data: {
    userName: string;
    initials: string;
    signatureData: string;
  }) => void;
};

export default function ModuleViewer({
  module,
  completion,
  onBack,
  onComplete,
}: Props) {
  const [userName, setUserName] = useState("");
  const [initials, setInitials] = useState("");
  const [hasSignature, setHasSignature] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const sigPadRef = useRef<SignaturePadHandle>(null);

  const handleDownloadPdf = async () => {
    if (!completion) return;
    setIsDownloading(true);
    try {
      await exportCompletionPdf(module, completion);
      toast.success("PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF export failed:", err);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const canSubmit =
    userName.trim().length > 0 &&
    initials.trim().length > 0 &&
    hasSignature &&
    !completion;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const signatureData = sigPadRef.current?.getDataURL() ?? "";
    if (!signatureData) {
      toast.error("Please draw your signature before submitting.");
      return;
    }

    setIsSubmitting(true);
    // Small delay for UX feel
    await new Promise((r) => setTimeout(r, 600));

    onComplete({
      userName: userName.trim(),
      initials: initials.trim().toUpperCase(),
      signatureData,
    });

    toast.success("Training module marked as complete!");
    setIsSubmitting(false);
  };

  const formattedDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  // Convert regular Google Docs URL to embedded URL
  const embedUrl = module.googleDocUrl
    .replace("/edit", "/preview")
    .replace(/[?&]usp=.*$/, "");

  return (
    <div className="animate-fade-in">
      {/* Back navigation */}
      <div className="mb-6">
        <button
          type="button"
          onClick={onBack}
          data-ocid="module.back_button"
          className="inline-flex items-center gap-2 text-sm font-body font-medium transition-colors hover:opacity-80"
          style={{ color: "oklch(var(--primary))" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Training Modules
        </button>
      </div>

      {/* Module header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 p-2.5 rounded-lg"
            style={{ background: "oklch(0.93 0.015 240)" }}
          >
            <FileText
              className="w-5 h-5"
              style={{ color: "oklch(var(--primary))" }}
            />
          </div>
          <div>
            <h1
              className="text-2xl font-display font-bold tracking-tight"
              style={{ color: "oklch(var(--foreground))" }}
            >
              {module.title}
            </h1>
            <p
              className="mt-1 text-sm font-body"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              {module.description}
            </p>
          </div>
        </div>
        <div>
          {completion ? (
            <Badge className="bg-success-bg text-success border border-success font-semibold px-3 py-1">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Completed
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-warning-bg text-warning-foreground border-warning font-semibold px-3 py-1"
            >
              Pending Sign-Off
            </Badge>
          )}
        </div>
      </div>

      {/* Document Viewer */}
      <div
        className="doc-frame rounded-lg overflow-hidden mb-8"
        style={{
          border: "1px solid oklch(var(--border))",
        }}
      >
        <div
          className="flex items-center gap-2 px-4 py-2.5 border-b"
          style={{
            background: "oklch(var(--secondary))",
            borderColor: "oklch(var(--border))",
          }}
        >
          <FileText
            className="w-4 h-4 shrink-0"
            style={{ color: "oklch(var(--primary))" }}
          />
          <span
            className="text-sm font-body font-medium truncate"
            style={{ color: "oklch(var(--foreground))" }}
          >
            {module.title}
          </span>
          <span
            className="text-xs font-body hidden sm:block"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            Standard Operating Procedure
          </span>
          <a
            href={module.googleDocUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-ocid="module.open_doc_button"
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-body font-semibold px-2.5 py-1 rounded-md transition-all hover:opacity-90 shrink-0"
            style={{
              background: "oklch(var(--primary))",
              color: "oklch(var(--primary-foreground))",
            }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open in Google Docs</span>
            <span className="sm:hidden">Open</span>
          </a>
        </div>
        <iframe
          src={`${embedUrl}?embedded=true`}
          title={module.title}
          className="w-full border-0"
          style={{ height: "600px" }}
          allow="autoplay"
        />
      </div>

      {/* Sign-off section */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          border: "2px solid oklch(var(--border))",
          background: "oklch(var(--card))",
        }}
      >
        {/* Section header */}
        <div
          className="px-6 py-4 border-b"
          style={{
            background: "oklch(var(--primary))",
            borderColor: "oklch(0.32 0.04 255)",
          }}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary-foreground" />
            <h2 className="font-display font-bold text-lg text-primary-foreground tracking-tight">
              Completion Sign-Off
            </h2>
          </div>
          <p
            className="text-sm font-body mt-0.5"
            style={{ color: "oklch(0.82 0.02 240)" }}
          >
            By signing below, you confirm you have read and understood this
            document in full.
          </p>
        </div>

        {/* Content */}
        <div className="p-6" data-ocid="module.viewer">
          {completion ? (
            /* ── COMPLETED STATE ── */
            <div
              className="completion-seal rounded-lg p-6 text-center animate-fade-in"
              data-ocid="module.completed_banner"
            >
              <div className="flex justify-center mb-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: "oklch(0.72 0.14 145)" }}
                >
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3
                className="font-display font-bold text-xl mb-1"
                style={{ color: "oklch(0.3 0.1 145)" }}
              >
                Training Completed
              </h3>
              <p
                className="text-sm font-body mb-6"
                style={{ color: "oklch(0.45 0.07 145)" }}
              >
                This module has been successfully signed off.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div
                  className="bg-white rounded-md p-3 border"
                  style={{ borderColor: "oklch(0.82 0.08 145)" }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <User
                      className="w-3.5 h-3.5"
                      style={{ color: "oklch(0.5 0.1 145)" }}
                    />
                    <span
                      className="text-xs font-display font-semibold uppercase tracking-wider"
                      style={{ color: "oklch(0.5 0.1 145)" }}
                    >
                      Full Name
                    </span>
                  </div>
                  <p
                    className="font-body font-semibold text-sm"
                    style={{ color: "oklch(0.25 0.06 145)" }}
                  >
                    {completion.userName}
                  </p>
                </div>

                <div
                  className="bg-white rounded-md p-3 border"
                  style={{ borderColor: "oklch(0.82 0.08 145)" }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Pen
                      className="w-3.5 h-3.5"
                      style={{ color: "oklch(0.5 0.1 145)" }}
                    />
                    <span
                      className="text-xs font-display font-semibold uppercase tracking-wider"
                      style={{ color: "oklch(0.5 0.1 145)" }}
                    >
                      Initials
                    </span>
                  </div>
                  <p
                    className="font-body font-semibold text-sm"
                    style={{ color: "oklch(0.25 0.06 145)" }}
                  >
                    {completion.initials}
                  </p>
                </div>

                <div
                  className="bg-white rounded-md p-3 border"
                  style={{ borderColor: "oklch(0.82 0.08 145)" }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Calendar
                      className="w-3.5 h-3.5"
                      style={{ color: "oklch(0.5 0.1 145)" }}
                    />
                    <span
                      className="text-xs font-display font-semibold uppercase tracking-wider"
                      style={{ color: "oklch(0.5 0.1 145)" }}
                    >
                      Date Completed
                    </span>
                  </div>
                  <p
                    className="font-body font-semibold text-sm"
                    style={{ color: "oklch(0.25 0.06 145)" }}
                  >
                    {formattedDate(completion.completedAt)}
                  </p>
                </div>
              </div>

              {/* Signature preview */}
              <div className="flex justify-center mb-6">
                <div
                  className="bg-white rounded-md p-3 border inline-block"
                  style={{ borderColor: "oklch(0.82 0.08 145)" }}
                >
                  <p
                    className="text-xs font-display font-semibold uppercase tracking-wider mb-2"
                    style={{ color: "oklch(0.5 0.1 145)" }}
                  >
                    Signature
                  </p>
                  <img
                    src={completion.signatureData}
                    alt="Signature"
                    className="h-14 w-auto max-w-[200px] object-contain"
                  />
                </div>
              </div>

              {/* Download PDF button */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  data-ocid="module.download_pdf_button"
                  className="gap-2 font-display font-semibold px-6 py-2.5 text-sm shadow-md hover:shadow-lg transition-all"
                  style={{
                    background: "oklch(0.38 0.14 255)",
                    color: "#fff",
                  }}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating PDF…
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download PDF of Completed Form
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* ── SIGN-OFF FORM ── */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name + Initials row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label
                    htmlFor="full-name"
                    className="font-display font-semibold text-xs uppercase tracking-wider"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="full-name"
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your full name"
                    data-ocid="module.name_input"
                    className="font-body"
                    autoComplete="name"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="initials"
                    className="font-display font-semibold text-xs uppercase tracking-wider"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    Initials <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="initials"
                    type="text"
                    value={initials}
                    onChange={(e) =>
                      setInitials(e.target.value.slice(0, 4).toUpperCase())
                    }
                    placeholder="e.g. JDS"
                    data-ocid="module.initials_input"
                    className="font-body tracking-widest font-semibold"
                    maxLength={4}
                    autoComplete="off"
                    required
                  />
                </div>
              </div>

              {/* Signature pad */}
              <div className="space-y-1.5">
                <Label
                  className="font-display font-semibold text-xs uppercase tracking-wider"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  Signature <span className="text-destructive">*</span>
                </Label>
                <SignaturePad
                  ref={sigPadRef}
                  onChange={(has) => setHasSignature(has)}
                />
              </div>

              {/* Legal text */}
              <div
                className="text-xs font-body italic rounded-md px-4 py-3"
                style={{
                  background: "oklch(0.96 0.008 240)",
                  color: "oklch(0.52 0.03 245)",
                  border: "1px solid oklch(var(--border))",
                }}
              >
                By submitting this form, you confirm that you have read and
                understood the contents of this training document, and agree to
                comply with the procedures outlined therein. This signature is
                legally binding.
              </div>

              {/* Submit */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  data-ocid="module.submit_button"
                  disabled={!canSubmit || isSubmitting}
                  className="gap-2 font-display font-semibold px-6"
                  style={{
                    background: canSubmit ? "oklch(var(--primary))" : undefined,
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Mark as Complete
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
