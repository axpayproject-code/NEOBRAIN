import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, ArrowRight, ArrowLeft, Loader2, Heart, Shield,
  Video, Brain, Calendar, Users, Stethoscope, FileText, Star, Check, X,
  GraduationCap, Globe, Building2, ClipboardList, ActivitySquare, Settings,
  BarChart3, UserCheck, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import NeoBrainLogo from "@/components/ui/NeoBrainLogo";

// ── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

// ── Family / Parent plans ─────────────────────────────────────────────────────

const FAMILY_PLANS = {
  "starter-care": {
    name: "Starter Care", price: "₱200", period: "/month",
    tagline: "Monitor your child's development — free to start, always.",
    highlight: false, badge: null,
    features: ["1 child profile", "Basic developmental screening (2×/year)", "Games Assessment (5 mini-games)", "Milestone tracking dashboard", "Text-based AI developmental summary", "Parent resource library", "Email support"],
    excluded: ["Video behavioral analysis", "Therapy plan tracking", "School input system", "Specialist messaging"],
    quickStart: [
      { icon: Users, label: "Add your child's profile", desc: "Set up their developmental digital twin" },
      { icon: Brain, label: "Complete first screening", desc: "25 milestone questions across 5 domains" },
      { icon: FileText, label: "Read your AI summary", desc: "Get your child's first developmental report" },
    ],
  },
  "care-plus": {
    name: "Care Plus", price: "₱799", period: "/month",
    tagline: "Full developmental intelligence for growing families.",
    highlight: true, badge: "Most Popular",
    features: ["Up to 4 child profiles", "Full AI clinical report with risk scoring", "Full developmental screening (unlimited)", "Games Assessment (5 mini-games)", "Video behavioral analysis (up to 3/month)", "Therapy plan tracking", "School input system (teacher reports)", "Specialist messaging", "Priority email + chat support"],
    excluded: ["Priority AI processing", "Therapy automation workflows"],
    quickStart: [
      { icon: Users, label: "Add all your children", desc: "Up to 4 child profiles on one account" },
      { icon: Brain, label: "Run a full screening", desc: "5-domain AI clinical intake" },
      { icon: Video, label: "Submit a video session", desc: "Upload behavioral footage for AI analysis" },
      { icon: Calendar, label: "Book a specialist", desc: "Schedule telehealth or in-person appointments" },
    ],
  },
  "care-family-pro": {
    name: "Care Family Pro", price: "₱1,999", period: "/month",
    tagline: "Clinical-grade care for families who need the most.",
    highlight: false, badge: "Premium",
    features: ["Up to 6 child profiles", "Full AI clinical reports with risk scoring", "Unlimited video behavioral analysis", "Games Assessment (5 mini-games)", "Therapy plan tracking + automation", "School input system", "Priority AI processing", "Specialist messaging (priority queue)", "Advanced clinical reports & PDF exports", "Dedicated family support manager", "24/7 support"],
    excluded: [],
    quickStart: [
      { icon: Users, label: "Add up to 6 children", desc: "6 profiles, one family account" },
      { icon: Brain, label: "Run full AI screenings", desc: "5-domain clinical intake" },
      { icon: Video, label: "Submit video sessions", desc: "Unlimited behavioral video analysis" },
      { icon: Stethoscope, label: "Connect with specialists", desc: "Priority access to developmental pediatricians" },
      { icon: FileText, label: "Download clinical reports", desc: "PDF-ready reports for doctors and schools" },
    ],
  },
};
type PlanKey = keyof typeof FAMILY_PLANS;

// ── Clinic plans ──────────────────────────────────────────────────────────────
const CLINIC_PLANS = {
  "clinic-starter": {
    name: "Clinic Starter", price: "₱2,999", period: "/month",
    tagline: "Perfect for solo practices and small clinics just getting started.",
    highlight: false, badge: null as string | null,
    features: ["Up to 2 doctor accounts", "Up to 50 patient profiles", "AI clinical intake (basic)", "Risk triage dashboard", "Parent messaging portal", "Appointment scheduling", "Email support"],
    excluded: ["Video behavioral analysis", "Multi-branch management", "Advanced AI reports", "API access"],
  },
  "clinic-pro": {
    name: "Clinic Pro", price: "₱7,499", period: "/month",
    tagline: "The full clinical AI suite for growing multi-doctor practices.",
    highlight: true, badge: "Most Popular" as string | null,
    features: ["Up to 10 doctor accounts", "Unlimited patient profiles", "Full AI clinical intake + risk scoring", "Video behavioral analysis (50/month)", "Multi-specialty support", "Therapy plan management", "Parent portal + school integration", "AI-generated clinical reports", "Priority chat + email support"],
    excluded: ["Multi-branch management", "API access"],
  },
  "clinic-enterprise": {
    name: "Clinic Enterprise", price: "₱18,999", period: "/month",
    tagline: "For hospital networks, multi-branch clinics, and large practice groups.",
    highlight: false, badge: "Enterprise" as string | null,
    features: ["Unlimited doctor & staff accounts", "Unlimited patients", "Full AI suite + priority processing", "Unlimited video behavioral analysis", "Multi-branch management", "Advanced analytics & population reports", "PhilHealth & DOH integration", "EHR/EMR export", "API access", "Dedicated account manager", "24/7 support + SLA"],
    excluded: [],
  },
};
type ClinicPlanKey = keyof typeof CLINIC_PLANS;

// ── School plans ──────────────────────────────────────────────────────────────
const SCHOOL_PLANS = {
  "school-100": {
    name: "School 100", price: "₱1,999", period: "/month",
    tagline: "For small schools and independent campuses up to 100 students.",
    highlight: false, badge: null as string | null,
    features: ["Up to 100 student profiles", "2 counselor/teacher accounts", "DepEd developmental screening", "SPED / IEP tracking", "Parent communication portal", "Risk dashboard", "DepEd report templates", "Email support"],
    excluded: ["School district analytics", "Multi-campus management", "DOH referral integration"],
  },
  "school-500": {
    name: "School 500", price: "₱4,499", period: "/month",
    tagline: "The complete developmental health system for mainstream schools.",
    highlight: true, badge: "Most Popular" as string | null,
    features: ["Up to 500 student profiles", "10 counselor/teacher accounts", "Full AI developmental screening", "SPED / IEP management", "Clinic & DOH referral workflow", "Parent portal + SMS notifications", "DepEd compliance reports", "School-level analytics", "Priority support"],
    excluded: ["Multi-campus management"],
  },
  "school-district": {
    name: "School District", price: "₱12,999", period: "/month",
    tagline: "District-wide deployment for DepEd divisions and school networks.",
    highlight: false, badge: "District" as string | null,
    features: ["Unlimited students", "Unlimited staff accounts", "25+ school campuses", "District-level analytics dashboard", "DepEd Division reporting", "DOH & RHU integration", "Population risk mapping", "Bulk student import", "API access", "24/7 support"],
    excluded: [],
  },
};
type SchoolPlanKey = keyof typeof SCHOOL_PLANS;

