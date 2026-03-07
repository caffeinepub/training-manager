import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  AppUser,
  CompletionRecord,
  TrainingModule,
} from "@/hooks/useTrainingData";
import { exportCompletionPdf } from "@/utils/exportPdf";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  PenLine,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import SignaturePad, { type SignaturePadHandle } from "./SignaturePad";

type Props = {
  module: TrainingModule;
  completion: CompletionRecord | undefined;
  selectedUser?: AppUser | null;
  adminMode?: boolean;
  onBack: () => void;
  onComplete: (data: {
    userName: string;
    initials: string;
    signatureData: string;
    managerName: string;
    managerSignatureData: string;
    trainingType: { policy: boolean; sop: boolean; operationalManual: boolean };
    releaseSteps: {
      readOutLoud: boolean;
      demonstration: boolean;
      rolePlaying: boolean;
      independentExecution: boolean;
    };
    acknowledgementInitials: {
      step1: string;
      step2: string;
      step3: string;
      step4: string;
    };
  }) => void;
};

function deriveInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 4)
    .toUpperCase();
}

type CheckboxFieldProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
};

function CheckboxField({
  id,
  label,
  checked,
  onChange,
  disabled,
}: CheckboxFieldProps) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2.5 cursor-pointer select-none"
    >
      <span
        className="relative w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
        style={{
          borderColor: checked
            ? "oklch(var(--primary))"
            : "oklch(0.7 0.02 240)",
          background: checked ? "oklch(var(--primary))" : "white",
        }}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        />
        {checked && (
          <svg
            viewBox="0 0 12 9"
            width="11"
            height="9"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1 4.5L4.5 8L11 1"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span
        className="text-sm font-body"
        style={{ color: "oklch(var(--foreground))" }}
      >
        {label}
      </span>
    </label>
  );
}

type InitialFieldProps = {
  id: string;
  statement: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  "data-ocid"?: string;
  onAutoFill?: () => void;
  "data-ocid-autofill"?: string;
};

function InitialField({
  id,
  statement,
  value,
  onChange,
  disabled,
  "data-ocid": dataOcid,
  onAutoFill,
  "data-ocid-autofill": dataOcidAutofill,
}: InitialFieldProps) {
  return (
    <div
      className="flex items-start gap-3 py-3 border-b last:border-b-0"
      style={{ borderColor: "oklch(var(--border))" }}
    >
      <span
        className="text-sm font-body shrink-0 mt-0.5"
        style={{ color: "oklch(0.45 0.02 240)" }}
      >
        •
      </span>
      <span
        className="text-sm font-body flex-1"
        style={{ color: "oklch(var(--foreground))" }}
      >
        {statement}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1">
          {disabled ? (
            <span
              className="font-body font-bold text-sm tracking-widest min-w-[3.5rem] text-center"
              style={{ color: "oklch(var(--foreground))" }}
            >
              {value || "_______"}
            </span>
          ) : (
            <>
              <Input
                id={id}
                type="text"
                value={value}
                onChange={(e) =>
                  onChange(e.target.value.slice(0, 5).toUpperCase())
                }
                placeholder="_____"
                data-ocid={dataOcid}
                className="w-20 text-center font-body font-bold tracking-widest text-sm h-8"
                maxLength={5}
                autoComplete="off"
                style={{ textTransform: "uppercase" }}
              />
              {onAutoFill && (
                <button
                  type="button"
                  onClick={onAutoFill}
                  data-ocid={dataOcidAutofill}
                  title="Auto-fill initials"
                  className="inline-flex items-center gap-1 text-xs font-body font-medium px-2 py-1 rounded border transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-1"
                  style={{
                    borderColor: "oklch(0.75 0.04 255)",
                    color: "oklch(var(--primary))",
                  }}
                >
                  <PenLine className="w-3 h-3" />
                  Auto-fill
                </button>
              )}
            </>
          )}
        </div>
        <span
          className="text-xs font-body whitespace-nowrap"
          style={{ color: "oklch(0.55 0.03 245)" }}
        >
          (initial)
        </span>
      </div>
    </div>
  );
}

