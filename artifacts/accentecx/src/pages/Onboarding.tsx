import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, ArrowRight, ArrowLeft, Loader2, Heart, Shield, Video,
  Brain, Calendar, Users, Stethoscope, FileText, Star, Check, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

const PLANS = {
  "starter-care": {
    name: "Starter Care",
    price: "₱200",
    period: "/month",
    tagline: "Monitor your child's development — free to start, always.",
    color: "bg-card border-border",
    badge: null,
    highlight: false,
    features: [
      "1 child profile",
      "Basic developmental screening (2×/year)",
      "Milestone tracking dashboard",
      "Text-based AI developmental summary",
      "Parent resource library",
      "Email support",
    ],
    excluded: [
      "Video behavioral analysis",
      "Therapy plan tracking",
      "School input system",
      "Specialist messaging",
    ],
    quickStart: [
      { icon: Users, label: "Add your child's profile", desc: "Set up their digital developmental twin" },
      { icon: Brain, label: "Complete first screening", desc: "Takes 10–15 minutes, 25 milestone questions" },
      { icon: FileText, label: "Read your AI summary", desc: "Get your child's first developmental report" },
    ],
  },
  "care-plus": {
    name: "Care Plus",
    price: "₱799",
    period: "/month",
    tagline: "Full developmental intelligence for growing families.",
    color: "bg-primary border-primary",
    badge: "Most Popular",
    highlight: true,
    features: [
      "Up to 4 child profiles",
      "Full developmental screening (unlimited)",
      "Full AI clinical report with risk scoring",
      "Video behavioral analysis (up to 3/month)",
      "Therapy plan tracking",
      "School input system (teacher reports)",
      "Specialist messaging",
      "Priority email + chat support",
    ],
    excluded: [
      "Priority AI processing",
      "Therapy automation workflows",
    ],
    quickStart: [
      { icon: Users, label: "Add all your children", desc: "Up to 4 child profiles on one account" },
      { icon: Brain, label: "Run a full screening", desc: "Comprehensive 5-domain AI clinical intake" },
      { icon: Video, label: "Submit a video session", desc: "Upload behavioral footage for AI analysis" },
      { icon: Calendar, label: "Book a specialist", desc: "Schedule telehealth or in-person appointments" },
    ],
  },
  "care-family-pro": {
    name: "Care Family Pro",
    price: "₱1,999",
    period: "/month",
    tagline: "Clinical-grade care for families who need the most.",
    color: "bg-card border-border",
    badge: null,
    highlight: false,
    features: [
      "Unlimited child profiles",
      "Full AI clinical reports with risk scoring",
      "Unlimited video behavioral analysis",
      "Therapy plan tracking + automation",
      "School input system (teacher + school reports)",
      "Priority AI processing",
      "Specialist messaging (priority queue)",
      "Advanced clinical reports & PDF exports",
      "Dedicated family support manager",
      "24/7 support",
    ],
    excluded: [],
    quickStart: [
      { icon: Users, label: "Add all your children", desc: "Unlimited profiles, one family account" },
      { icon: Brain, label: "Run full AI screenings", desc: "Comprehensive 5-domain clinical intake" },
      { icon: Video, label: "Submit video sessions", desc: "Unlimited behavioral video analysis" },
      { icon: Stethoscope, label: "Connect with specialists", desc: "Priority access to developmental pediatricians" },
      { icon: FileText, label: "Download clinical reports", desc: "PDF-ready reports for doctors and schools" },
    ],
  },
};