// ── Government plans ──────────────────────────────────────────────────────────
const GOV_PLANS = {
  "lgu-city": {
    name: "City / Municipality", price: "₱9,999", period: "/month",
    tagline: "For LGUs, city health offices, and municipal social welfare departments.",
    highlight: false, badge: null as string | null,
    features: ["Up to 50 barangay units", "10 officer accounts", "Population developmental screening", "Risk mapping per barangay", "DOH & PhilHealth data integration", "LGU dashboard + reports", "Early intervention referral workflow", "Standard support"],
    excluded: ["Province-wide analytics", "Inter-LGU data sharing", "Custom API"],
  },
  "province-region": {
    name: "Province / Region", price: "₱24,999", period: "/month",
    tagline: "For provincial governments, regional DOH offices, and DSWD units.",
    highlight: true, badge: "Most Popular" as string | null,
    features: ["Unlimited barangay units", "50 officer accounts", "Multi-city/municipality coverage", "Province-wide risk analytics", "Inter-LGU data aggregation", "DOH, DSWD & PhilHealth integration", "Population trend reports", "Legislative/policy data export", "Priority support + training"],
    excluded: ["Custom data pipelines"],
  },
  "national": {
    name: "National Agency", price: "Contact Us", period: "custom pricing",
    tagline: "For DOH, DSWD, DepEd central offices, and nationwide health programs.",
    highlight: false, badge: "Enterprise" as string | null,
    features: ["National deployment coverage", "Unlimited users and offices", "Full population analytics", "National risk surveillance dashboard", "Multi-agency data integration", "Custom AI model configuration", "Legislative-grade reporting", "Custom API & data pipelines", "Dedicated technical team", "24/7 priority SLA"],
    excluded: [],
  },
};
type GovPlanKey = keyof typeof GOV_PLANS;

const MEDICAL_SPECIALTIES = [
  "Developmental Pediatrics", "General Pediatrics", "Child & Adolescent Psychiatry",
  "Pediatric Neurology", "Occupational Medicine", "Clinical Psychology", "Child Rehabilitation Medicine",
];

const THERAPY_TYPES = [
  "Speech-Language Therapy", "Occupational Therapy (OT)", "Behavioral Therapy (ABA)",
  "Physical Therapy", "Cognitive Behavioral Therapy", "Play Therapy", "Special Education",
];

const PROVINCES = [
  "Metro Manila", "Cebu", "Davao", "Laguna", "Batangas", "Rizal", "Bulacan", "Pampanga",
  "Cavite", "Zambales", "Iloilo", "Cagayan de Oro", "Zamboanga", "Palawan", "Benguet",
  "Negros Occidental", "Leyte", "Albay", "Pangasinan", "Nueva Ecija", "Other",
];

// ── Shared helpers ────────────────────────────────────────────────────────────