export default function ModuleViewer({
  module,
  completion,
  selectedUser,
  adminMode = false,
  onBack,
  onComplete,
}: Props) {
  const [userName, setUserName] = useState(selectedUser?.name ?? "");
  const [managerName, setManagerName] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Training type checkboxes
  const [trainingType, setTrainingType] = useState({
    policy: false,
    sop: false,
    operationalManual: false,
  });

  // Steps of release process
  const [releaseSteps, setReleaseSteps] = useState({
    readOutLoud: false,
    demonstration: false,
    rolePlaying: false,
    independentExecution: false,
  });

  // Four initials — start empty, user must click Auto-fill or type manually
  const [ackInitials, setAckInitials] = useState({
    step1: "",
    step2: "",
    step3: "",
    step4: "",
  });

  const teamSigRef = useRef<SignaturePadHandle>(null);
  const managerSigRef = useRef<SignaturePadHandle>(null);

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

  const canSubmit = userName.trim().length > 0 && !completion;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const teamSigData = teamSigRef.current?.getDataURL() ?? "";
    const managerSigData = managerSigRef.current?.getDataURL() ?? "";

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));

    onComplete({
      userName: userName.trim(),
      initials: ackInitials.step1.trim().toUpperCase(),
      signatureData: teamSigData,
      managerName: managerName.trim(),
      managerSignatureData: managerSigData,
      trainingType,
      releaseSteps,
      acknowledgementInitials: {
        step1: ackInitials.step1.trim().toUpperCase(),
        step2: ackInitials.step2.trim().toUpperCase(),
        step3: ackInitials.step3.trim().toUpperCase(),
        step4: ackInitials.step4.trim().toUpperCase(),
      },
    });

    toast.success("Training module marked as complete!");
    setIsSubmitting(false);
  };

  const formattedDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

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
          {adminMode ? "Back to Modules" : "Back to Training Modules"}
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
        style={{ border: "1px solid oklch(var(--border))" }}
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

      {/* Sign-off section — hidden in admin view mode */}
      {!adminMode && (
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
                Training Sign-Off Form
              </h2>
            </div>
            <p
              className="text-sm font-body mt-0.5"
              style={{ color: "oklch(0.82 0.02 240)" }}
            >
              Complete all sections below before submitting.
            </p>
          </div>

          {/* Content */}
          <div className="p-6" data-ocid="module.viewer">
            {completion ? (
              /* ── COMPLETED STATE ── */
              <div
                className="rounded-lg p-6 animate-fade-in"
                style={{
                  background: "oklch(0.96 0.01 145)",
                  border: "1px solid oklch(0.82 0.08 145)",
                }}
                data-ocid="module.completed_banner"
              >
                {/* Completed stamp */}
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "oklch(0.72 0.14 145)" }}
                  >
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3
                      className="font-display font-bold text-lg"
                      style={{ color: "oklch(0.28 0.1 145)" }}
                    >
                      Training Completed
                    </h3>
                    <p
                      className="text-sm font-body"
                      style={{ color: "oklch(0.45 0.07 145)" }}
                    >
                      Signed off on {formattedDate(completion.completedAt)}
                    </p>
                  </div>
                </div>

                {/* Training Type */}
                {completion.trainingType && (
                  <div className="mb-5">
                    <p
                      className="text-xs font-display font-bold uppercase tracking-wider mb-2"
                      style={{ color: "oklch(0.45 0.07 145)" }}
                    >
                      Type of Training
                    </p>
                    <div className="flex flex-wrap gap-4">
                      {[
                        { key: "policy", label: "Policy" },
                        { key: "sop", label: "SOP" },
                        {
                          key: "operationalManual",
                          label: "Operational Manual",
                        },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded border-2 flex items-center justify-center"
                            style={{
                              borderColor: (
                                completion.trainingType as Record<
                                  string,
                                  boolean
                                >
                              )[key]
                                ? "oklch(0.5 0.1 145)"
                                : "oklch(0.7 0.02 240)",
                              background: (
                                completion.trainingType as Record<
                                  string,
                                  boolean
                                >
                              )[key]
                                ? "oklch(0.5 0.1 145)"
                                : "white",
                            }}
                          >
                            {(
                              completion.trainingType as Record<string, boolean>
                            )[key] && (
                              <svg
                                viewBox="0 0 12 9"
                                width="10"
                                height="8"
                                fill="none"
                                aria-hidden="true"
                              >
                                <path
                                  d="M1 4.5L4.5 8L11 1"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </div>
                          <span
                            className="text-sm font-body"
                            style={{ color: "oklch(0.35 0.06 145)" }}
                          >
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Release Steps */}
                {completion.releaseSteps && (
                  <div className="mb-5">
                    <p
                      className="text-xs font-display font-bold uppercase tracking-wider mb-2"
                      style={{ color: "oklch(0.45 0.07 145)" }}
                    >
                      Steps of Release Process
                    </p>
                    <div className="flex flex-wrap gap-4">
                      {[
                        { key: "readOutLoud", label: "Read Out Loud" },
                        { key: "demonstration", label: "Demonstration" },
                        { key: "rolePlaying", label: "Role Playing" },
                        {
                          key: "independentExecution",
                          label: "Independent Execution",
                        },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded border-2 flex items-center justify-center"
                            style={{
                              borderColor: (
                                completion.releaseSteps as Record<
                                  string,
                                  boolean
                                >
                              )[key]
                                ? "oklch(0.5 0.1 145)"
                                : "oklch(0.7 0.02 240)",
                              background: (
                                completion.releaseSteps as Record<
                                  string,
                                  boolean
                                >
                              )[key]
                                ? "oklch(0.5 0.1 145)"
                                : "white",
                            }}
                          >
                            {(
                              completion.releaseSteps as Record<string, boolean>
                            )[key] && (
                              <svg
                                viewBox="0 0 12 9"
                                width="10"
                                height="8"
                                fill="none"
                                aria-hidden="true"
                              >
                                <path
                                  d="M1 4.5L4.5 8L11 1"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </div>
                          <span
                            className="text-sm font-body"
                            style={{ color: "oklch(0.35 0.06 145)" }}
                          >
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Acknowledgement Initials */}
                {completion.acknowledgementInitials && (
                  <div className="mb-5">
                    <p
                      className="text-xs font-display font-bold uppercase tracking-wider mb-1"
                      style={{ color: "oklch(0.45 0.07 145)" }}
                    >
                      Team Member Training Acknowledgement
                    </p>
                    <p
                      className="text-xs font-body mb-3"
                      style={{ color: "oklch(0.5 0.05 145)" }}
                    >
                      Please read each statement below and initial each one. By
                      doing so, you acknowledge that these steps have been
                      completed and confirm your ability to perform the tasks as
                      outlined in the training document specified above in the
                      Information Section.
                    </p>
                    <div
                      className="space-y-0 rounded-md overflow-hidden border"
                      style={{ borderColor: "oklch(0.82 0.08 145)" }}
                    >
                      {[
                        {
                          key: "step1",
                          statement:
                            "My manager and I read the document out loud together.",
                        },
                        {
                          key: "step2",
                          statement:
                            "I have been shown how to properly complete the tasks in this document.",
                        },
                        {
                          key: "step3",
                          statement:
                            "I have demonstrated that I can properly complete the tasks in this document.",
                        },
                        {
                          key: "step4",
                          statement:
                            "I completed the tasks in this document independently without any assistance.",
                        },
                      ].map(({ key, statement }, idx) => (
                        <div
                          key={key}
                          className="flex items-center justify-between gap-3 px-4 py-3 border-b last:border-b-0 bg-white"
                          style={{ borderColor: "oklch(0.88 0.06 145)" }}
                        >
                          <span
                            className="text-sm font-body flex-1"
                            style={{ color: "oklch(0.3 0.06 145)" }}
                          >
                            {idx + 1}. {statement}
                          </span>
                          <span
                            className="font-body font-bold text-sm tracking-widest min-w-[3.5rem] text-center px-2 py-1 rounded"
                            style={{
                              background: "oklch(0.93 0.04 145)",
                              color: "oklch(0.28 0.1 145)",
                            }}
                          >
                            {(
                              completion.acknowledgementInitials as Record<
                                string,
                                string
                              >
                            )[key] || "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Acknowledgment of Receipt */}
                <div
                  className="mb-5 p-4 rounded-md"
                  style={{
                    background: "oklch(0.93 0.04 145)",
                    border: "1px solid oklch(0.82 0.08 145)",
                  }}
                >
                  <p
                    className="text-xs font-display font-bold uppercase tracking-wider mb-1"
                    style={{ color: "oklch(0.38 0.08 145)" }}
                  >
                    Acknowledgment of Receipt of Training
                  </p>
                  <p
                    className="text-xs font-body"
                    style={{ color: "oklch(0.45 0.06 145)" }}
                  >
                    By signing this form, the team member acknowledges that they
                    have received this training and are now fully capable of
                    adhering to the guidelines outlined in this document. The
                    manager confirms that the training has been completed,
                    understanding has been ensured, and the employee is fully
                    prepared to follow the procedures specified in this
                    document.
                  </p>
                </div>

                {/* Signature rows */}
                <div className="space-y-4">
                  {/* Team Member signature */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p
                        className="text-xs font-body mb-1"
                        style={{ color: "oklch(0.45 0.07 145)" }}
                      >
                        <span className="font-semibold">
                          Team Member's Signature:
                        </span>
                      </p>
                      <div
                        className="h-16 rounded border flex items-center justify-center bg-white"
                        style={{ borderColor: "oklch(0.75 0.08 145)" }}
                      >
                        {completion.signatureData ? (
                          <img
                            src={completion.signatureData}
                            alt="Team Member Signature"
                            className="h-full w-auto max-w-full object-contain p-1"
                          />
                        ) : (
                          <span
                            className="text-xs"
                            style={{ color: "oklch(0.65 0.04 240)" }}
                          >
                            No signature
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span
                          className="text-xs font-body font-semibold"
                          style={{ color: "oklch(0.35 0.06 145)" }}
                        >
                          {completion.userName}
                        </span>
                        <span
                          className="text-xs font-body"
                          style={{ color: "oklch(0.5 0.05 145)" }}
                        >
                          Date: {formattedDate(completion.completedAt)}
                        </span>
                      </div>
                    </div>
                    {/* Manager signature */}
                    <div>
                      <p
                        className="text-xs font-body mb-1"
                        style={{ color: "oklch(0.45 0.07 145)" }}
                      >
                        <span className="font-semibold">
                          Manager's Signature:
                        </span>
                      </p>
                      <div
                        className="h-16 rounded border flex items-center justify-center bg-white"
                        style={{ borderColor: "oklch(0.75 0.08 145)" }}
                      >
                        {completion.managerSignatureData ? (
                          <img
                            src={completion.managerSignatureData}
                            alt="Manager Signature"
                            className="h-full w-auto max-w-full object-contain p-1"
                          />
                        ) : (
                          <span
                            className="text-xs"
                            style={{ color: "oklch(0.65 0.04 240)" }}
                          >
                            No signature
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span
                          className="text-xs font-body font-semibold"
                          style={{ color: "oklch(0.35 0.06 145)" }}
                        >
                          {completion.managerName || "Manager"}
                        </span>
                        <span
                          className="text-xs font-body"
                          style={{ color: "oklch(0.5 0.05 145)" }}
                        >
                          Date: {formattedDate(completion.completedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Download PDF */}
                <div className="flex justify-center mt-6">
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
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Signing-as banner */}
                {selectedUser && (
                  <div
                    data-ocid="module.signing_as_banner"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg border"
                    style={{
                      background: "oklch(0.94 0.04 255)",
                      borderColor: "oklch(0.75 0.1 255 / 50%)",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-display font-bold text-sm"
                      style={{
                        background: "oklch(0.55 0.15 255)",
                        color: "oklch(0.98 0.01 255)",
                      }}
                    >
                      {deriveInitials(selectedUser.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <UserCheck
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: "oklch(0.42 0.14 255)" }}
                        />
                        <span
                          className="text-xs font-display font-semibold uppercase tracking-wide"
                          style={{ color: "oklch(0.42 0.14 255)" }}
                        >
                          Signing as
                        </span>
                      </div>
                      <p
                        className="font-body font-semibold text-sm truncate"
                        style={{ color: "oklch(0.25 0.1 255)" }}
                      >
                        {selectedUser.name}
                        {selectedUser.role && (
                          <span
                            className="font-normal ml-1.5"
                            style={{ color: "oklch(0.42 0.08 255)" }}
                          >
                            · {selectedUser.role}
                          </span>
                        )}
                      </p>
                    </div>
                    <Badge
                      className="shrink-0 font-body font-medium text-xs"
                      style={{
                        background: "oklch(0.55 0.15 255)",
                        color: "oklch(0.98 0.01 255)",
                        border: "none",
                      }}
                    >
                      {selectedUser.department}
                    </Badge>
                  </div>
                )}

                {/* ── Section 1: Type of Training ── */}
                <div
                  className="rounded-lg p-5"
                  style={{
                    border: "1px solid oklch(var(--border))",
                    background: "oklch(0.985 0.005 240)",
                  }}
                >
                  <h3
                    className="font-display font-bold text-base mb-4"
                    style={{ color: "oklch(var(--foreground))" }}
                  >
                    Type of Training
                  </h3>
                  <div className="flex flex-wrap gap-6">
                    <CheckboxField
                      id="type-policy"
                      label="Policy"
                      checked={trainingType.policy}
                      onChange={(v) =>
                        setTrainingType((p) => ({ ...p, policy: v }))
                      }
                    />
                    <CheckboxField
                      id="type-sop"
                      label="SOP"
                      checked={trainingType.sop}
                      onChange={(v) =>
                        setTrainingType((p) => ({ ...p, sop: v }))
                      }
                    />
                    <CheckboxField
                      id="type-operational-manual"
                      label="Operational Manual"
                      checked={trainingType.operationalManual}
                      onChange={(v) =>
                        setTrainingType((p) => ({ ...p, operationalManual: v }))
                      }
                    />
                  </div>
                </div>

                {/* ── Section 2: Steps of Release Process ── */}
                <div
                  className="rounded-lg p-5"
                  style={{
                    border: "1px solid oklch(var(--border))",
                    background: "oklch(0.985 0.005 240)",
                  }}
                >
                  <h3
                    className="font-display font-bold text-base mb-4"
                    style={{ color: "oklch(var(--foreground))" }}
                  >
                    Steps of Release Process
                  </h3>
                  <div className="flex flex-wrap gap-6">
                    <CheckboxField
                      id="step-read-out-loud"
                      label="Read Out Loud"
                      checked={releaseSteps.readOutLoud}
                      onChange={(v) =>
                        setReleaseSteps((p) => ({ ...p, readOutLoud: v }))
                      }
                    />
                    <CheckboxField
                      id="step-demonstration"
                      label="Demonstration"
                      checked={releaseSteps.demonstration}
                      onChange={(v) =>
                        setReleaseSteps((p) => ({ ...p, demonstration: v }))
                      }
                    />
                    <CheckboxField
                      id="step-role-playing"
                      label="Role Playing"
                      checked={releaseSteps.rolePlaying}
                      onChange={(v) =>
                        setReleaseSteps((p) => ({ ...p, rolePlaying: v }))
                      }
                    />
                    <CheckboxField
                      id="step-independent-execution"
                      label="Independent Execution"
                      checked={releaseSteps.independentExecution}
                      onChange={(v) =>
                        setReleaseSteps((p) => ({
                          ...p,
                          independentExecution: v,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* ── Section 3: Team Member Training Acknowledgement ── */}
                <div
                  className="rounded-lg overflow-hidden"
                  style={{ border: "1px solid oklch(var(--border))" }}
                >
                  <div
                    className="px-5 py-4 border-b"
                    style={{
                      background: "oklch(0.985 0.005 240)",
                      borderColor: "oklch(var(--border))",
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-display font-bold text-base"
                          style={{ color: "oklch(var(--foreground))" }}
                        >
                          Team Member Training Acknowledgement
                        </h3>
                        <p
                          className="text-xs font-body mt-1"
                          style={{ color: "oklch(var(--muted-foreground))" }}
                        >
                          Please read each statement below and initial each one.
                          By doing so, you acknowledge that these steps have
                          been completed and confirm your ability to perform the
                          tasks as outlined in the training document specified
                          above in the Information Section.
                        </p>
                      </div>
                      <button
                        type="button"
                        data-ocid="module.autofill_initials_button"
                        onClick={() => {
                          if (!userName.trim()) {
                            toast.warning("Enter team member's name first.");
                            return;
                          }
                          const initials = deriveInitials(userName);
                          setAckInitials({
                            step1: initials,
                            step2: initials,
                            step3: initials,
                            step4: initials,
                          });
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-body font-semibold px-3 py-1.5 rounded-md border transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-1 shrink-0 self-start"
                        style={{
                          borderColor: "oklch(0.7 0.06 255)",
                          color: "oklch(var(--primary))",
                          background: "oklch(0.96 0.01 240)",
                        }}
                      >
                        <PenLine className="w-3.5 h-3.5" />
                        Auto-fill all
                      </button>
                    </div>
                  </div>
                  <div className="px-5 bg-white">
                    <InitialField
                      id="ack-step1"
                      statement="My manager and I read the document out loud together."
                      value={ackInitials.step1}
                      onChange={(v) =>
                        setAckInitials((p) => ({ ...p, step1: v }))
                      }
                      data-ocid="module.ack_step1_input"
                      onAutoFill={() => {
                        if (!userName.trim()) {
                          toast.warning("Enter team member's name first.");
                          return;
                        }
                        setAckInitials((p) => ({
                          ...p,
                          step1: deriveInitials(userName),
                        }));
                      }}
                      data-ocid-autofill="module.autofill_initial_button.1"
                    />
                    <InitialField
                      id="ack-step2"
                      statement="I have been shown how to properly complete the tasks in this document."
                      value={ackInitials.step2}
                      onChange={(v) =>
                        setAckInitials((p) => ({ ...p, step2: v }))
                      }
                      data-ocid="module.ack_step2_input"
                      onAutoFill={() => {
                        if (!userName.trim()) {
                          toast.warning("Enter team member's name first.");
                          return;
                        }
                        setAckInitials((p) => ({
                          ...p,
                          step2: deriveInitials(userName),
                        }));
                      }}
                      data-ocid-autofill="module.autofill_initial_button.2"
                    />
                    <InitialField
                      id="ack-step3"
                      statement="I have demonstrated that I can properly complete the tasks in this document."
                      value={ackInitials.step3}
                      onChange={(v) =>
                        setAckInitials((p) => ({ ...p, step3: v }))
                      }
                      data-ocid="module.ack_step3_input"
                      onAutoFill={() => {
                        if (!userName.trim()) {
                          toast.warning("Enter team member's name first.");
                          return;
                        }
                        setAckInitials((p) => ({
                          ...p,
                          step3: deriveInitials(userName),
                        }));
                      }}
                      data-ocid-autofill="module.autofill_initial_button.3"
                    />
                    <InitialField
                      id="ack-step4"
                      statement="I completed the tasks in this document independently without any assistance."
                      value={ackInitials.step4}
                      onChange={(v) =>
                        setAckInitials((p) => ({ ...p, step4: v }))
                      }
                      data-ocid="module.ack_step4_input"
                      onAutoFill={() => {
                        if (!userName.trim()) {
                          toast.warning("Enter team member's name first.");
                          return;
                        }
                        setAckInitials((p) => ({
                          ...p,
                          step4: deriveInitials(userName),
                        }));
                      }}
                      data-ocid-autofill="module.autofill_initial_button.4"
                    />
                  </div>
                </div>

                {/* ── Section 4: Acknowledgment of Receipt ── */}
                <div
                  className="rounded-lg p-5"
                  style={{
                    border: "1px solid oklch(var(--border))",
                    background: "oklch(0.985 0.005 240)",
                  }}
                >
                  <h3
                    className="font-display font-bold text-base mb-2"
                    style={{ color: "oklch(var(--foreground))" }}
                  >
                    Acknowledgment of Receipt of Training
                  </h3>
                  <p
                    className="text-sm font-body mb-5"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    By signing this form, the team member acknowledges that they
                    have received this training and are now fully capable of
                    adhering to the guidelines outlined in this document. The
                    manager confirms that the training has been completed,
                    understanding has been ensured, and the employee is fully
                    prepared to follow the procedures specified in this
                    document.
                  </p>

                  {/* Names row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="team-member-name"
                        className="font-body text-sm font-semibold"
                        style={{ color: "oklch(var(--foreground))" }}
                      >
                        Team Member's Name{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="team-member-name"
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Full name"
                        data-ocid="module.name_input"
                        className="font-body"
                        autoComplete="name"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="manager-name"
                        className="font-body text-sm font-semibold"
                        style={{ color: "oklch(var(--foreground))" }}
                      >
                        Manager's Name{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="manager-name"
                        type="text"
                        value={managerName}
                        onChange={(e) => setManagerName(e.target.value)}
                        placeholder="Manager full name"
                        data-ocid="module.manager_name_input"
                        className="font-body"
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  {/* Signature rows */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Team member signature */}
                    <div className="space-y-1.5">
                      <Label
                        className="font-body text-sm font-semibold"
                        style={{ color: "oklch(var(--foreground))" }}
                      >
                        Team Member's Signature{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <SignaturePad
                        ref={teamSigRef}
                        onChange={() => {}}
                        name={userName}
                      />
                    </div>

                    {/* Manager signature */}
                    <div className="space-y-1.5">
                      <Label
                        className="font-body text-sm font-semibold"
                        style={{ color: "oklch(var(--foreground))" }}
                      >
                        Manager's Signature{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <SignaturePad
                        ref={managerSigRef}
                        onChange={() => {}}
                        name={managerName}
                      />
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3">
                  {!canSubmit && (
                    <p
                      className="text-xs font-body self-center"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    >
                      Enter team member's name to submit.
                    </p>
                  )}
                  <Button
                    type="submit"
                    data-ocid="module.submit_button"
                    disabled={!canSubmit || isSubmitting}
                    className="gap-2 font-display font-semibold px-6"
                    style={{
                      background: canSubmit
                        ? "oklch(var(--primary))"
                        : undefined,
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
      )}
    </div>
  );
}
