import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  HeartPulse, User, Stethoscope, ActivitySquare, Settings,
  ChevronRight, Shield, ArrowRight, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, type UserRole, ROLE_DEMO_USERS, roleDefaultRoute } from "@/contexts/AuthContext";

const ROLES: {
  id: UserRole;
  label: string;
  subLabel: string;
  icon: typeof User;
  tier: string;
  description: string;
  onboardingPath: string;
}[] = [
  {
    id: "parent",
    label: "Parent / Guardian",
    subLabel: "Family Care",
    icon: User,
    tier: "B2C Subscription",
    description: "Track your child's developmental journey, complete screenings, book specialists, and follow AI-guided therapy plans.",
    onboardingPath: "/onboarding?role=parent&plan=care-plus",
  },
  {
    id: "doctor",
    label: "Clinician / Doctor",
    subLabel: "Clinical System",
    icon: Stethoscope,
    tier: "Clinic SaaS",
    description: "Manage your practice with AI-assisted intake, patient risk triage, telehealth tools, and clinical reporting.",
    onboardingPath: "/onboarding?role=doctor",
  },
  {
    id: "therapist",
    label: "Therapist / Educator",
    subLabel: "Therapy System",
    icon: ActivitySquare,
    tier: "Clinic SaaS",
    description: "Manage your caseload, create therapy plans, track progress, and collaborate with clinics and families.",
    onboardingPath: "/onboarding?role=therapist",
  },
  {
    id: "admin",
    label: "Platform Admin",
    subLabel: "Admin Dashboard",
    icon: Settings,
    tier: "Admin Access",
    description: "Monitor platform health, manage clinics and schools, view population-level risk analytics, and control access.",
    onboardingPath: "/onboarding?role=admin",
  },
];

type Mode = "signin" | "signup";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [selectedRole, setSelectedRole] = useState<UserRole>("parent");
  const [loading, setLoading] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const demoUser = ROLE_DEMO_USERS[selectedRole];
      login(demoUser);
      setLocation(roleDefaultRoute(selectedRole));
    }, 700);
  };

  const handleContinueSignup = () => {
    const role = ROLES.find(r => r.id === selectedRole);
    if (role) setLocation(role.onboardingPath);
  };

  return (
    <div className="min-h-[100dvh] flex bg-background">
      {/* ── Left panel ─────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12">
        <div className="flex items-center gap-2 text-background font-bold text-lg">
          <HeartPulse className="h-7 w-7 text-secondary" />
          <span>ACCENTECX AI CARE</span>
        </div>
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
          <div className="lg:hidden flex items-center gap-2 text-primary font-bold text-lg mb-8">
            <HeartPulse className="h-6 w-6 text-secondary" />
            <span>ACCENTECX AI CARE</span>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center gap-1 rounded-full bg-muted border border-border p-1 mb-8 w-fit">
            <button
              onClick={() => setMode("signin")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${mode === "signin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("signup")}
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
                  <p className="text-muted-foreground text-sm">Select your role to access the correct dashboard</p>
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
                        id="email" type="email" placeholder="name@example.com" required
                        defaultValue="demo@accentecx.com" data-testid="input-email"
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm">Password</Label>
                        <span className="text-xs text-primary hover:underline cursor-pointer">Forgot password?</span>
                      </div>
                      <Input
                        id="password" type="password" required defaultValue="password"
                        data-testid="input-password" className="h-11 rounded-xl"
                      />
                    </div>
                  </div>

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

                <div className="mt-5 rounded-xl bg-secondary/10 border border-secondary/20 p-4 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Demo mode:</span> Use any email/password. Select a role above to access that dashboard. All data is real from the database.
                </div>

                <p className="text-center text-sm text-muted-foreground mt-5">
                  Don't have an account?{" "}
                  <button onClick={() => setMode("signup")} className="text-primary font-medium hover:underline">
                    Create account
                  </button>
                </p>
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
                  <p className="text-muted-foreground text-sm">Select your role — each has its own onboarding and workspace</p>
                </div>

                <div className="space-y-3 mb-6">
                  {ROLES.map((role) => {
                    const Icon = role.icon;
                    const active = selectedRole === role.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRole(role.id)}
                        data-testid={`signup-role-${role.id}`}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                          active
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:border-primary/30"
                        }`}
                      >
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${active ? "bg-primary" : "bg-muted"}`}>
                          <Icon className={`h-5 w-5 ${active ? "text-primary-foreground" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-bold ${active ? "text-primary" : "text-foreground"}`}>{role.label}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                              {role.tier}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-snug mt-0.5 truncate">{role.description.slice(0, 70)}…</p>
                        </div>
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${active ? "border-primary bg-primary" : "border-border"}`}>
                          {active && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Role description */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedRole}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="rounded-xl bg-muted/50 border border-border p-4 mb-5"
                  >
                    <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                      {ROLES.find(r => r.id === selectedRole)?.subLabel} Setup
                    </p>
                    <p className="text-sm text-foreground">
                      {ROLES.find(r => r.id === selectedRole)?.description}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <Button
                  onClick={handleContinueSignup}
                  className="w-full h-12 rounded-full text-base font-bold bg-primary text-primary-foreground"
                  data-testid="button-continue-signup"
                >
                  Continue as {ROLES.find(r => r.id === selectedRole)?.label}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>

                <p className="text-center text-sm text-muted-foreground mt-5">
                  Already have an account?{" "}
                  <button onClick={() => setMode("signin")} className="text-primary font-medium hover:underline">
                    Sign in
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
