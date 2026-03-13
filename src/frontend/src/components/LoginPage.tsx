import GoogleLoginModal from "@/components/GoogleLoginModal";
import { BookOpen, GraduationCap, Shield, Users } from "lucide-react";
import { useState } from "react";

type Props = {
  onLogin: (name: string, email: string) => void;
};

function GoogleGIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

const features = [
  {
    icon: BookOpen,
    label: "Structured Training",
    desc: "Manage SOPs and training documents in one place",
  },
  {
    icon: Users,
    label: "Team Tracking",
    desc: "Assign modules and track completions per employee",
  },
  {
    icon: Shield,
    label: "Verified Sign-offs",
    desc: "Digital signatures and initials with audit trail",
  },
];

export default function LoginPage({ onLogin }: Props) {
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  return (
    <div
      data-ocid="login_page.section"
      className="min-h-screen flex"
      style={{ background: "oklch(var(--background))" }}
    >
      {/* Left panel — branding + features */}
      <div
        className="hidden lg:flex flex-col justify-between w-[440px] shrink-0 px-12 py-14"
        style={{
          background: "oklch(var(--sidebar))",
          borderRight: "1px solid oklch(var(--sidebar-border))",
        }}
      >
        {/* Logo */}
        <div>
          <div className="flex items-center gap-3 mb-14">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "oklch(var(--sidebar-primary))" }}
            >
              <GraduationCap
                className="w-6 h-6"
                style={{ color: "oklch(var(--sidebar-primary-foreground))" }}
              />
            </div>
            <div>
              <h1
                className="font-display font-bold text-base leading-tight"
                style={{ color: "oklch(var(--sidebar-foreground))" }}
              >
                Training Manager
              </h1>
              <p
                className="text-xs font-body"
                style={{ color: "oklch(0.62 0.028 240)" }}
              >
                Compliance Platform
              </p>
            </div>
          </div>

          <h2
            className="font-display font-bold text-3xl leading-tight mb-4"
            style={{ color: "oklch(var(--sidebar-foreground))" }}
          >
            Streamline your team's training
          </h2>
          <p
            className="font-body text-sm leading-relaxed mb-10"
            style={{ color: "oklch(0.68 0.025 240)" }}
          >
            A centralized platform for SOPs, compliance training, and digital
            sign-offs — keeping your team aligned and accountable.
          </p>

          {/* Feature list */}
          <div className="space-y-5">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "oklch(var(--sidebar-accent))" }}
                >
                  <Icon
                    className="w-4 h-4"
                    style={{ color: "oklch(var(--sidebar-primary))" }}
                  />
                </div>
                <div>
                  <p
                    className="font-display font-semibold text-sm"
                    style={{ color: "oklch(var(--sidebar-foreground))" }}
                  >
                    {label}
                  </p>
                  <p
                    className="font-body text-xs mt-0.5 leading-snug"
                    style={{ color: "oklch(0.62 0.028 240)" }}
                  >
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p
          className="text-xs font-body"
          style={{ color: "oklch(0.5 0.025 240)" }}
        >
          © {new Date().getFullYear()} Training Manager. Built with{" "}
          <span style={{ color: "oklch(0.65 0.18 20)" }}>♥</span> using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:opacity-80 transition-opacity"
            style={{ color: "oklch(var(--sidebar-primary))" }}
          >
            caffeine.ai
          </a>
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-14">
        {/* Mobile logo (only shown on small screens) */}
        <div className="flex flex-col items-center mb-10 lg:hidden">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "oklch(var(--primary))" }}
          >
            <GraduationCap
              className="w-7 h-7"
              style={{ color: "oklch(var(--primary-foreground))" }}
            />
          </div>
          <h1
            className="font-display font-bold text-2xl"
            style={{ color: "oklch(var(--foreground))" }}
          >
            Training Manager
          </h1>
          <p
            className="font-body text-sm mt-1"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            Compliance &amp; Training Platform
          </p>
        </div>

        {/* Login card */}
        <div
          className="w-full max-w-sm rounded-2xl border p-8"
          style={{
            background: "oklch(var(--card))",
            borderColor: "oklch(var(--border))",
            boxShadow:
              "0 4px 32px 0 rgba(30, 45, 90, 0.10), 0 1px 4px 0 rgba(30, 45, 90, 0.06)",
          }}
        >
          {/* Heading */}
          <div className="mb-8">
            <h2
              className="font-display font-bold text-2xl leading-tight"
              style={{ color: "oklch(var(--foreground))" }}
            >
              Welcome back
            </h2>
            <p
              className="font-body text-sm mt-1.5"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              Sign in to access your training modules
            </p>
          </div>

          {/* Divider with "continue with" label */}
          <div className="relative flex items-center gap-3 mb-6">
            <div
              className="flex-1 h-px"
              style={{ background: "oklch(var(--border))" }}
            />
            <span
              className="text-xs font-body uppercase tracking-widest"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              Continue with
            </span>
            <div
              className="flex-1 h-px"
              style={{ background: "oklch(var(--border))" }}
            />
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            data-ocid="login_page.google_login_button"
            onClick={() => setLoginModalOpen(true)}
            className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border font-display font-semibold text-sm transition-all duration-150 hover:shadow-md active:scale-[0.98]"
            style={{
              background: "white",
              border: "1.5px solid oklch(var(--border))",
              color: "oklch(0.2 0.025 240)",
              boxShadow: "0 1px 4px 0 rgba(30,45,90,0.08)",
            }}
          >
            <GoogleGIcon size={20} />
            Sign in with Google
          </button>

          {/* Subtext */}
          <p
            className="mt-5 text-center text-xs font-body leading-relaxed"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            By signing in you agree to the platform's terms of use. Only
            authorized personnel should access this system.
          </p>
        </div>

        {/* Bottom note for mobile */}
        <p
          className="mt-8 text-xs font-body text-center lg:hidden"
          style={{ color: "oklch(var(--muted-foreground))" }}
        >
          © {new Date().getFullYear()}. Built with{" "}
          <span style={{ color: "oklch(0.65 0.18 20)" }}>♥</span> using{" "}
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

      {/* Google Login Modal */}
      <GoogleLoginModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
        onLogin={(name, email) => {
          onLogin(name, email);
          setLoginModalOpen(false);
        }}
      />
    </div>
  );
}
