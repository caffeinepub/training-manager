import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActor } from "@/hooks/useActor";
import { textToSignatureImage } from "@/utils/signatureUtils";
import { CheckCircle2, GraduationCap, Loader2, PenLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type BackendModule = {
  id: bigint;
  title: string;
  description: string;
  googleDocUrl: string;
  createdAt: bigint;
};

type Props = {
  moduleId: string;
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

export default function PublicModuleView({ moduleId }: Props) {
  const { actor, isFetching } = useActor();
  const [module, setModule] = useState<BackendModule | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [isLoadingModule, setIsLoadingModule] = useState(true);

  // Form state
  const [userName, setUserName] = useState("");
  const [date, setDate] = useState(
    new Date().toLocaleDateString("en-CA"), // YYYY-MM-DD
  );
  const [initials, setInitials] = useState("");
  const [ackInitials, setAckInitials] = useState({
    step1: "",
    step2: "",
    step3: "",
    step4: "",
  });
  const [signature, setSignature] = useState("");
  const [checkPolicy, setCheckPolicy] = useState(false);
  const [checkSop, setCheckSop] = useState(false);
  const [checkOps, setCheckOps] = useState(false);
  const [releaseSteps, setReleaseSteps] = useState({
    readOutLoud: false,
    demonstration: false,
    rolePlaying: false,
    independentExecution: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current || !actor || isFetching) return;
    fetchedRef.current = true;
    (async () => {
      try {
        const modules = await actor.getModules();
        const found = modules.find(
          (m) =>
            String(m.id) === moduleId || Number(m.id).toString() === moduleId,
        );
        if (found) {
          setModule(found as BackendModule);
        } else {
          setLoadError(true);
        }
      } catch {
        setLoadError(true);
      } finally {
        setIsLoadingModule(false);
      }
    })();
  }, [actor, isFetching, moduleId]);

  const handleAutoFill = () => {
    if (!userName.trim()) return;
    const derived = deriveInitials(userName);
    setInitials(derived);
    setAckInitials({
      step1: derived,
      step2: derived,
      step3: derived,
      step4: derived,
    });
    setSignature(userName);
  };

  const assignedUserId = new URLSearchParams(window.location.search).get(
    "assignedUserId",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    if (!module) {
      toast.error("Module not found. Please refresh and try again.");
      return;
    }
    if (!actor) {
      toast.error("Connection not ready. Please wait a moment and try again.");
      return;
    }
    setIsSubmitting(true);
    try {
      const sigImage = textToSignatureImage(
        signature.trim() || userName.trim(),
      );
      if (assignedUserId?.trim()) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await actor.submitPublicCompletionForUser(
          module.id,
          assignedUserId.trim(),
          userName.trim(),
          initials,
          sigImage,
        );
      } else {
        await actor.submitCompletion(
          module.id,
          userName.trim(),
          initials,
          sigImage,
        );
      }
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEmbeddable =
    module?.googleDocUrl &&
    (module.googleDocUrl.includes("docs.google.com") ||
      module.googleDocUrl.includes("drive.google.com"));

  const embedUrl = isEmbeddable
    ? module!.googleDocUrl
        .replace("/edit", "/preview")
        .replace("/view", "/preview")
    : null;

  // ── Loading ──
  if (isFetching || isLoadingModule) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "oklch(var(--background))" }}
        data-ocid="public_module.loading_state"
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "oklch(var(--primary) / 0.1)" }}
          >
            <Loader2
              className="w-7 h-7 animate-spin"
              style={{ color: "oklch(var(--primary))" }}
            />
          </div>
          <p
            className="font-display font-semibold text-base"
            style={{ color: "oklch(var(--foreground))" }}
          >
            Loading training module…
          </p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (loadError || !module) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "oklch(var(--background))" }}
        data-ocid="public_module.error_state"
      >
        <div
          className="max-w-md w-full rounded-2xl border p-10 text-center"
          style={{
            background: "oklch(var(--card))",
            borderColor: "oklch(var(--border))",
            boxShadow: "0 4px 32px 0 rgba(30,45,90,0.10)",
          }}
        >
          <div
            className="w-14 h-14 rounded-xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: "oklch(0.96 0.02 20)" }}
          >
            <GraduationCap
              className="w-7 h-7"
              style={{ color: "oklch(0.55 0.12 20)" }}
            />
          </div>
          <h2
            className="text-xl font-display font-bold mb-2"
            style={{ color: "oklch(var(--foreground))" }}
          >
            Module Not Found
          </h2>
          <p
            className="text-sm font-body"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            This training link is invalid or the module has been removed. Please
            contact your manager for a new link.
          </p>
        </div>
      </div>
    );
  }

  // ── Success ──
  if (isSuccess) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "oklch(var(--background))" }}
        data-ocid="public_module.success_state"
      >
        <div
          className="max-w-md w-full rounded-2xl border p-10 text-center"
          style={{
            background: "oklch(var(--card))",
            borderColor: "oklch(0.72 0.14 145 / 40%)",
            boxShadow: "0 4px 32px 0 rgba(30,45,90,0.10)",
          }}
        >
          <div
            className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{ background: "oklch(0.95 0.05 145)" }}
          >
            <CheckCircle2
              className="w-8 h-8"
              style={{ color: "oklch(0.55 0.14 145)" }}
            />
          </div>
          <h2
            className="text-2xl font-display font-bold mb-2"
            style={{ color: "oklch(var(--foreground))" }}
          >
            Training Complete
          </h2>
          <p
            className="text-base font-display font-semibold mb-3"
            style={{ color: "oklch(var(--primary))" }}
          >
            {module.title}
          </p>
          <p
            className="text-sm font-body"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            Your sign-off has been recorded. You can close this window.
          </p>
        </div>
      </div>
    );
  }

  // ── Main Form ──
  return (
    <div
      className="min-h-screen py-10 px-4"
      style={{ background: "oklch(var(--background))" }}
    >
      <div className="max-w-2xl mx-auto" data-ocid="public_module.section">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "oklch(var(--primary))" }}
          >
            <GraduationCap
              className="w-6 h-6"
              style={{ color: "oklch(var(--primary-foreground))" }}
            />
          </div>
          <h1
            className="text-lg font-display font-bold tracking-tight"
            style={{ color: "oklch(var(--foreground))" }}
          >
            Training Manager
          </h1>
          <p
            className="text-xs font-body mt-0.5"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            Compliance Platform
          </p>
        </div>

        {/* Module Card */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            background: "oklch(var(--card))",
            borderColor: "oklch(var(--border))",
            boxShadow: "0 4px 32px 0 rgba(30,45,90,0.08)",
          }}
        >
          {/* Module header */}
          <div
            className="px-8 pt-8 pb-6 border-b"
            style={{ borderColor: "oklch(var(--border))" }}
          >
            <h2
              className="text-2xl font-display font-bold mb-1"
              style={{ color: "oklch(var(--foreground))" }}
            >
              {module.title}
            </h2>
            <p
              className="text-sm font-body"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              {module.description}
            </p>
          </div>

          {/* Google Doc embed */}
          {embedUrl && (
            <div
              className="border-b"
              style={{ borderColor: "oklch(var(--border))" }}
            >
              <iframe
                src={embedUrl}
                title="Training Document Preview"
                className="w-full"
                style={{ height: "800px", border: 0 }}
                allowFullScreen
              />
            </div>
          )}

          {/* Sign-off Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
            <div>
              <h3
                className="text-base font-display font-bold mb-4"
                style={{ color: "oklch(var(--foreground))" }}
              >
                Sign-Off Form
              </h3>

              {/* Name + Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="pub-name"
                    className="font-display font-semibold text-sm"
                  >
                    Full Name{" "}
                    <span style={{ color: "oklch(0.55 0.16 20)" }}>*</span>
                  </Label>
                  <Input
                    id="pub-name"
                    data-ocid="public_module.input"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className="font-body text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="pub-date"
                    className="font-display font-semibold text-sm"
                  >
                    Date
                  </Label>
                  <Input
                    id="pub-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="font-body text-sm"
                  />
                </div>
              </div>

              {/* Auto-fill hint */}
              {userName.trim() && (
                <button
                  type="button"
                  onClick={handleAutoFill}
                  className="inline-flex items-center gap-1.5 text-xs font-body px-3 py-1.5 rounded-lg mb-4 transition-opacity hover:opacity-80"
                  style={{
                    background: "oklch(var(--primary) / 0.08)",
                    color: "oklch(var(--primary))",
                    border: "1px solid oklch(var(--primary) / 0.2)",
                  }}
                >
                  <PenLine className="w-3.5 h-3.5" />
                  Auto-fill initials &amp; signature from name
                </button>
              )}

              {/* Training type */}
              <div
                className="rounded-lg p-4 mb-4"
                style={{
                  background: "oklch(var(--muted) / 0.5)",
                  border: "1px solid oklch(var(--border))",
                }}
              >
                <p
                  className="text-xs font-display font-semibold uppercase tracking-wide mb-3"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  Training Type
                </p>
                <div className="flex flex-wrap gap-4">
                  {[
                    {
                      key: "checkPolicy",
                      label: "Policy",
                      val: checkPolicy,
                      set: setCheckPolicy,
                    },
                    {
                      key: "checkSop",
                      label: "SOP",
                      val: checkSop,
                      set: setCheckSop,
                    },
                    {
                      key: "checkOps",
                      label: "Operational Manual",
                      val: checkOps,
                      set: setCheckOps,
                    },
                  ].map(({ key, label, val, set }) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 cursor-pointer select-none"
                    >
                      <span
                        className="relative w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
                        style={{
                          borderColor: val
                            ? "oklch(var(--primary))"
                            : "oklch(0.7 0.02 240)",
                          background: val ? "oklch(var(--primary))" : "white",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={val}
                          onChange={(e) => set(e.target.checked)}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                        {val && (
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
                  ))}
                </div>
              </div>

              {/* Release Steps */}
              <div
                className="rounded-lg p-4 mb-4"
                style={{
                  background: "oklch(var(--muted) / 0.5)",
                  border: "1px solid oklch(var(--border))",
                }}
              >
                <p
                  className="text-xs font-display font-semibold uppercase tracking-wide mb-3"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  Training Release Steps Completed
                </p>
                <div className="space-y-2">
                  {[
                    { key: "readOutLoud" as const, label: "Read out loud" },
                    { key: "demonstration" as const, label: "Demonstration" },
                    { key: "rolePlaying" as const, label: "Role playing" },
                    {
                      key: "independentExecution" as const,
                      label: "Independent execution",
                    },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 cursor-pointer select-none"
                    >
                      <span
                        className="relative w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
                        style={{
                          borderColor: releaseSteps[key]
                            ? "oklch(var(--primary))"
                            : "oklch(0.7 0.02 240)",
                          background: releaseSteps[key]
                            ? "oklch(var(--primary))"
                            : "white",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={releaseSteps[key]}
                          onChange={(e) =>
                            setReleaseSteps((prev) => ({
                              ...prev,
                              [key]: e.target.checked,
                            }))
                          }
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                        {releaseSteps[key] && (
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
                  ))}
                </div>
              </div>

              {/* Acknowledgement Initials */}
              <div
                className="rounded-lg p-4 mb-4"
                style={{
                  background: "oklch(var(--muted) / 0.5)",
                  border: "1px solid oklch(var(--border))",
                }}
              >
                <p
                  className="text-xs font-display font-semibold uppercase tracking-wide mb-3"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  Acknowledgements (Initials)
                </p>
                <div className="space-y-3">
                  {[
                    {
                      key: "step1" as const,
                      text: "I have read and understood this training document.",
                    },
                    {
                      key: "step2" as const,
                      text: "I understand my responsibilities as outlined.",
                    },
                    {
                      key: "step3" as const,
                      text: "I agree to follow the procedures described.",
                    },
                    {
                      key: "step4" as const,
                      text: "I acknowledge receipt of this training.",
                    },
                  ].map(({ key, text }) => (
                    <div key={key} className="flex items-center gap-3">
                      <span
                        className="flex-1 text-sm font-body"
                        style={{ color: "oklch(var(--foreground))" }}
                      >
                        {text}
                      </span>
                      <Input
                        value={ackInitials[key]}
                        onChange={(e) =>
                          setAckInitials((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        placeholder="Initials"
                        className="w-20 text-center font-display font-bold text-sm uppercase"
                        maxLength={6}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Initials + Signature */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-display font-semibold text-sm">
                    Initials
                  </Label>
                  <Input
                    value={initials}
                    onChange={(e) =>
                      setInitials(e.target.value.toUpperCase().slice(0, 6))
                    }
                    placeholder="e.g. JD"
                    className="font-display font-bold text-base uppercase tracking-widest"
                    maxLength={6}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-display font-semibold text-sm">
                    Signature
                  </Label>
                  <div className="relative">
                    <Input
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      placeholder="Type your name as signature"
                      className="font-body italic text-sm pr-10"
                    />
                    {userName.trim() && !signature && (
                      <button
                        type="button"
                        onClick={() => setSignature(userName)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-60 hover:opacity-100 transition-opacity"
                        title="Auto-fill signature"
                        style={{ color: "oklch(var(--primary))" }}
                      >
                        <PenLine className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <Button
                type="submit"
                data-ocid="public_module.submit_button"
                disabled={isSubmitting || !userName.trim()}
                className="w-full font-display font-bold text-base py-3 h-auto"
                style={{
                  background: "oklch(var(--primary))",
                  color: "oklch(var(--primary-foreground))",
                }}
              >
                {isSubmitting || isFetching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isFetching ? "Connecting…" : "Submitting…"}
                  </>
                ) : (
                  "Submit Sign-Off"
                )}
              </Button>
              <p
                className="text-center text-xs font-body mt-2"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                Only your name is required. All other fields are optional.
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p
          className="text-center text-xs font-body mt-6"
          style={{ color: "oklch(var(--muted-foreground))" }}
        >
          © {new Date().getFullYear()}. Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:opacity-80 transition-opacity"
            style={{ color: "oklch(var(--primary))" }}
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
