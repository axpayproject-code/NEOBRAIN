import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users, Stethoscope, GraduationCap, Globe,
  ChevronRight, Shield, ArrowRight, Check, AlertCircle, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, type UserRole, ROLE_TIERS, roleDefaultRoute } from "@/contexts/AuthContext";
import NeoBrainLogo from "@/components/ui/NeoBrainLogo";

const ROLES: {
  id: UserRole;
  label: string;
  subLabel: string;
  icon: typeof Users;
  tier: string;
  description: string;
}[] = [
  {
    id: "family",
    label: "For Families",
    subLabel: "Family Care",
    icon: Users,
    tier: "B2C Subscription",
    description: "Track your child's developmental journey, complete screenings, book specialists, and follow AI-guided therapy plans.",
  },
  {
    id: "clinic",
    label: "For Clinics",
    subLabel: "Clinical System",
    icon: Stethoscope,
    tier: "Clinic SaaS",
    description: "Manage your practice with AI-assisted intake, patient risk triage, telehealth tools, and clinical reporting.",
  },
  {
    id: "school",
    label: "For Schools",
    subLabel: "School System",
    icon: GraduationCap,
    tier: "School License",
    description: "Screen students, track developmental milestones, file teacher reports, and coordinate with clinics and families.",
  },
  {
    id: "government",
    label: "For Government",
    subLabel: "Government Panel",
    icon: Globe,
    tier: "Government Access",
    description: "Monitor population-level developmental risk, allocate early intervention resources, and drive national health policy.",
  },
];

type Mode = "signin" | "signup" | "otp";

