import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useState } from "react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: (name: string, email: string) => void;
};

// Google "G" logo SVG
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

export default function GoogleLoginModal({
  open,
  onOpenChange,
  onLogin,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const validate = () => {
    const newErrors: { name?: string; email?: string } = {};
    if (!name.trim()) newErrors.name = "Full name is required.";
    if (!email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    // Brief simulated delay for UX authenticity
    await new Promise((r) => setTimeout(r, 500));
    onLogin(name.trim(), email.trim().toLowerCase());
    setIsLoading(false);
    setName("");
    setEmail("");
    setErrors({});
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName("");
      setEmail("");
      setErrors({});
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-sm p-0 overflow-hidden"
        data-ocid="google_login.dialog"
      >
        {/* Google-branded header */}
        <div
          className="px-8 pt-8 pb-6 text-center"
          style={{ background: "oklch(var(--card))" }}
        >
          <div className="flex justify-center mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "oklch(0.97 0.005 240)" }}
            >
              <GoogleGIcon size={28} />
            </div>
          </div>
          <DialogHeader className="space-y-1">
            <DialogTitle
              className="font-display font-bold text-xl text-center"
              style={{ color: "oklch(var(--foreground))" }}
            >
              Sign in
            </DialogTitle>
            <DialogDescription
              className="text-center font-body text-sm"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              Use your Google account to access the training system
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Divider */}
        <div
          className="h-px w-full"
          style={{ background: "oklch(var(--border))" }}
        />

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="google-name"
              className="font-display font-semibold text-xs uppercase tracking-wider"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              Full Name
            </Label>
            <Input
              id="google-name"
              data-ocid="google_login.input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name)
                  setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="Jane Smith"
              className="font-body"
              autoFocus
              autoComplete="name"
            />
            {errors.name && (
              <p
                className="text-xs font-body"
                data-ocid="google_login.error_state"
                style={{ color: "oklch(0.55 0.18 25)" }}
              >
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="google-email"
              className="font-display font-semibold text-xs uppercase tracking-wider"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              Email Address
            </Label>
            <Input
              id="google-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email)
                  setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="jane@company.com"
              className="font-body"
              autoComplete="email"
            />
            {errors.email && (
              <p
                className="text-xs font-body"
                style={{ color: "oklch(0.55 0.18 25)" }}
              >
                {errors.email}
              </p>
            )}
          </div>

          <p
            className="text-xs font-body pt-1"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            This signs you in and registers your account in the training system.
          </p>

          <Button
            type="submit"
            data-ocid="google_login.submit_button"
            disabled={isLoading}
            className="w-full gap-2.5 font-display font-semibold h-10"
            style={{
              background: "#4285F4",
              color: "white",
              border: "none",
            }}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GoogleGIcon size={18} />
            )}
            {isLoading ? "Signing in..." : "Continue with Google"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