function StepIndicator({ step, total = 3 }: { step: Step; total?: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
            step === i + 1 ? "bg-primary text-primary-foreground" :
            step > i + 1 ? "bg-secondary text-secondary-foreground" :
            "bg-muted text-muted-foreground"
          }`}>
            {step > i + 1 ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </div>
          {i < total - 1 && <div className={`h-px w-8 transition-colors ${step > i + 1 ? "bg-secondary" : "bg-border"}`} />}
        </div>
      ))}
    </div>
  );
}

// ── PARENT ONBOARDING ─────────────────────────────────────────────────────────

function ParentOnboarding({ planKey, onComplete }: { planKey: PlanKey; onComplete: (name: string, email: string, tier: string, userId: string) => void }) {
  const plan = FAMILY_PLANS[planKey] ?? FAMILY_PLANS["care-plus"];
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({ name: "", email: "", password: "", childName: "", guardianType: "Parent" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [createdUserId, setCreatedUserId] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(err => ({ ...err, [e.target.name]: "" }));
  }

  async function handleAccountSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.includes("@")) e.email = "A valid email address is required";
    if (!form.childName.trim()) e.childName = "Child's name is required";
    if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, role: "family" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      setCreatedUserId(data.id);
      setStep(3);
    } catch (err) {
      setErrors(prev => ({ ...prev, api: err instanceof Error ? err.message : "Signup failed. Please try again." }));
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  return (
    <AnimatePresence mode="wait">
      {step === 1 && (
        <motion.div key="p1" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-7">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary/15 px-4 py-1.5 mb-4">
              <Star className="h-3.5 w-3.5 text-secondary" />
              <span className="text-xs font-semibold text-primary">You selected: {plan.name}</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Review your plan</h1>
            <p className="text-muted-foreground">Confirm what's included, then set up your account.</p>
          </div>

          <div className={`rounded-2xl border p-7 ${plan.highlight ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>
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
                  <X className="h-4 w-4 shrink-0" /><span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3">CHANGE PLAN</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(FAMILY_PLANS) as [PlanKey, typeof FAMILY_PLANS[PlanKey]][]).map(([key, p]) => (
                <a key={key} href={`/onboarding?role=family&plan=${key}`}
                  className={`rounded-lg border p-3 text-center transition-all ${planKey === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                  <p className="text-xs font-bold text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.price}/mo</p>
                </a>
              ))}
            </div>
          </div>

          <Button onClick={() => setStep(2)} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-base" data-testid="onboarding-continue-account">
            Continue with {plan.name} <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
          <p className="text-center text-xs text-muted-foreground">No credit card required. Cancel anytime.</p>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div key="p2" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-7">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Create your account</h1>
            <p className="text-muted-foreground">{plan.name} — <strong className="text-foreground">{plan.price}/month</strong></p>
          </div>
          <form onSubmit={handleAccountSubmit} className="space-y-5">
            <div className="rounded-2xl border bg-card p-6 space-y-4">
              <p className="text-sm font-semibold">Your Information</p>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Full Name <span className="text-red-500">*</span></Label>
                <Input name="name" placeholder="Maria Santos" value={form.name} onChange={handleChange} className={`h-11 ${errors.name ? "border-red-400" : ""}`} data-testid="onboarding-input-name" />
                {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Email Address <span className="text-red-500">*</span></Label>
                <Input name="email" type="email" placeholder="you@email.com" value={form.email} onChange={handleChange} className={`h-11 ${errors.email ? "border-red-400" : ""}`} data-testid="onboarding-input-email" />
                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Password <span className="text-red-500">*</span></Label>
                <Input name="password" type="password" placeholder="Min 6 characters" value={form.password} onChange={handleChange} className={`h-11 ${errors.password ? "border-red-400" : ""}`} data-testid="onboarding-input-password" />
                {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">I am a</Label>
                  <select name="guardianType" value={form.guardianType} onChange={handleChange} className="w-full h-11 rounded-md border border-input px-3 text-sm bg-background">
                    <option>Parent</option><option>Guardian</option><option>Grandparent</option><option>Other caregiver</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Plan</Label>
                  <div className="h-11 rounded-md border border-input bg-muted/30 px-3 flex items-center justify-between">
                    <span className="text-sm font-semibold">{plan.name}</span>
                    <span className="text-xs text-muted-foreground">{plan.price}/mo</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border bg-card p-6 space-y-4">
              <p className="text-sm font-semibold">First Child's Profile</p>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Child's First Name <span className="text-red-500">*</span></Label>
                <Input name="childName" placeholder="e.g. Gabrielle" value={form.childName} onChange={handleChange} className={`h-11 ${errors.childName ? "border-red-400" : ""}`} data-testid="onboarding-input-child" />
                {errors.childName && <p className="text-red-500 text-xs">{errors.childName}</p>}
              </div>
            </div>
            {errors.api && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                <span>{errors.api}</span>
              </div>
            )}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="rounded-full px-5 h-12"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
              <Button type="submit" disabled={submitting} className="flex-1 h-12 rounded-full bg-primary text-primary-foreground font-semibold" data-testid="onboarding-create-account">
                {submitting ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</span> : <span className="flex items-center gap-2">Create My Account <ArrowRight className="h-4 w-4" /></span>}
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground">Protected under the Philippine Data Privacy Act (RA 10173).</p>
          </form>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div key="p3" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-7">
          <div className="text-center">
            <div className="flex justify-center mb-5"><div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/20"><CheckCircle2 className="h-10 w-10 text-secondary" /></div></div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to NEOBRAIN!</h1>
            <p className="text-muted-foreground">Your <strong className="text-foreground">{plan.name}</strong> account is ready, <strong className="text-foreground">{form.name || "Parent"}</strong>!</p>
          </div>
          <div className="rounded-2xl border border-secondary/30 bg-secondary/10 p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/20 shrink-0"><Shield className="h-6 w-6 text-primary" /></div>
            <div><p className="font-bold text-foreground">{plan.name} — {plan.price}/month</p><p className="text-sm text-muted-foreground">{plan.features.length} features active · Cancel anytime</p></div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Your quick-start checklist</p>
            {plan.quickStart.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-4 rounded-xl border bg-card p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0"><span className="text-xs font-bold text-primary">{i + 1}</span></div>
                  <div className="flex-1"><p className="text-sm font-semibold">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              );
            })}
          </div>
          <Button onClick={() => onComplete(form.name, form.email, planKey, createdUserId)} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-bold text-base" data-testid="onboarding-enter-dashboard">
            Enter My Dashboard <ArrowRight className="h-5 w-5 ml-1" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── CLINIC ONBOARDING (4 steps) ───────────────────────────────────────────────

function DoctorOnboarding({ onComplete }: { onComplete: (name: string, email: string, userId: string) => void }) {
  type OrgStep = 1 | 2 | 3 | 4;
  const [step, setStep] = useState<OrgStep>(1);
  const [org, setOrg] = useState({ name: "", type: "", province: "", address: "", email: "", phone: "", dohLicense: "", philhealthAccredited: "", branches: "1" });
  const [orgErrors, setOrgErrors] = useState<Partial<Record<keyof typeof org, string>>>({});
  const [selectedPlan, setSelectedPlan] = useState<ClinicPlanKey>("clinic-pro");
  const [profile, setProfile] = useState({ name: "", specialty: "", license: "", phone: "", email: "", password: "" });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [createdUserId, setCreatedUserId] = useState("");

  function hOrg(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) { setOrg(f => ({ ...f, [e.target.name]: e.target.value })); setOrgErrors(err => ({ ...err, [e.target.name]: "" })); }
  function hProfile(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) { setProfile(f => ({ ...f, [e.target.name]: e.target.value })); setProfileErrors(err => ({ ...err, [e.target.name]: "" })); }

  function submitOrg(e: React.FormEvent) {
    e.preventDefault();
    const errs: Partial<Record<keyof typeof org, string>> = {};
    if (!org.name.trim()) errs.name = "Required";
    if (!org.type) errs.type = "Required";
    if (!org.province) errs.province = "Required";
    if (Object.keys(errs).length) { setOrgErrors(errs); return; }
    setStep(2);
  }

  async function submitProfile(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!profile.name.trim()) errs.name = "Required";
    if (!profile.specialty) errs.specialty = "Required";
    if (!profile.email.includes("@")) errs.email = "Valid email required";
    if (profile.password.length < 6) errs.password = "Min 6 characters";
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: profile.name, email: profile.email, password: profile.password, role: "clinic" }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      setCreatedUserId(data.id);
      setStep(4);
    } catch (err) { setProfileErrors(prev => ({ ...prev, api: err instanceof Error ? err.message : "Signup failed. Try again." })); }
    finally { setSubmitting(false); }
  }

  useEffect(() => { window.scrollTo(0, 0); }, [step]);
  const plan = CLINIC_PLANS[selectedPlan];

  return (
    <AnimatePresence mode="wait">
      {step === 1 && (
        <motion.div key="c1" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-7">
          <StepIndicator step={1} total={4} />
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1.5 mb-4">
              <Stethoscope className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-xs font-semibold text-blue-700">Clinic / Hospital SaaS Setup</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Tell us about your clinic</h1>
            <p className="text-muted-foreground">We'll configure your workspace, billing, and team access for your organization.</p>
          </div>
          <form onSubmit={submitOrg} className="space-y-5">
            <div className="rounded-2xl border bg-card p-6 space-y-4">
              <p className="text-sm font-semibold text-foreground">Organization Information</p>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Clinic / Hospital Name <span className="text-red-500">*</span></Label>
                <Input name="name" placeholder="Children's Developmental Clinic Manila" value={org.name} onChange={hOrg} className={`h-11 ${orgErrors.name ? "border-red-400" : ""}`} data-testid="onboarding-clinic-name" />
                {orgErrors.name && <p className="text-red-500 text-xs">{orgErrors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Clinic Type <span className="text-red-500">*</span></Label>
                  <select name="type" value={org.type} onChange={hOrg} className={`w-full h-11 rounded-md border px-3 text-sm bg-background ${orgErrors.type ? "border-red-400" : "border-input"}`}>
                    <option value="">Select type…</option>
                    <option>Solo Practice (1 doctor)</option>
                    <option>Small Clinic (2–5 doctors)</option>
                    <option>Multi-Doctor Center (6–15)</option>
                    <option>Hospital-Based Clinic</option>
                    <option>Multi-Branch Network</option>
                  </select>
                  {orgErrors.type && <p className="text-red-500 text-xs">{orgErrors.type}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Province / Region <span className="text-red-500">*</span></Label>
                  <select name="province" value={org.province} onChange={hOrg} className={`w-full h-11 rounded-md border px-3 text-sm bg-background ${orgErrors.province ? "border-red-400" : "border-input"}`}>
                    <option value="">Select province…</option>
                    {PROVINCES.map(p => <option key={p}>{p}</option>)}
                  </select>
                  {orgErrors.province && <p className="text-red-500 text-xs">{orgErrors.province}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Complete Address</Label>
                <Input name="address" placeholder="Unit/Floor, Building, Street, Barangay, City" value={org.address} onChange={hOrg} className="h-11" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Clinic Email</Label>
                  <Input name="email" type="email" placeholder="info@yourclinic.ph" value={org.email} onChange={hOrg} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Clinic Phone</Label>
                  <Input name="phone" placeholder="+63 2 XXXX XXXX" value={org.phone} onChange={hOrg} className="h-11" />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border bg-card p-6 space-y-4">
              <p className="text-sm font-semibold text-foreground">Regulatory &amp; Accreditation</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">DOH License No.</Label>
                  <Input name="dohLicense" placeholder="DOH-XXXX-XXXXX" value={org.dohLicense} onChange={hOrg} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">PhilHealth Accreditation</Label>
                  <select name="philhealthAccredited" value={org.philhealthAccredited} onChange={hOrg} className="w-full h-11 rounded-md border px-3 text-sm bg-background border-input">
                    <option value="">Select…</option>
                    <option>Yes — accredited</option>
                    <option>No — not accredited</option>
                    <option>Pending accreditation</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Number of Branches / Locations</Label>
                <select name="branches" value={org.branches} onChange={hOrg} className="w-full h-11 rounded-md border px-3 text-sm bg-background border-input">
                  <option value="1">1 — Single location</option>
                  <option value="2-5">2–5 branches</option>
                  <option value="6-15">6–15 branches</option>
                  <option value="15+">15+ branches (enterprise)</option>
                </select>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold" data-testid="onboarding-clinic-next">
              Continue to Plan Selection <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div key="c2" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-7">
          <StepIndicator step={2} total={4} />
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Choose your plan</h1>
            <p className="text-muted-foreground">Select the tier for <strong className="text-foreground">{org.name}</strong>. You can upgrade anytime.</p>
          </div>
          <div className="space-y-4">
            {(Object.entries(CLINIC_PLANS) as [ClinicPlanKey, (typeof CLINIC_PLANS)[ClinicPlanKey]][]).map(([key, p]) => (
              <button type="button" key={key} onClick={() => setSelectedPlan(key)}
                className={`w-full text-left rounded-2xl border-2 p-5 transition-all relative ${selectedPlan === key ? "border-primary bg-primary/5" : p.highlight ? "border-secondary/40 bg-secondary/5 hover:border-secondary" : "border-border hover:border-primary/30"}`}>
                {p.badge && <span className={`absolute -top-2.5 right-4 text-xs font-bold px-3 py-0.5 rounded-full ${p.badge === "Most Popular" ? "bg-secondary text-primary" : "bg-primary text-primary-foreground"}`}>{p.badge}</span>}
                <div className="flex items-start gap-4">
                  <div className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${selectedPlan === key ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                    {selectedPlan === key && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1">
                      <p className="font-bold text-foreground">{p.name}</p>
                      <span className="text-xl font-black text-primary">{p.price}</span>
                      <span className="text-xs text-muted-foreground">{p.period}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{p.tagline}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                      {p.features.map(f => <div key={f} className="flex items-center gap-1.5 text-xs text-foreground"><Check className="h-3 w-3 text-secondary shrink-0" />{f}</div>)}
                    </div>
                    {p.excluded.length > 0 && <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">{p.excluded.map(f => <div key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground line-through"><X className="h-3 w-3 shrink-0" />{f}</div>)}</div>}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setStep(1)} className="rounded-full px-5 h-12"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
            <Button onClick={() => setStep(3)} className="flex-1 h-12 rounded-full bg-primary text-primary-foreground font-semibold">Continue with {plan.name} <ArrowRight className="h-4 w-4 ml-1" /></Button>
          </div>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div key="c3" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-7">
          <StepIndicator step={3} total={4} />
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Administrator account</h1>
            <p className="text-muted-foreground">Create the primary admin login for <strong className="text-foreground">{org.name}</strong>.</p>
          </div>
          <div className="rounded-xl border border-secondary/30 bg-secondary/10 p-4 flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0"><p className="text-sm font-bold truncate">{org.name}</p><p className="text-xs text-muted-foreground">{org.type} · {org.province}</p></div>
            <div className="text-right shrink-0"><p className="text-xs font-bold text-primary">{plan.name}</p><p className="text-xs text-muted-foreground">{plan.price}{plan.period}</p></div>
          </div>
          <form onSubmit={submitProfile} className="space-y-5">
            <div className="rounded-2xl border bg-card p-6 space-y-4">
              <p className="text-sm font-semibold">Primary Administrator Details</p>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Full Name <span className="text-red-500">*</span></Label>
                <Input name="name" placeholder="Dr. Juan dela Cruz" value={profile.name} onChange={hProfile} className={`h-11 ${profileErrors.name ? "border-red-400" : ""}`} data-testid="onboarding-doctor-name" />
                {profileErrors.name && <p className="text-red-500 text-xs">{profileErrors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Medical Specialty <span className="text-red-500">*</span></Label>
                <select name="specialty" value={profile.specialty} onChange={hProfile} className={`w-full h-11 rounded-md border px-3 text-sm bg-background ${profileErrors.specialty ? "border-red-400" : "border-input"}`}>
                  <option value="">Select specialty…</option>
                  {MEDICAL_SPECIALTIES.map(s => <option key={s}>{s}</option>)}
                </select>
                {profileErrors.specialty && <p className="text-red-500 text-xs">{profileErrors.specialty}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">PRC License No.</Label>
                  <Input name="license" placeholder="0123456" value={profile.license} onChange={hProfile} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Mobile Number</Label>
                  <Input name="phone" placeholder="+63 9XX XXX XXXX" value={profile.phone} onChange={hProfile} className="h-11" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Work Email <span className="text-red-500">*</span></Label>
                <Input name="email" type="email" placeholder="doctor@clinic.ph" value={profile.email} onChange={hProfile} className={`h-11 ${profileErrors.email ? "border-red-400" : ""}`} data-testid="onboarding-doctor-email" />
                {profileErrors.email && <p className="text-red-500 text-xs">{profileErrors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Password <span className="text-red-500">*</span></Label>
                <Input name="password" type="password" placeholder="Min 6 characters" value={profile.password} onChange={hProfile} className={`h-11 ${profileErrors.password ? "border-red-400" : ""}`} />
                {profileErrors.password && <p className="text-red-500 text-xs">{profileErrors.password}</p>}
              </div>
            </div>
            {profileErrors.api && <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive"><span>{profileErrors.api}</span></div>}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="rounded-full px-5 h-12"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
              <Button type="submit" disabled={submitting} className="flex-1 h-12 rounded-full bg-primary text-primary-foreground font-semibold" data-testid="onboarding-doctor-submit">
                {submitting ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</span> : <span className="flex items-center gap-2">Create Clinic Account <ArrowRight className="h-4 w-4" /></span>}
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {step === 4 && (
        <motion.div key="c4" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-7">
          <div className="text-center">
            <div className="flex justify-center mb-5"><div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/20"><CheckCircle2 className="h-10 w-10 text-secondary" /></div></div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Your clinic is live on NEOBRAIN!</h1>
            <p className="text-muted-foreground"><strong className="text-foreground">{org.name}</strong> has been successfully onboarded.</p>
          </div>
          <div className="rounded-2xl border border-secondary/30 bg-secondary/10 p-5 space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/20 shrink-0"><Building2 className="h-6 w-6 text-primary" /></div>
              <div className="flex-1 min-w-0"><p className="font-bold truncate">{org.name}</p><p className="text-sm text-muted-foreground">{org.type} · {org.province}</p></div>
              <span className="text-sm font-bold text-primary shrink-0">{plan.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-secondary/20 text-xs">
              <div><span className="text-muted-foreground">Admin: </span><span className="font-medium">{profile.name}</span></div>
              <div><span className="text-muted-foreground">Plan: </span><span className="font-medium">{plan.price}/month</span></div>
              {org.dohLicense && <div><span className="text-muted-foreground">DOH: </span><span className="font-medium">{org.dohLicense}</span></div>}
              {org.philhealthAccredited && <div><span className="text-muted-foreground">PhilHealth: </span><span className="font-medium">{org.philhealthAccredited}</span></div>}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold">Quick-start checklist</p>
            {[
              { icon: Users, label: "Add your first patient", desc: "Create a child profile and start developmental tracking" },
              { icon: ClipboardList, label: "Run your first AI intake", desc: "5-domain clinical screening engine" },
              { icon: BarChart3, label: "Review your risk dashboard", desc: "AI-computed domain risk levels and triage queue" },
              { icon: UserCheck, label: "Invite your care team", desc: "Add doctors and nurses via Manage Team tab" },
            ].map((item, i) => { const Icon = item.icon; return (
              <div key={item.label} className="flex items-center gap-4 rounded-xl border bg-card p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0"><span className="text-xs font-bold text-primary">{i + 1}</span></div>
                <div className="flex-1"><p className="text-sm font-semibold">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            ); })}
          </div>
          <Button onClick={() => onComplete(profile.name, profile.email, createdUserId)} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-bold" data-testid="onboarding-enter-dashboard">
            Enter Clinical Dashboard <ArrowRight className="h-5 w-5 ml-1" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── SCHOOL ONBOARDING (4 steps) ───────────────────────────────────────────────

function TherapistOnboarding({ onComplete }: { onComplete: (name: string, email: string, userId: string) => void }) {
  type OrgStep = 1 | 2 | 3 | 4;
  const [step, setStep] = useState<OrgStep>(1);
  const [org, setOrg] = useState({ name: "", type: "", depedRegion: "", address: "", email: "", phone: "", depedSchoolId: "", gradeLevels: "", studentCount: "" });
  const [orgErrors, setOrgErrors] = useState<Partial<Record<keyof typeof org, string>>>({});
  const [selectedPlan, setSelectedPlan] = useState<SchoolPlanKey>("school-500");
  const [profile, setProfile] = useState({ name: "", position: "", email: "", phone: "", password: "" });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [createdUserId, setCreatedUserId] = useState("");

  function hOrg(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) { setOrg(f => ({ ...f, [e.target.name]: e.target.value })); setOrgErrors(err => ({ ...err, [e.target.name]: "" })); }
  function hProfile(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) { setProfile(f => ({ ...f, [e.target.name]: e.target.value })); setProfileErrors(err => ({ ...err, [e.target.name]: "" })); }

  function submitOrg(e: React.FormEvent) {
    e.preventDefault();
    const errs: Partial<Record<keyof typeof org, string>> = {};
    if (!org.name.trim()) errs.name = "Required";
    if (!org.type) errs.type = "Required";
    if (!org.depedRegion) errs.depedRegion = "Required";
    if (Object.keys(errs).length) { setOrgErrors(errs); return; }
    setStep(2);
  }

  async function submitProfile(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!profile.name.trim()) errs.name = "Required";
    if (!profile.email.includes("@")) errs.email = "Valid email required";
    if (profile.password.length < 6) errs.password = "Min 6 characters";
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: profile.name, email: profile.email, password: profile.password, role: "school" }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      setCreatedUserId(data.id);
      setStep(4);
    } catch (err) { setProfileErrors(prev => ({ ...prev, api: err instanceof Error ? err.message : "Signup failed. Try again." })); }
    finally { setSubmitting(false); }
  }

  useEffect(() => { window.scrollTo(0, 0); }, [step]);
  const plan = SCHOOL_PLANS[selectedPlan];

  return (
    <AnimatePresence mode="wait">
      {step === 1 && (
        <motion.div key="s1" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-7">
          <StepIndicator step={1} total={4} />
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 mb-4">
              <GraduationCap className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-xs font-semibold text-amber-700">School / DepEd Setup</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Tell us about your school</h1>
            <p className="text-muted-foreground">We'll configure your school's developmental health workspace, plans, and staff access.</p>
          </div>
          <form onSubmit={submitOrg} className="space-y-5">
            <div className="rounded-2xl border bg-card p-6 space-y-4">
              <p className="text-sm font-semibold text-foreground">School Information</p>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">School / Institution Name <span className="text-red-500">*</span></Label>
                <Input name="name" placeholder="Marikina Heights Elementary School" value={org.name} onChange={hOrg} className={`h-11 ${orgErrors.name ? "border-red-400" : ""}`} data-testid="onboarding-school-name" />
                {orgErrors.name && <p className="text-red-500 text-xs">{orgErrors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">School Type <span className="text-red-500">*</span></Label>
                  <select name="type" value={org.type} onChange={hOrg} className={`w-full h-11 rounded-md border px-3 text-sm bg-background ${orgErrors.type ? "border-red-400" : "border-input"}`}>
                    <option value="">Select type…</option>
                    <option>Public Elementary School</option>
                    <option>Public High School</option>
                    <option>Private Elementary School</option>
                    <option>Private High School</option>
                    <option>Integrated School (K–12)</option>
                    <option>Special Education (SPED) Center</option>
                    <option>Alternative Learning System (ALS)</option>
                    <option>School Network / Division</option>
                  </select>
                  {orgErrors.type && <p className="text-red-500 text-xs">{orgErrors.type}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">DepEd Region <span className="text-red-500">*</span></Label>
                  <select name="depedRegion" value={org.depedRegion} onChange={hOrg} className={`w-full h-11 rounded-md border px-3 text-sm bg-background ${orgErrors.depedRegion ? "border-red-400" : "border-input"}`}>
                    <option value="">Select region…</option>
                    <option>NCR — National Capital Region</option>
                    <option>Region I — Ilocos</option>
                    <option>Region II — Cagayan Valley</option>
                    <option>Region III — Central Luzon</option>
                    <option>Region IV-A — CALABARZON</option>
                    <option>Region IV-B — MIMAROPA</option>
                    <option>Region V — Bicol</option>
                    <option>Region VI — Western Visayas</option>
                    <option>Region VII — Central Visayas</option>
                    <option>Region VIII — Eastern Visayas</option>
                    <option>Region IX — Zamboanga Peninsula</option>
                    <option>Region X — Northern Mindanao</option>
                    <option>Region XI — Davao</option>
                    <option>Region XII — SOCCSKSARGEN</option>
                    <option>Region XIII — Caraga</option>
                    <option>CAR — Cordillera Administrative Region</option>
                    <option>BARMM — Bangsamoro</option>
                  </select>
                  {orgErrors.depedRegion && <p className="text-red-500 text-xs">{orgErrors.depedRegion}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">School Address</Label>
                <Input name="address" placeholder="Street, Barangay, City / Municipality, Province" value={org.address} onChange={hOrg} className="h-11" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">School Email</Label>
                  <Input name="email" type="email" placeholder="principal@school.edu.ph" value={org.email} onChange={hOrg} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">School Phone</Label>
                  <Input name="phone" placeholder="+63 2 XXXX XXXX" value={org.phone} onChange={hOrg} className="h-11" />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border bg-card p-6 space-y-4">
              <p className="text-sm font-semibold text-foreground">DepEd &amp; Enrollment Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">DepEd School ID</Label>
                  <Input name="depedSchoolId" placeholder="e.g. 123456" value={org.depedSchoolId} onChange={hOrg} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Approx. Total Students</Label>
                  <select name="studentCount" value={org.studentCount} onChange={hOrg} className="w-full h-11 rounded-md border px-3 text-sm bg-background border-input">
                    <option value="">Select range…</option>
                    <option>Under 100</option>
                    <option>100 – 300</option>
                    <option>301 – 500</option>
                    <option>501 – 1,000</option>
                    <option>1,001 – 3,000</option>
                    <option>3,000+</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Grade Levels Offered</Label>
                <select name="gradeLevels" value={org.gradeLevels} onChange={hOrg} className="w-full h-11 rounded-md border px-3 text-sm bg-background border-input">
                  <option value="">Select…</option>
                  <option>Kinder – Grade 6 (Elementary)</option>
                  <option>Grades 7–10 (Junior High)</option>
                  <option>Grades 11–12 (Senior High)</option>
                  <option>Kinder – Grade 12 (K–12 Complete)</option>
                  <option>SPED / Special Program</option>
                </select>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold" data-testid="onboarding-school-next">
              Continue to Plan Selection <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div key="s2" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-7">
          <StepIndicator step={2} total={4} />
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Choose your plan</h1>
            <p className="text-muted-foreground">Select the tier for <strong className="text-foreground">{org.name}</strong>. You can upgrade anytime.</p>
          </div>
          <div className="space-y-4">
            {(Object.entries(SCHOOL_PLANS) as [SchoolPlanKey, (typeof SCHOOL_PLANS)[SchoolPlanKey]][]).map(([key, p]) => (
              <button type="button" key={key} onClick={() => setSelectedPlan(key)}
                className={`w-full text-left rounded-2xl border-2 p-5 transition-all relative ${selectedPlan === key ? "border-primary bg-primary/5" : p.highlight ? "border-amber-300/60 bg-amber-50/50 hover:border-amber-400" : "border-border hover:border-primary/30"}`}>
                {p.badge && <span className={`absolute -top-2.5 right-4 text-xs font-bold px-3 py-0.5 rounded-full ${p.badge === "Most Popular" ? "bg-amber-400 text-white" : "bg-primary text-primary-foreground"}`}>{p.badge}</span>}
                <div className="flex items-start gap-4">
                  <div className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${selectedPlan === key ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                    {selectedPlan === key && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1">
                      <p className="font-bold text-foreground">{p.name}</p>
                      <span className="text-xl font-black text-primary">{p.price}</span>
                      <span className="text-xs text-muted-foreground">{p.period}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{p.tagline}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                      {p.features.map(f => <div key={f} className="flex items-center gap-1.5 text-xs text-foreground"><Check className="h-3 w-3 text-amber-500 shrink-0" />{f}</div>)}
                    </div>
                    {p.excluded.length > 0 && (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                        {p.excluded.map(f => <div key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground line-through"><X className="h-3 w-3 shrink-0" />{f}</div>)}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setStep(1)} className="rounded-full px-5 h-12"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
            <Button onClick={() => setStep(3)} className="flex-1 h-12 rounded-full bg-primary text-primary-foreground font-semibold">
              Continue with {plan.name} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div key="s3" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-7">
          <StepIndicator step={3} total={4} />
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Administrator account</h1>
            <p className="text-muted-foreground">Create the primary admin login for <strong className="text-foreground">{org.name}</strong>.</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{org.name}</p>
              <p className="text-xs text-muted-foreground">{org.type} · {org.depedRegion}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-primary">{plan.name}</p>
              <p className="text-xs text-muted-foreground">{plan.price}{plan.period}</p>
            </div>
          </div>
          <form onSubmit={submitProfile} className="space-y-5">
            <div className="rounded-2xl border bg-card p-6 space-y-4">
              <p className="text-sm font-semibold">School Administrator Details</p>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Full Name <span className="text-red-500">*</span></Label>
                <Input name="name" placeholder="Ma. Santos, EdD" value={profile.name} onChange={hProfile} className={`h-11 ${profileErrors.name ? "border-red-400" : ""}`} data-testid="onboarding-school-admin-name" />
                {profileErrors.name && <p className="text-red-500 text-xs">{profileErrors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Position / Title</Label>
                <select name="position" value={profile.position} onChange={hProfile} className="w-full h-11 rounded-md border px-3 text-sm bg-background border-input">
                  <option value="">Select position…</option>
                  <option>School Principal</option>
                  <option>Guidance Counselor</option>
                  <option>Special Education Teacher</option>
                  <option>School Psychologist</option>
                  <option>School Nurse</option>
                  <option>Department Head</option>
                  <option>School Division Superintendent</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Work Email <span className="text-red-500">*</span></Label>
                  <Input name="email" type="email" placeholder="admin@school.edu.ph" value={profile.email} onChange={hProfile} className={`h-11 ${profileErrors.email ? "border-red-400" : ""}`} data-testid="onboarding-school-admin-email" />
                  {profileErrors.email && <p className="text-red-500 text-xs">{profileErrors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Mobile Number</Label>
                  <Input name="phone" placeholder="+63 9XX XXX XXXX" value={profile.phone} onChange={hProfile} className="h-11" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Password <span className="text-red-500">*</span></Label>
                <Input name="password" type="password" placeholder="Min 6 characters" value={profile.password} onChange={hProfile} className={`h-11 ${profileErrors.password ? "border-red-400" : ""}`} />
                {profileErrors.password && <p className="text-red-500 text-xs">{profileErrors.password}</p>}
              </div>
            </div>
            {profileErrors.api && <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive"><span>{profileErrors.api}</span></div>}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="rounded-full px-5 h-12"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
              <Button type="submit" disabled={submitting} className="flex-1 h-12 rounded-full bg-primary text-primary-foreground font-semibold" data-testid="onboarding-school-submit">
                {submitting ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</span> : <span className="flex items-center gap-2">Create School Account <ArrowRight className="h-4 w-4" /></span>}
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {step === 4 && (
        <motion.div key="s4" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-7">
          <div className="text-center">
            <div className="flex justify-center mb-5"><div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100"><CheckCircle2 className="h-10 w-10 text-amber-500" /></div></div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Your school is live on NEOBRAIN!</h1>
            <p className="text-muted-foreground"><strong className="text-foreground">{org.name}</strong> has been successfully onboarded.</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 shrink-0"><GraduationCap className="h-6 w-6 text-amber-600" /></div>
              <div className="flex-1 min-w-0"><p className="font-bold truncate">{org.name}</p><p className="text-sm text-muted-foreground">{org.type} · {org.depedRegion}</p></div>
              <span className="text-sm font-bold text-primary shrink-0">{plan.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200 text-xs">
              <div><span className="text-muted-foreground">Admin: </span><span className="font-medium">{profile.name}</span></div>
              <div><span className="text-muted-foreground">Email: </span><span className="font-medium">{profile.email}</span></div>
              <div><span className="text-muted-foreground">Plan: </span><span className="font-medium">{plan.price}/month</span></div>
              {org.studentCount && <div><span className="text-muted-foreground">Students: </span><span className="font-medium">{org.studentCount}</span></div>}
              {org.depedSchoolId && <div><span className="text-muted-foreground">DepEd ID: </span><span className="font-medium">{org.depedSchoolId}</span></div>}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold">Quick-start checklist</p>
            {[
              { icon: Users, label: "Add your first students", desc: "Create child profiles and start developmental tracking" },
              { icon: ClipboardList, label: "Run a DepEd developmental screening", desc: "5-domain AI screening for your class" },
              { icon: BarChart3, label: "Review your school risk dashboard", desc: "See which students need early intervention" },
              { icon: UserCheck, label: "Invite your guidance team", desc: "Add counselors and teachers via Manage Team" },
            ].map((item, i) => { const Icon = item.icon; return (
              <div key={item.label} className="flex items-center gap-4 rounded-xl border bg-card p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0"><span className="text-xs font-bold text-primary">{i + 1}</span></div>
                <div className="flex-1"><p className="text-sm font-semibold">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            ); })}
          </div>
          <Button onClick={() => onComplete(profile.name, profile.email, createdUserId)} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-bold" data-testid="onboarding-enter-dashboard">
            Enter School Dashboard <ArrowRight className="h-5 w-5 ml-1" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── GOVERNMENT ONBOARDING (4 steps) ──────────────────────────────────────────

function AdminOnboarding({ onComplete }: { onComplete: (name: string, email: string, userId: string) => void }) {
  type OrgStep = 1 | 2 | 3 | 4;
  const [step, setStep] = useState<OrgStep>(1);
  const [org, setOrg] = useState({ name: "", agencyType: "", region: "", address: "", email: "", phone: "", agencyCode: "", mandate: "" });
  const [orgErrors, setOrgErrors] = useState<Partial<Record<keyof typeof org, string>>>({});
  const [selectedPlan, setSelectedPlan] = useState<GovPlanKey>("province-region");
  const [profile, setProfile] = useState({ name: "", position: "", employeeId: "", email: "", phone: "", password: "" });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [createdUserId, setCreatedUserId] = useState("");

  function hOrg(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) { setOrg(f => ({ ...f, [e.target.name]: e.target.value })); setOrgErrors(err => ({ ...err, [e.target.name]: "" })); }
  function hProfile(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) { setProfile(f => ({ ...f, [e.target.name]: e.target.value })); setProfileErrors(err => ({ ...err, [e.target.name]: "" })); }

  function submitOrg(e: React.FormEvent) {
    e.preventDefault();
    const errs: Partial<Record<keyof typeof org, string>> = {};
    if (!org.name.trim()) errs.name = "Required";
    if (!org.agencyType) errs.agencyType = "Required";
    if (!org.region) errs.region = "Required";
    if (Object.keys(errs).length) { setOrgErrors(errs); return; }
    setStep(2);
  }

  async function submitProfile(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!profile.name.trim()) errs.name = "Required";
    if (!profile.email.includes("@")) errs.email = "Valid email required";
    if (profile.password.length < 6) errs.password = "Min 6 characters";
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: profile.name, email: profile.email, password: profile.password, role: "government" }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      setCreatedUserId(data.id);
      setStep(4);
    } catch (err) { setProfileErrors(prev => ({ ...prev, api: err instanceof Error ? err.message : "Signup failed. Try again." })); }
    finally { setSubmitting(false); }
  }

  useEffect(() => { window.scrollTo(0, 0); }, [step]);
  const plan = GOV_PLANS[selectedPlan];

  return (
    <AnimatePresence mode="wait">
      {step === 1 && (
        <motion.div key="g1" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-7">
          <StepIndicator step={1} total={4} />
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-500/10 px-4 py-1.5 mb-4">
              <Globe className="h-3.5 w-3.5 text-slate-600" />
              <span className="text-xs font-semibold text-slate-700">Government / LGU Setup</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Tell us about your agency</h1>
            <p className="text-muted-foreground">We'll configure your government health workspace, population coverage, and staff access.</p>
          </div>
          <form onSubmit={submitOrg} className="space-y-5">
            <div className="rounded-2xl border bg-card p-6 space-y-4">
              <p className="text-sm font-semibold text-foreground">Agency / Organization Information</p>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Agency / Organization Name <span className="text-red-500">*</span></Label>
                <Input name="name" placeholder="City Health Office of Marikina" value={org.name} onChange={hOrg} className={`h-11 ${orgErrors.name ? "border-red-400" : ""}`} data-testid="onboarding-gov-name" />
                {orgErrors.name && <p className="text-red-500 text-xs">{orgErrors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Agency Type <span className="text-red-500">*</span></Label>
                  <select name="agencyType" value={org.agencyType} onChange={hOrg} className={`w-full h-11 rounded-md border px-3 text-sm bg-background ${orgErrors.agencyType ? "border-red-400" : "border-input"}`}>
                    <option value="">Select type…</option>
                    <option>City / Municipal Health Office</option>
                    <option>Provincial Health Office</option>
                    <option>Regional Health Unit (RHU)</option>
                    <option>DOH Regional Office</option>
                    <option>DSWD Regional Office</option>
                    <option>DepEd Division Office</option>
                    <option>Barangay Health Center</option>
                    <option>National Government Agency</option>
                    <option>Other LGU Unit</option>
                  </select>
                  {orgErrors.agencyType && <p className="text-red-500 text-xs">{orgErrors.agencyType}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Region <span className="text-red-500">*</span></Label>
                  <select name="region" value={org.region} onChange={hOrg} className={`w-full h-11 rounded-md border px-3 text-sm bg-background ${orgErrors.region ? "border-red-400" : "border-input"}`}>
                    <option value="">Select region…</option>
                    <option>NCR — National Capital Region</option>
                    <option>Region I — Ilocos</option>
                    <option>Region II — Cagayan Valley</option>
                    <option>Region III — Central Luzon</option>
                    <option>Region IV-A — CALABARZON</option>
                    <option>Region IV-B — MIMAROPA</option>
                    <option>Region V — Bicol</option>
                    <option>Region VI — Western Visayas</option>
                    <option>Region VII — Central Visayas</option>
                    <option>Region VIII — Eastern Visayas</option>
                    <option>Region IX — Zamboanga Peninsula</option>
                    <option>Region X — Northern Mindanao</option>
                    <option>Region XI — Davao</option>
                    <option>Region XII — SOCCSKSARGEN</option>
                    <option>Region XIII — Caraga</option>
                    <option>CAR — Cordillera Administrative Region</option>
                    <option>BARMM — Bangsamoro</option>
                  </select>
                  {orgErrors.region && <p className="text-red-500 text-xs">{orgErrors.region}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Office Address</Label>
                <Input name="address" placeholder="Floor/Unit, Building, Street, City/Municipality" value={org.address} onChange={hOrg} className="h-11" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Official Email</Label>
                  <Input name="email" type="email" placeholder="health@city.gov.ph" value={org.email} onChange={hOrg} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Office Phone</Label>
                  <Input name="phone" placeholder="+63 2 XXXX XXXX" value={org.phone} onChange={hOrg} className="h-11" />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border bg-card p-6 space-y-4">
              <p className="text-sm font-semibold text-foreground">Agency Mandate &amp; Coverage</p>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Government Agency Code / UACS</Label>
                <Input name="agencyCode" placeholder="e.g. 07 001 0000000" value={org.agencyCode} onChange={hOrg} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Brief Agency Mandate / Scope</Label>
                <Input name="mandate" placeholder="e.g. Child welfare and developmental health services for Marikina City" value={org.mandate} onChange={hOrg} className="h-11" />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold" data-testid="onboarding-gov-next">
              Continue to Plan Selection <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div key="g2" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-7">
          <StepIndicator step={2} total={4} />
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Choose your plan</h1>
            <p className="text-muted-foreground">Select the coverage tier for <strong className="text-foreground">{org.name}</strong>.</p>
          </div>
          <div className="space-y-4">
            {(Object.entries(GOV_PLANS) as [GovPlanKey, (typeof GOV_PLANS)[GovPlanKey]][]).map(([key, p]) => (
              <button type="button" key={key} onClick={() => setSelectedPlan(key)}
                className={`w-full text-left rounded-2xl border-2 p-5 transition-all relative ${selectedPlan === key ? "border-primary bg-primary/5" : p.highlight ? "border-slate-300/60 bg-slate-50/50 hover:border-slate-400" : "border-border hover:border-primary/30"}`}>
                {p.badge && <span className={`absolute -top-2.5 right-4 text-xs font-bold px-3 py-0.5 rounded-full ${p.badge === "Most Popular" ? "bg-primary text-primary-foreground" : "bg-slate-700 text-white"}`}>{p.badge}</span>}
                <div className="flex items-start gap-4">
                  <div className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${selectedPlan === key ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                    {selectedPlan === key && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1">
                      <p className="font-bold text-foreground">{p.name}</p>
                      <span className="text-xl font-black text-primary">{p.price}</span>
                      <span className="text-xs text-muted-foreground">{p.period}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{p.tagline}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                      {p.features.map(f => <div key={f} className="flex items-center gap-1.5 text-xs text-foreground"><Check className="h-3 w-3 text-slate-500 shrink-0" />{f}</div>)}
                    </div>
                    {p.excluded.length > 0 && <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">{p.excluded.map(f => <div key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground line-through"><X className="h-3 w-3 shrink-0" />{f}</div>)}</div>}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setStep(1)} className="rounded-full px-5 h-12"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
            <Button onClick={() => setStep(3)} className="flex-1 h-12 rounded-full bg-primary text-primary-foreground font-semibold">Continue with {plan.name} <ArrowRight className="h-4 w-4 ml-1" /></Button>
          </div>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div key="g3" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-7">
          <StepIndicator step={3} total={4} />
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Officer account</h1>
            <p className="text-muted-foreground">Create the primary admin login for <strong className="text-foreground">{org.name}</strong>.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center gap-3">
            <Globe className="h-5 w-5 text-slate-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{org.name}</p>
              <p className="text-xs text-muted-foreground">{org.agencyType} · {org.region}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-primary">{plan.name}</p>
              <p className="text-xs text-muted-foreground">{plan.price}{plan.period}</p>
            </div>
          </div>
          <form onSubmit={submitProfile} className="space-y-5">
            <div className="rounded-2xl border bg-card p-6 space-y-4">
              <p className="text-sm font-semibold">Responsible Officer Details</p>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Full Name <span className="text-red-500">*</span></Label>
                <Input name="name" placeholder="Maria Santos, RN, MPH" value={profile.name} onChange={hProfile} className={`h-11 ${profileErrors.name ? "border-red-400" : ""}`} data-testid="onboarding-gov-admin-name" />
                {profileErrors.name && <p className="text-red-500 text-xs">{profileErrors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Position / Designation</Label>
                <select name="position" value={profile.position} onChange={hProfile} className="w-full h-11 rounded-md border px-3 text-sm bg-background border-input">
                  <option value="">Select position…</option>
                  <option>City Health Officer</option>
                  <option>Municipal Health Officer</option>
                  <option>Provincial Health Officer</option>
                  <option>Public Health Nurse</option>
                  <option>Social Welfare Officer</option>
                  <option>Health Program Coordinator</option>
                  <option>Data Management Officer</option>
                  <option>Information Officer</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Official Email <span className="text-red-500">*</span></Label>
                  <Input name="email" type="email" placeholder="officer@agency.gov.ph" value={profile.email} onChange={hProfile} className={`h-11 ${profileErrors.email ? "border-red-400" : ""}`} data-testid="onboarding-gov-admin-email" />
                  {profileErrors.email && <p className="text-red-500 text-xs">{profileErrors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Mobile Number</Label>
                  <Input name="phone" placeholder="+63 9XX XXX XXXX" value={profile.phone} onChange={hProfile} className="h-11" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Employee / Plantilla ID</Label>
                <Input name="employeeId" placeholder="e.g. EMP-2024-XXXX" value={profile.employeeId} onChange={hProfile} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Password <span className="text-red-500">*</span></Label>
                <Input name="password" type="password" placeholder="Min 6 characters" value={profile.password} onChange={hProfile} className={`h-11 ${profileErrors.password ? "border-red-400" : ""}`} />
                {profileErrors.password && <p className="text-red-500 text-xs">{profileErrors.password}</p>}
              </div>
            </div>
            {profileErrors.api && <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive"><span>{profileErrors.api}</span></div>}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="rounded-full px-5 h-12"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
              <Button type="submit" disabled={submitting} className="flex-1 h-12 rounded-full bg-primary text-primary-foreground font-semibold" data-testid="onboarding-gov-submit">
                {submitting ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</span> : <span className="flex items-center gap-2">Create Government Account <ArrowRight className="h-4 w-4" /></span>}
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {step === 4 && (
        <motion.div key="g4" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-7">
          <div className="text-center">
            <div className="flex justify-center mb-5"><div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100"><CheckCircle2 className="h-10 w-10 text-slate-600" /></div></div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Your agency is live on NEOBRAIN!</h1>
            <p className="text-muted-foreground"><strong className="text-foreground">{org.name}</strong> has been successfully onboarded.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 shrink-0"><Globe className="h-6 w-6 text-slate-600" /></div>
              <div className="flex-1 min-w-0"><p className="font-bold truncate">{org.name}</p><p className="text-sm text-muted-foreground">{org.agencyType} · {org.region}</p></div>
              <span className="text-sm font-bold text-primary shrink-0">{plan.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
              <div><span className="text-muted-foreground">Officer: </span><span className="font-medium">{profile.name}</span></div>
              <div><span className="text-muted-foreground">Plan: </span><span className="font-medium">{plan.price}</span></div>
              {org.agencyCode && <div><span className="text-muted-foreground">Agency Code: </span><span className="font-medium">{org.agencyCode}</span></div>}
              {profile.position && <div><span className="text-muted-foreground">Position: </span><span className="font-medium">{profile.position}</span></div>}
            </div>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 flex items-start gap-3">
            <Lock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div><p className="text-sm font-bold text-blue-800">RA 10173 — Data Privacy Act</p><p className="text-xs text-blue-700 mt-0.5">As a government data controller, you are required to handle all citizen health data in compliance with the Data Privacy Act and NPC circulars. NEOBRAIN's architecture supports your Privacy Impact Assessment obligations.</p></div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold">Quick-start checklist</p>
            {[
              { icon: Users, label: "Configure your barangay / unit coverage", desc: "Map your LGU coverage for population screening" },
              { icon: BarChart3, label: "Review your risk analytics dashboard", desc: "Population-level risk map and early intervention signals" },
              { icon: ClipboardList, label: "Run a community screening event", desc: "Batch-enroll children for DepEd / CHO screening" },
              { icon: UserCheck, label: "Invite your health team", desc: "Add nurses, officers, and coordinators via Manage Team" },
            ].map((item, i) => { const Icon = item.icon; return (
              <div key={item.label} className="flex items-center gap-4 rounded-xl border bg-card p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0"><span className="text-xs font-bold text-primary">{i + 1}</span></div>
                <div className="flex-1"><p className="text-sm font-semibold">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            ); })}
          </div>
          <Button onClick={() => onComplete(profile.name, profile.email, createdUserId)} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-bold" data-testid="onboarding-enter-dashboard">
            Enter Government Dashboard <ArrowRight className="h-5 w-5 ml-1" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── ROLE META ────────────────────────────────────────────────────────────────

const ROLE_META: Record<UserRole, { label: string; icon: typeof Heart; subtitle: string; badge: string; badgeColor: string }> = {
  family: { label: "For Families", icon: Heart, subtitle: "Parent / Guardian onboarding", badge: "Families", badgeColor: "bg-secondary/15 text-primary" },
  clinic: { label: "For Clinics", icon: Stethoscope, subtitle: "Clinician / Doctor onboarding", badge: "Clinics", badgeColor: "bg-blue-100 text-blue-700" },
  school: { label: "For Schools", icon: GraduationCap, subtitle: "School / Educator onboarding", badge: "Schools", badgeColor: "bg-amber-100 text-amber-700" },
  government: { label: "For Government", icon: Globe, subtitle: "Government / LGU onboarding", badge: "Government", badgeColor: "bg-slate-100 text-slate-700" },
  superadmin: { label: "Platform Admin", icon: Globe, subtitle: "Internal admin onboarding", badge: "Admin", badgeColor: "bg-gray-100 text-gray-700" },
};

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const params = new URLSearchParams(window.location.search);
  const rawRole = params.get("role") ?? "family";
  const role: UserRole = (["family", "clinic", "school", "government"].includes(rawRole) ? rawRole : "family") as UserRole;
  const rawPlan = params.get("plan") ?? "care-plus";
  const planKey: PlanKey = rawPlan in FAMILY_PLANS ? (rawPlan as PlanKey) : "care-plus";

  const meta = ROLE_META[role];
  const Icon = meta.icon;

  const ROLE_STEP_LABELS: Record<UserRole, string[]> = {
    family: ["Review Plan", "Account Setup", "Welcome"],
    clinic: ["Org Details", "Plan Selection", "Admin Account", "Welcome"],
    school: ["School Details", "Plan Selection", "Admin Account", "Welcome"],
    government: ["Agency Details", "Plan Selection", "Officer Account", "Welcome"],
    superadmin: ["Access Code", "Admin Profile", "Welcome"],
  };

  function handleComplete(name: string, email: string, tier?: string, userId?: string) {
    const ROLE_DEFAULT_ROUTES: Record<UserRole, string> = {
      family: "/family", clinic: "/clinic", school: "/school", government: "/government", superadmin: "/admin",
    };
    if (!userId) return;
    login({ id: userId, name: name || `${meta.label} User`, email: email || `user@accentecx.ph`, role, tier });
    setLocation(ROLE_DEFAULT_ROUTES[role]);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <NeoBrainLogo size="sm" showTagline variant="light" />
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${meta.badgeColor}`}>
            <Icon className="h-3.5 w-3.5" />
            {meta.label}
          </div>
          <div className="text-muted-foreground text-xs">|</div>
          <div className="hidden sm:flex items-center gap-1.5">
            {ROLE_STEP_LABELS[role].map((label, i, arr) => (
              <div key={label} className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">{label}</span>
                {i < arr.length - 1 && <span className="text-muted-foreground/30 text-xs">›</span>}
              </div>
            ))}
          </div>
        </div>
        <a href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Sign in</a>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        {role === "family" && (
          <ParentOnboarding
            planKey={planKey}
            onComplete={(name, email, tier, userId) => handleComplete(name, email, tier, userId)}
          />
        )}
        {role === "clinic" && (
          <DoctorOnboarding
            onComplete={(name, email, userId) => handleComplete(name, email, undefined, userId)}
          />
        )}
        {role === "school" && (
          <TherapistOnboarding
            onComplete={(name, email, userId) => handleComplete(name, email, undefined, userId)}
          />
        )}
        {role === "government" && (
          <AdminOnboarding
            onComplete={(name, email, userId) => handleComplete(name, email, undefined, userId)}
          />
        )}
      </main>
    </div>
  );
}