type PlanKey = keyof typeof PLANS;
type Step = "plan" | "account" | "welcome";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const params = new URLSearchParams(window.location.search);
  const rawPlan = params.get("plan") ?? "care-plus";
  const planKey: PlanKey = rawPlan in PLANS ? (rawPlan as PlanKey) : "care-plus";
  const plan = PLANS[planKey];

  const [step, setStep] = useState<Step>("plan");
  const [form, setForm] = useState({ name: "", email: "", childName: "", guardianType: "Parent" });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(err => ({ ...err, [e.target.name]: "" }));
  }

  function validateAccount() {
    const e: Partial<typeof form> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.includes("@")) e.email = "A valid email address is required";
    if (!form.childName.trim()) e.childName = "Child's name is required to create their profile";
    return e;
  }

  async function handleCreateAccount(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validateAccount();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    setStep("welcome");
  }

  function handleEnterDashboard() {
    login({
      name: form.name || "Parent User",
      email: form.email || "parent@accentecx.ph",
      role: "parent",
      tier: planKey,
    });
    setLocation("/parent");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Heart className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground text-sm tracking-tight">ACCENTECX AI CARE</span>
        </div>
        <div className="flex items-center gap-2">
          {(["plan", "account", "welcome"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                step === s ? "bg-primary text-primary-foreground" :
                ["plan", "account", "welcome"].indexOf(step) > i ? "bg-secondary text-secondary-foreground" :
                "bg-muted text-muted-foreground"
              }`}>
                {["plan", "account", "welcome"].indexOf(step) > i ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              {i < 2 && <div className={`h-px w-8 transition-colors ${["plan", "account", "welcome"].indexOf(step) > i ? "bg-secondary" : "bg-border"}`} />}
            </div>
          ))}
        </div>
        <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to site</a>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">

          {/* ── STEP 1: Plan Confirmation ────────────────────────────────── */}
          {step === "plan" && (
            <motion.div key="plan" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-secondary/15 px-4 py-1.5 mb-4">
                  <Star className="h-3.5 w-3.5 text-secondary" />
                  <span className="text-xs font-semibold text-primary">You selected: {plan.name}</span>
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Review your plan</h1>
                <p className="text-muted-foreground">Confirm what's included, then set up your account.</p>
              </div>

              {/* Plan card */}
              <div className={`rounded-2xl border p-7 ${plan.highlight ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                {plan.badge && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground mb-4">
                    <Star className="h-3 w-3" /> {plan.badge}
                  </div>
                )}
                <div className="flex items-baseline gap-2 mb-1">
                  <span className={`text-4xl font-bold ${plan.highlight ? "text-primary-foreground" : "text-foreground"}`}>{plan.price}</span>
                  <span className={`text-sm ${plan.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{plan.period}</span>
                </div>
                <p className={`text-sm mb-6 ${plan.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{plan.tagline}</p>

                <div className="grid sm:grid-cols-2 gap-2">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-secondary" />
                      <span className={plan.highlight ? "text-primary-foreground" : "text-foreground"}>{f}</span>
                    </div>
                  ))}
                  {plan.excluded.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm opacity-40">
                      <X className="h-4 w-4 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plan switcher */}
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-3">CHANGE PLAN</p>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][]).map(([key, p]) => (
                    <a
                      key={key}
                      href={`/onboarding?plan=${key}`}
                      className={`rounded-lg border p-3 text-center transition-all ${
                        planKey === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <p className="text-xs font-bold text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.price}/mo</p>
                    </a>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => setStep("account")}
                className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-base"
                data-testid="onboarding-continue-account"
              >
                Continue with {plan.name} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <p className="text-center text-xs text-muted-foreground">No credit card required during setup. Billed monthly, cancel anytime.</p>
            </motion.div>
          )}

          {/* ── STEP 2: Account Setup ─────────────────────────────────────── */}
          {step === "account" && (
            <motion.div key="account" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-8">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-foreground mb-2">Create your account</h1>
                <p className="text-muted-foreground">
                  Setting up <strong className="text-foreground">{plan.name}</strong> at{" "}
                  <strong className="text-foreground">{plan.price}/month</strong>
                </p>
              </div>

              <form onSubmit={handleCreateAccount} className="space-y-5">
                <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                  <p className="text-sm font-semibold text-foreground">Your Information</p>

                  <div className="space-y-1.5">
                    <Label htmlFor="ob-name" className="text-xs font-semibold">Full Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="ob-name" name="name" placeholder="Maria Santos"
                      value={form.name} onChange={handleChange}
                      className={`h-11 ${errors.name ? "border-red-400" : ""}`}
                      data-testid="onboarding-input-name"
                    />
                    {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ob-email" className="text-xs font-semibold">Email Address <span className="text-red-500">*</span></Label>
                    <Input
                      id="ob-email" name="email" type="email" placeholder="you@email.com"
                      value={form.email} onChange={handleChange}
                      className={`h-11 ${errors.email ? "border-red-400" : ""}`}
                      data-testid="onboarding-input-email"
                    />
                    {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="ob-role" className="text-xs font-semibold">I am a</Label>
                      <select
                        id="ob-role" name="guardianType" value={form.guardianType} onChange={handleChange}
                        className="w-full h-11 rounded-md border border-input px-3 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option>Parent</option>
                        <option>Guardian</option>
                        <option>Grandparent</option>
                        <option>Other caregiver</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Plan Selected</Label>
                      <div className="h-11 rounded-md border border-input bg-muted/30 px-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{plan.name}</span>
                        <span className="text-xs text-muted-foreground">{plan.price}/mo</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                  <p className="text-sm font-semibold text-foreground">First Child's Profile</p>
                  <p className="text-xs text-muted-foreground">You can add more children after signing in. This creates their developmental digital twin.</p>

                  <div className="space-y-1.5">
                    <Label htmlFor="ob-child" className="text-xs font-semibold">Child's First Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="ob-child" name="childName" placeholder="e.g. Gabrielle"
                      value={form.childName} onChange={handleChange}
                      className={`h-11 ${errors.childName ? "border-red-400" : ""}`}
                      data-testid="onboarding-input-child"
                    />
                    {errors.childName && <p className="text-red-500 text-xs">{errors.childName}</p>}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button" variant="outline"
                    onClick={() => setStep("plan")}
                    className="flex-none rounded-full px-5 h-12"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 h-12 rounded-full bg-primary text-primary-foreground font-semibold"
                    data-testid="onboarding-create-account"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Setting up your account…</span>
                    ) : (
                      <span className="flex items-center gap-2">Create My Account <ArrowRight className="h-4 w-4" /></span>
                    )}
                  </Button>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  By continuing you agree to our{" "}
                  <span className="underline cursor-pointer hover:text-foreground">Terms of Service</span> and{" "}
                  <span className="underline cursor-pointer hover:text-foreground">Privacy Policy</span>.
                  <br />Your data is protected under the Philippine Data Privacy Act (RA 10173).
                </p>
              </form>
            </motion.div>
          )}

          {/* ── STEP 3: Welcome ───────────────────────────────────────────── */}
          {step === "welcome" && (
            <motion.div key="welcome" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-8">
              {/* Hero */}
              <div className="text-center py-4">
                <div className="flex justify-center mb-5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/20">
                    <CheckCircle2 className="h-10 w-10 text-secondary" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to ACCENTECX AI CARE!</h1>
                <p className="text-muted-foreground">
                  Hi <strong className="text-foreground">{form.name}</strong>! Your <strong className="text-foreground">{plan.name}</strong> account is ready.
                  <br />{form.childName ? `We've created a developmental profile for ${form.childName}.` : ""}
                </p>
              </div>

              {/* Plan summary pill */}
              <div className="rounded-2xl border border-secondary/30 bg-secondary/10 p-5 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/20 shrink-0">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{plan.name} — {plan.price}/month</p>
                  <p className="text-sm text-muted-foreground">{plan.features.length} features active · Billed monthly · Cancel anytime</p>
                </div>
              </div>

              {/* Quick start */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Your quick-start checklist</p>
                {plan.quickStart.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                        <span className="text-xs font-bold text-primary">{i + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  );
                })}
              </div>

              {/* What they unlock */}
              <div className="rounded-2xl border border-border bg-muted/30 p-5">
                <p className="text-xs font-semibold text-muted-foreground mb-3">INCLUDED IN YOUR PLAN</p>
                <div className="grid grid-cols-2 gap-2">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs">
                      <Check className="h-3.5 w-3.5 text-secondary shrink-0" />
                      <span className="text-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleEnterDashboard}
                className="w-full h-13 rounded-full bg-primary text-primary-foreground font-bold text-base py-4"
                data-testid="onboarding-enter-dashboard"
              >
                Enter My Dashboard <ArrowRight className="h-5 w-5 ml-1" />
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Need help getting started?{" "}
                <span className="text-primary underline cursor-pointer hover:text-primary/80">Chat with support</span>
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