interface PendingUser { id: string; email: string; name: string; role: string; tier: string }

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [selectedRole, setSelectedRole] = useState<UserRole>("family");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // OTP state
  const [pendingUser, setPendingUser] = useState<PendingUser | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpDevCode, setOtpDevCode] = useState<string | null>(null);

  // ── Sign In ──────────────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      login({ id: data.id, email: data.email, name: data.name, role: data.role, tier: data.subscriptionTier ?? "free" });
      setLocation(roleDefaultRoute(data.role));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Login failed. Please try again.");
      setLoading(false);
    }
  };

  // ── Sign Up ──────────────────────────────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      // Store pending user and send OTP
      setPendingUser({ id: data.id, email: data.email, name: data.name, role: data.role, tier: data.subscriptionTier ?? "free" });
      const otpRes = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, purpose: "verify" }),
      });
      if (otpRes.ok) {
        const otpData = await otpRes.json() as { code?: string };
        if (otpData.code) setOtpDevCode(otpData.code); // dev mode: show code
      }
      setMode("otp");
      setOtpCode("");
      setLoading(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Signup failed. Please try again.");
      setLoading(false);
    }
  };

  // ── OTP Verify ───────────────────────────────────────────────────────────
  const handleOTPVerify = async () => {
    if (!pendingUser || !otpCode.trim()) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingUser.email, code: otpCode.trim(), purpose: "verify" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");
      login({ ...pendingUser, role: pendingUser.role as UserRole });
      setLocation(roleDefaultRoute(pendingUser.role as UserRole));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Verification failed");
      setLoading(false);
    }
  };

  const handleSkipOTP = () => {
    if (pendingUser) {
      login({ ...pendingUser, role: pendingUser.role as UserRole });
      setLocation(roleDefaultRoute(pendingUser.role as UserRole));
    }
  };

  return (
    <div className="min-h-[100dvh] flex bg-background">
      {/* ── Left panel ─────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12">
        <NeoBrainLogo size="md" showTagline variant="dark" />
        <div className="space-y-6 max-w-sm">
          <div className="text-4xl font-bold text-background leading-tight">
            {mode === "signin" ? "Every role. One platform. One mission." : "Choose your role to get started."}
          </div>
          <p className="text-background/70 leading-relaxed">
            {mode === "signin"
              ? "From family care management to national-level analytics — each role gets a purpose-built workspace designed for their exact job."
              : "Each user type has its own workspace, tools, and onboarding path — tailored for exactly what you need to do."}
          </p>
          <div className="space-y-3">
            {ROLES.map(r => (
              <div key={r.id} className={`flex items-center gap-3 text-sm transition-opacity ${selectedRole === r.id ? "opacity-100" : "opacity-50"}`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${selectedRole === r.id ? "bg-secondary/40" : "bg-secondary/15"}`}>
                  <r.icon className="h-4 w-4 text-secondary" />
                </div>
                <span className="font-medium text-background">{r.label}</span>
                <span className="text-background/50">— {r.subLabel}</span>
              </div>
            ))}
          </div>
          {mode === "signup" && selectedRole && (
            <motion.div
              key={selectedRole}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-secondary/10 border border-secondary/20 p-4"
            >
              <p className="text-xs text-background/80 leading-relaxed">
                {ROLES.find(r => r.id === selectedRole)?.description}
              </p>
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-2 text-background/40 text-xs">
          <Shield className="h-3.5 w-3.5" />
          <span>This platform does not diagnose. Clinical decision support only.</span>
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-muted/20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8">
            <NeoBrainLogo size="md" variant="light" />
          </div>

          {/* Mode toggle */}
          <div className="flex items-center gap-1 rounded-full bg-muted border border-border p-1 mb-8 w-fit">
            <button
              onClick={() => { setMode("signin"); setErrorMsg(""); }}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${mode === "signin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("signup"); setErrorMsg(""); }}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${mode === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
              data-testid="mode-switch-signup"
            >
              Create Account
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* ── SIGN IN MODE ──────────────────────────────────────────── */}
            {mode === "signin" && (
              <motion.div
                key="signin"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.22 }}
              >
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-foreground mb-1">Sign in to your workspace</h1>
                  <p className="text-muted-foreground text-sm">Enter your credentials to access your dashboard</p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Your role</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {ROLES.map((role) => {
                        const Icon = role.icon;
                        const active = selectedRole === role.id;
                        return (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => setSelectedRole(role.id)}
                            data-testid={`role-select-${role.id}`}
                            className={`flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition-all ${
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background hover:border-primary/30 text-muted-foreground"
                            }`}
                          >
                            <Icon className={`h-5 w-5 mb-1 ${active ? "text-secondary" : ""}`} />
                            <span className={`text-xs font-bold leading-tight ${active ? "text-primary-foreground" : "text-foreground"}`}>{role.label}</span>
                            <span className={`text-xs ${active ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{role.tier}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-sm">Email</Label>
                      <Input
                        id="email" name="email" type="email" placeholder="name@example.com" required
                        data-testid="input-email" className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm">Password</Label>
                        <a href="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</a>
                      </div>
                      <Input
                        id="password" name="password" type="password" required placeholder="Your password"
                        data-testid="input-password" className="h-11 rounded-xl"
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {errorMsg}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-full text-base font-bold gap-2"
                    disabled={loading}
                    data-testid="button-sign-in"
                  >
                    {loading ? "Signing in…" : (
                      <>Sign In to {ROLES.find(r => r.id === selectedRole)?.subLabel} <ChevronRight className="h-4 w-4" /></>
                    )}
                  </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-5">
                  Don't have an account?{" "}
                  <button onClick={() => { setMode("signup"); setErrorMsg(""); }} className="text-primary font-medium hover:underline">
                    Create account
                  </button>
                </p>

                <div className="mt-6 pt-5 border-t border-border text-center">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("superadmin" as UserRole)}
                    className={`inline-flex items-center gap-1.5 text-xs transition-colors ${selectedRole === "superadmin" ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                    data-testid="role-select-superadmin"
                  >
                    <Lock className="h-3 w-3" />
                    Platform Admin Access
                  </button>
                  {selectedRole === "superadmin" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Authorized ACCENTECX AI personnel only. All access is logged.
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── SIGN UP MODE ──────────────────────────────────────────── */}
            {mode === "signup" && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22 }}
              >
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-foreground mb-1">Create your account</h1>
                  <p className="text-muted-foreground text-sm">Select your role — each has its own workspace and onboarding</p>
                </div>

                <div className="space-y-5">
                  {/* Role selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Your role</Label>
                    <div className="space-y-2">
                      {ROLES.map((role) => {
                        const Icon = role.icon;
                        const active = selectedRole === role.id;
                        return (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => { setSelectedRole(role.id); setErrorMsg(""); }}
                            data-testid={`signup-role-${role.id}`}
                            className={`w-full flex items-center gap-4 p-3 rounded-xl border-2 text-left transition-all ${
                              active
                                ? "border-primary bg-primary/5"
                                : "border-border bg-background hover:border-primary/30"
                            }`}
                          >
                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${active ? "bg-primary" : "bg-muted"}`}>
                              <Icon className={`h-4 w-4 ${active ? "text-primary-foreground" : "text-muted-foreground"}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-bold ${active ? "text-primary" : "text-foreground"}`}>{role.label}</p>
                              <p className="text-xs text-muted-foreground">{role.tier}</p>
                            </div>
                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${active ? "border-primary bg-primary" : "border-border"}`}>
                              {active && <Check className="h-3 w-3 text-primary-foreground" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Family role: quick signup form. Org roles: redirect to full onboarding */}
                  {selectedRole === "family" ? (
                    <form onSubmit={handleSignUp} className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-sm">Full Name</Label>
                        <Input id="name" name="name" type="text" placeholder="Your full name" required className="h-11 rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-email" className="text-sm">Email</Label>
                        <Input id="signup-email" name="email" type="email" placeholder="name@example.com" required className="h-11 rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-password" className="text-sm">Password</Label>
                        <Input id="signup-password" name="password" type="password" placeholder="Min 6 characters" required minLength={6} className="h-11 rounded-xl" />
                      </div>
                      {errorMsg && (
                        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          {errorMsg}
                        </div>
                      )}
                      <Button type="submit" className="w-full h-12 rounded-full text-base font-bold bg-primary text-primary-foreground" disabled={loading} data-testid="button-continue-signup">
                        {loading ? "Creating account…" : <><span>Create Account</span> <ArrowRight className="h-4 w-4 ml-1" /></>}
                      </Button>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-1.5">
                        <p className="text-sm font-semibold text-foreground">Organization onboarding</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedRole === "clinic" && "Set up your clinic or hospital workspace with DOH licensing, PhilHealth accreditation, plan selection, and admin account — takes about 3 minutes."}
                          {selectedRole === "school" && "Register your school with DepEd details, grade coverage, enrollment size, plan selection, and admin account — takes about 3 minutes."}
                          {selectedRole === "government" && "Register your government agency with LGU details, regional coverage, plan selection, and responsible officer account — takes about 3 minutes."}
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => setLocation(`/onboarding?role=${selectedRole}`)}
                        className="w-full h-12 rounded-full text-base font-bold bg-primary text-primary-foreground"
                        data-testid="button-continue-signup"
                      >
                        Begin {ROLES.find(r => r.id === selectedRole)?.label} Setup <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>

                <p className="text-center text-sm text-muted-foreground mt-5">
                  Already have an account?{" "}
                  <button onClick={() => { setMode("signin"); setErrorMsg(""); }} className="text-primary font-medium hover:underline">
                    Sign in
                  </button>
                </p>
              </motion.div>
            )}
            {/* ── OTP VERIFICATION MODE ─────────────────────────────── */}
            {mode === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22 }}
              >
                <div className="mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">Verify your email</h1>
                  <p className="text-muted-foreground text-sm">
                    We sent a 6-digit code to <span className="font-semibold text-foreground">{pendingUser?.email}</span>
                  </p>
                </div>

                {otpDevCode && (
                  <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-800">Dev mode — OTP code: <span className="font-mono font-bold tracking-widest">{otpDevCode}</span></p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp-code" className="text-sm font-semibold">Verification code</Label>
                    <Input
                      id="otp-code"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="000000"
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      className="h-14 rounded-xl text-center text-2xl font-mono tracking-[0.4em]"
                      data-testid="input-otp-code"
                    />
                  </div>

                  {errorMsg && (
                    <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3">
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                      <p className="text-sm text-destructive">{errorMsg}</p>
                    </div>
                  )}

                  <Button
                    className="w-full h-12 rounded-xl gap-2"
                    onClick={handleOTPVerify}
                    disabled={loading || otpCode.length < 6}
                    data-testid="button-verify-otp"
                  >
                    {loading ? "Verifying..." : "Verify & Enter Platform"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <button
                      onClick={handleSkipOTP}
                      className="text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Skip for now
                    </button>
                    <button
                      onClick={async () => {
                        if (!pendingUser) return;
                        const r = await fetch("/api/otp/send", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ email: pendingUser.email, purpose: "verify" }),
                        });
                        if (r.ok) {
                          const d = await r.json() as { code?: string };
                          if (d.code) setOtpDevCode(d.code);
                        }
                      }}
                      className="text-primary hover:underline"
                    >
                      Resend code
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
