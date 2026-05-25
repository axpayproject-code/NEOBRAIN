import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, ArrowRight, ArrowLeft, Loader2, Heart, Shield,
  Video, Brain, Calendar, Users, Stethoscope, FileText, Star, Check, X,
  ActivitySquare, Settings, GraduationCap, Building2, ClipboardList,
  BarChart3, UserCheck, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, type UserRole } from "@/contexts/AuthContext";

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
    features: ["1 child profile", "Basic developmental screening (2×/year)", "Milestone tracking dashboard", "Text-based AI developmental summary", "Parent resource library", "Email support"],
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
    features: ["Up to 4 child profiles", "Full AI clinical report with risk scoring", "Full developmental screening (unlimited)", "Video behavioral analysis (up to 3/month)", "Therapy plan tracking", "School input system (teacher reports)", "Specialist messaging", "Priority email + chat support"],
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
    features: ["Unlimited child profiles", "Full AI clinical reports with risk scoring", "Unlimited video behavioral analysis", "Therapy plan tracking + automation", "School input system", "Priority AI processing", "Specialist messaging (priority queue)", "Advanced clinical reports & PDF exports", "Dedicated family support manager", "24/7 support"],
    excluded: [],
    quickStart: [
      { icon: Users, label: "Add all your children", desc: "Unlimited profiles, one family account" },
      { icon: Brain, label: "Run full AI screenings", desc: "5-domain clinical intake" },
      { icon: Video, label: "Submit video sessions", desc: "Unlimited behavioral video analysis" },
      { icon: Stethoscope, label: "Connect with specialists", desc: "Priority access to developmental pediatricians" },
      { icon: FileText, label: "Download clinical reports", desc: "PDF-ready reports for doctors and schools" },
    ],
  },
};
type PlanKey = keyof typeof FAMILY_PLANS;

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

function ParentOnboarding({ planKey, onComplete }: { planKey: PlanKey; onComplete: (name: string, email: string, tier: string) => void }) {
  const plan = FAMILY_PLANS[planKey] ?? FAMILY_PLANS["care-plus"];
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({ name: "", email: "", childName: "", guardianType: "Parent" });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(err => ({ ...err, [e.target.name]: "" }));
  }

  async function handleAccountSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e: Partial<typeof form> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.includes("@")) e.email = "A valid email address is required";
    if (!form.childName.trim()) e.childName = "Child's name is required";
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    setStep(3);
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
                <a key={key} href={`/onboarding?role=parent&plan=${key}`}
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
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="rounded-full px-5 h-12"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
              <Button type="submit" disabled={submitting} className="flex-1 h-12 rounded-full bg-primary text-primary-foreground font-semibold" data-testid="onboarding-create-account">
                {submitting ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Setting up…</span> : <span className="flex items-center gap-2">Create My Account <ArrowRight className="h-4 w-4" /></span>}
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to ACCENTECX AI CARE!</h1>
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
          <Button onClick={() => onComplete(form.name, form.email, planKey)} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-bold text-base" data-testid="onboarding-enter-dashboard">
            Enter My Dashboard <ArrowRight className="h-5 w-5 ml-1" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── DOCTOR ONBOARDING ─────────────────────────────────────────────────────────

function DoctorOnboarding({ onComplete }: { onComplete: (name: string, email: string) => void }) {
  const [step, setStep] = useState<Step>(1);
  const [clinic, setClinic] = useState({ name: "", type: "", province: "", email: "" });
  const [profile, setProfile] = useState({ name: "", specialty: "", license: "", phone: "", email: "" });
  const [clinicErrors, setClinicErrors] = useState<Partial<typeof clinic>>({});
  const [profileErrors, setProfileErrors] = useState<Partial<typeof profile>>({});
  const [submitting, setSubmitting] = useState(false);

  function handleClinicChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setClinic(f => ({ ...f, [e.target.name]: e.target.value }));
    setClinicErrors(err => ({ ...err, [e.target.name]: "" }));
  }
  function handleProfileChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setProfile(f => ({ ...f, [e.target.name]: e.target.value }));
    setProfileErrors(err => ({ ...err, [e.target.name]: "" }));
  }

  function submitClinic(e: React.FormEvent) {
    e.preventDefault();
    const errs: Partial<typeof clinic> = {};
    if (!clinic.name.trim()) errs.name = "Required";
    if (!clinic.type) errs.type = "Required";
    if (!clinic.province) errs.province = "Required";
    if (Object.keys(errs).length) { setClinicErrors(errs); return; }
    setStep(2);
  }

  async function submitProfile(e: React.FormEvent) {
    e.preventDefault();
    const errs: Partial<typeof profile> = {};
    if (!profile.name.trim()) errs.name = "Required";
    if (!profile.specialty) errs.specialty = "Required";
    if (!profile.email.includes("@")) errs.email = "Valid email required";
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    setStep(3);
  }

  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  return (
    <AnimatePresence mode="wait">
      {step === 1 && (
        <motion.div key="d1" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-7">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1.5 mb-4">
              <Stethoscope className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-xs font-semibold text-blue-700">Clinic SaaS Setup</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Set up your clinic</h1>
            <p className="text-muted-foreground">Tell us about your practice — we'll configure your workspace accordingly.</p>
          </div>

          <form onSubmit={submitClinic} className="space-y-5">
            <div className="rounded-2xl border bg-card p-6 space-y-4">
              <p className="text-sm font-semibold">Clinic / Practice Information</p>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Clinic / Practice Name <span className="text-red-500">*</span></Label>
                <Input name="name" placeholder="Children's Developmental Clinic Manila" value={clinic.name} onChange={handleClinicChange} className={`h-11 ${clinicErrors.name ? "border-red-400" : ""}`} data-testid="onboarding-clinic-name" />
                {clinicErrors.name && <p className="text-red-500 text-xs">{clinicErrors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Clinic Type <span className="text-red-500">*</span></Label>
                  <select name="type" value={clinic.type} onChange={handleClinicChange} className={`w-full h-11 rounded-md border px-3 text-sm bg-background ${clinicErrors.type ? "border-red-400" : "border-input"}`}>
                    <option value="">Select type…</option>
                    <option>Solo Practice (1 doctor)</option>
                    <option>Small Clinic (2–5 doctors)</option>
                    <option>Multi-Doctor Center (6–15)</option>
                    <option>Hospital / Large Network</option>
                  </select>
                  {clinicErrors.type && <p className="text-red-500 text-xs">{clinicErrors.type}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Province / Region <span className="text-red-500">*</span></Label>
                  <select name="province" value={clinic.province} onChange={handleClinicChange} className={`w-full h-11 rounded-md border px-3 text-sm bg-background ${clinicErrors.province ? "border-red-400" : "border-input"}`}>
                    <option value="">Select province…</option>
                    {PROVINCES.map(p => <option key={p}>{p}</option>)}
                  </select>
                  {clinicErrors.province && <p className="text-red-500 text-xs">{clinicErrors.province}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Clinic Email (optional)</Label>
                <Input name="email" type="email" placeholder="clinic@example.com" value={clinic.email} onChange={handleClinicChange} className="h-11" />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">WHAT YOU'LL GET</p>
              <div className="grid grid-cols-2 gap-1.5">
                {["Multi-doctor role access controls", "AI clinical intake dashboard", "Patient risk triage queue", "Video review with AI behavioral flags", "Clinic-level analytics", "Integrated telehealth", "Parent portal integration", "EHR export support"].map(f => (
                  <div key={f} className="flex items-center gap-1.5 text-xs"><Check className="h-3 w-3 text-secondary shrink-0" />{f}</div>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold" data-testid="onboarding-clinic-next">
              Continue <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div key="d2" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-7">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Your professional details</h1>
            <p className="text-muted-foreground">Registering for: <strong className="text-foreground">{clinic.name}</strong></p>
          </div>
          <form onSubmit={submitProfile} className="space-y-5">
            <div className="rounded-2xl border bg-card p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Full Name (Dr.) <span className="text-red-500">*</span></Label>
                <Input name="name" placeholder="Dr. Juan dela Cruz" value={profile.name} onChange={handleProfileChange} className={`h-11 ${profileErrors.name ? "border-red-400" : ""}`} data-testid="onboarding-doctor-name" />
                {profileErrors.name && <p className="text-red-500 text-xs">{profileErrors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Medical Specialty <span className="text-red-500">*</span></Label>
                <select name="specialty" value={profile.specialty} onChange={handleProfileChange} className={`w-full h-11 rounded-md border px-3 text-sm bg-background ${profileErrors.specialty ? "border-red-400" : "border-input"}`}>
                  <option value="">Select specialty…</option>
                  {MEDICAL_SPECIALTIES.map(s => <option key={s}>{s}</option>)}
                </select>
                {profileErrors.specialty && <p className="text-red-500 text-xs">{profileErrors.specialty}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">PRC License Number</Label>
                  <Input name="license" placeholder="0123456" value={profile.license} onChange={handleProfileChange} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Mobile / Phone</Label>
                  <Input name="phone" placeholder="+63 9XX XXX XXXX" value={profile.phone} onChange={handleProfileChange} className="h-11" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Work Email <span className="text-red-500">*</span></Label>
                <Input name="email" type="email" placeholder="doctor@clinic.ph" value={profile.email} onChange={handleProfileChange} className={`h-11 ${profileErrors.email ? "border-red-400" : ""}`} data-testid="onboarding-doctor-email" />
                {profileErrors.email && <p className="text-red-500 text-xs">{profileErrors.email}</p>}
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="rounded-full px-5 h-12"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
              <Button type="submit" disabled={submitting} className="flex-1 h-12 rounded-full bg-primary text-primary-foreground font-semibold" data-testid="onboarding-doctor-submit">
                {submitting ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Setting up clinic…</span> : <span className="flex items-center gap-2">Create Clinic Account <ArrowRight className="h-4 w-4" /></span>}
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div key="d3" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-7">
          <div className="text-center">
            <div className="flex justify-center mb-5"><div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/20"><CheckCircle2 className="h-10 w-10 text-secondary" /></div></div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Your clinic is ready!</h1>
            <p className="text-muted-foreground"><strong className="text-foreground">{clinic.name}</strong> has been set up on ACCENTECX AI CARE.</p>
          </div>
          <div className="rounded-2xl border border-secondary/30 bg-secondary/10 p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/20"><Building2 className="h-6 w-6 text-primary" /></div>
            <div>
              <p className="font-bold">{clinic.name}</p>
              <p className="text-sm text-muted-foreground">{clinic.type} · {clinic.province} · Clinic SaaS</p>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold">Quick-start checklist</p>
            {[
              { icon: Users, label: "Add your first patient", desc: "Create a child profile and start tracking" },
              { icon: ClipboardList, label: "Run your first AI intake", desc: "Use the clinical screening engine" },
              { icon: BarChart3, label: "Review your risk dashboard", desc: "See AI-computed domain risk levels" },
              { icon: UserCheck, label: "Invite your care team", desc: "Add therapists and nurses to your clinic" },
            ].map((item, i) => {
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
          <Button onClick={() => onComplete(profile.name, profile.email)} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-bold" data-testid="onboarding-enter-dashboard">
            Enter Clinical Dashboard <ArrowRight className="h-5 w-5 ml-1" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── THERAPIST ONBOARDING ──────────────────────────────────────────────────────

function TherapistOnboarding({ onComplete }: { onComplete: (name: string, email: string) => void }) {
  const [step, setStep] = useState<Step>(1);
  const [joinMode, setJoinMode] = useState<"clinic" | "independent">("clinic");
  const [clinicCode, setClinicCode] = useState("");
  const [clinicCodeError, setClinicCodeError] = useState("");
  const [profile, setProfile] = useState({ name: "", specialty: "", license: "", email: "", phone: "" });
  const [profileErrors, setProfileErrors] = useState<Partial<typeof profile>>({});
  const [submitting, setSubmitting] = useState(false);

  function handleProfileChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setProfile(f => ({ ...f, [e.target.name]: e.target.value }));
    setProfileErrors(err => ({ ...err, [e.target.name]: "" }));
  }

  function submitStep1(e: React.FormEvent) {
    e.preventDefault();
    if (joinMode === "clinic" && clinicCode.trim().length < 4) {
      setClinicCodeError("Please enter a valid clinic access code (at least 4 characters)");
      return;
    }
    setStep(2);
  }

  async function submitProfile(e: React.FormEvent) {
    e.preventDefault();
    const errs: Partial<typeof profile> = {};
    if (!profile.name.trim()) errs.name = "Required";
    if (!profile.specialty) errs.specialty = "Required";
    if (!profile.email.includes("@")) errs.email = "Valid email required";
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    setStep(3);
  }

  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  return (
    <AnimatePresence mode="wait">
      {step === 1 && (
        <motion.div key="t1" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-7">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 mb-4">
              <ActivitySquare className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-xs font-semibold text-amber-700">Therapist Setup</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">How will you use the platform?</h1>
            <p className="text-muted-foreground">Join an existing clinic or register as an independent therapist.</p>
          </div>

          <form onSubmit={submitStep1} className="space-y-5">
            <div className="space-y-3">
              <button type="button" onClick={() => setJoinMode("clinic")}
                className={`w-full flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all ${joinMode === "clinic" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                data-testid="therapist-join-clinic">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${joinMode === "clinic" ? "bg-primary" : "bg-muted"}`}>
                  <Building2 className={`h-5 w-5 ${joinMode === "clinic" ? "text-primary-foreground" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="font-bold text-foreground">Join an existing clinic</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Your clinic admin has sent you an access code. Enter it to connect your account to their system.</p>
                </div>
                {joinMode === "clinic" && <Check className="h-5 w-5 text-primary shrink-0 mt-1" />}
              </button>

              <button type="button" onClick={() => setJoinMode("independent")}
                className={`w-full flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all ${joinMode === "independent" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                data-testid="therapist-independent">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${joinMode === "independent" ? "bg-primary" : "bg-muted"}`}>
                  <UserCheck className={`h-5 w-5 ${joinMode === "independent" ? "text-primary-foreground" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="font-bold text-foreground">Register as independent therapist</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Set up your own therapy workspace. You can connect to clinics and accept patient referrals later.</p>
                </div>
                {joinMode === "independent" && <Check className="h-5 w-5 text-primary shrink-0 mt-1" />}
              </button>
            </div>

            <AnimatePresence>
              {joinMode === "clinic" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                  <Label className="text-xs font-semibold">Clinic Access Code <span className="text-red-500">*</span></Label>
                  <Input value={clinicCode} onChange={e => { setClinicCode(e.target.value); setClinicCodeError(""); }}
                    placeholder="e.g. CLINIC-2024-XY" className={`h-11 bg-background ${clinicCodeError ? "border-red-400" : ""}`}
                    data-testid="therapist-clinic-code" />
                  {clinicCodeError && <p className="text-red-500 text-xs">{clinicCodeError}</p>}
                  <p className="text-xs text-muted-foreground">Ask your clinic admin for the access code from the Admin Dashboard → Team Management section.</p>
                </motion.div>
              )}
            </AnimatePresence>

            <Button type="submit" className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold" data-testid="therapist-step1-next">
              Continue <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div key="t2" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-7">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Your professional details</h1>
            <p className="text-muted-foreground">{joinMode === "clinic" ? `Joining clinic with code: ${clinicCode}` : "Setting up as an independent therapist"}</p>
          </div>
          <form onSubmit={submitProfile} className="space-y-5">
            <div className="rounded-2xl border bg-card p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Full Name <span className="text-red-500">*</span></Label>
                <Input name="name" placeholder="Ana Rivera" value={profile.name} onChange={handleProfileChange} className={`h-11 ${profileErrors.name ? "border-red-400" : ""}`} data-testid="therapist-name" />
                {profileErrors.name && <p className="text-red-500 text-xs">{profileErrors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Therapy Specialty <span className="text-red-500">*</span></Label>
                <select name="specialty" value={profile.specialty} onChange={handleProfileChange} className={`w-full h-11 rounded-md border px-3 text-sm bg-background ${profileErrors.specialty ? "border-red-400" : "border-input"}`}>
                  <option value="">Select specialty…</option>
                  {THERAPY_TYPES.map(s => <option key={s}>{s}</option>)}
                </select>
                {profileErrors.specialty && <p className="text-red-500 text-xs">{profileErrors.specialty}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">License / Registration No.</Label>
                  <Input name="license" placeholder="e.g. RLP-2020-XXXXX" value={profile.license} onChange={handleProfileChange} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Mobile / Phone</Label>
                  <Input name="phone" placeholder="+63 9XX XXX XXXX" value={profile.phone} onChange={handleProfileChange} className="h-11" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Email Address <span className="text-red-500">*</span></Label>
                <Input name="email" type="email" placeholder="therapist@example.com" value={profile.email} onChange={handleProfileChange} className={`h-11 ${profileErrors.email ? "border-red-400" : ""}`} data-testid="therapist-email" />
                {profileErrors.email && <p className="text-red-500 text-xs">{profileErrors.email}</p>}
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="rounded-full px-5 h-12"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
              <Button type="submit" disabled={submitting} className="flex-1 h-12 rounded-full bg-primary text-primary-foreground font-semibold" data-testid="therapist-submit">
                {submitting ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</span> : <span className="flex items-center gap-2">Create Account <ArrowRight className="h-4 w-4" /></span>}
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div key="t3" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-7">
          <div className="text-center">
            <div className="flex justify-center mb-5"><div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/20"><CheckCircle2 className="h-10 w-10 text-secondary" /></div></div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Therapy workspace ready!</h1>
            <p className="text-muted-foreground">Welcome, <strong className="text-foreground">{profile.name}</strong>. Your {profile.specialty} workspace is set up.</p>
          </div>
          {joinMode === "clinic" && (
            <div className="rounded-2xl border border-secondary/30 bg-secondary/10 p-4 flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary shrink-0" />
              <div><p className="text-sm font-bold text-foreground">Connected to clinic</p><p className="text-xs text-muted-foreground">Access code: {clinicCode} · Pending clinic admin approval</p></div>
            </div>
          )}
          <div className="space-y-3">
            <p className="text-sm font-semibold">Quick-start checklist</p>
            {[
              { icon: ClipboardList, label: "Review your assigned patients", desc: "See patient profiles and screening results" },
              { icon: FileText, label: "Create your first therapy plan", desc: "Build a structured 8-week program" },
              { icon: Calendar, label: "Schedule your sessions", desc: "Set up recurring therapy appointments" },
              { icon: BarChart3, label: "Track progress over time", desc: "Monitor goal achievement and report to clinic" },
            ].map((item, i) => {
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
          <Button onClick={() => onComplete(profile.name, profile.email)} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-bold" data-testid="onboarding-enter-dashboard">
            Enter Therapy Dashboard <ArrowRight className="h-5 w-5 ml-1" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── ADMIN ONBOARDING ──────────────────────────────────────────────────────────

function AdminOnboarding({ onComplete }: { onComplete: (name: string, email: string) => void }) {
  const [step, setStep] = useState<Step>(1);
  const [access, setAccess] = useState({ inviteCode: "", orgName: "", orgType: "" });
  const [accessErrors, setAccessErrors] = useState<Partial<typeof access>>({});
  const [adminProfile, setAdminProfile] = useState({ name: "", email: "", title: "" });
  const [profileErrors, setProfileErrors] = useState<Partial<typeof adminProfile>>({});
  const [submitting, setSubmitting] = useState(false);
  const [noCode, setNoCode] = useState(false);

  function handleAccessChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setAccess(f => ({ ...f, [e.target.name]: e.target.value }));
    setAccessErrors(err => ({ ...err, [e.target.name]: "" }));
  }
  function handleProfileChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setAdminProfile(f => ({ ...f, [e.target.name]: e.target.value }));
    setProfileErrors(err => ({ ...err, [e.target.name]: "" }));
  }

  function submitAccess(e: React.FormEvent) {
    e.preventDefault();
    if (noCode) { setStep(2); return; }
    const errs: Partial<typeof access> = {};
    if (!access.inviteCode.trim()) errs.inviteCode = "Invite code required";
    if (!access.orgName.trim()) errs.orgName = "Required";
    if (!access.orgType) errs.orgType = "Required";
    if (Object.keys(errs).length) { setAccessErrors(errs); return; }
    setStep(2);
  }

  async function submitProfile(e: React.FormEvent) {
    e.preventDefault();
    const errs: Partial<typeof adminProfile> = {};
    if (!adminProfile.name.trim()) errs.name = "Required";
    if (!adminProfile.email.includes("@")) errs.email = "Valid email required";
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    setStep(3);
  }

  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  return (
    <AnimatePresence mode="wait">
      {step === 1 && (
        <motion.div key="a1" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-7">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-500/10 px-4 py-1.5 mb-4">
              <Settings className="h-3.5 w-3.5 text-slate-600" />
              <span className="text-xs font-semibold text-slate-700">Platform Admin Setup</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Verify platform access</h1>
            <p className="text-muted-foreground">Admin access requires an invite code from ACCENTECX or your organization's system administrator.</p>
          </div>

          <form onSubmit={submitAccess} className="space-y-5">
            <div className="rounded-2xl border bg-card p-6 space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
                <Lock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">Admin accounts have full platform access including all clinic, school, and patient data. Only authorized personnel should proceed.</p>
              </div>

              {!noCode ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Admin Invite Code <span className="text-red-500">*</span></Label>
                    <Input name="inviteCode" placeholder="ADMIN-XXXX-XXXX" value={access.inviteCode} onChange={handleAccessChange}
                      className={`h-11 font-mono tracking-wider ${accessErrors.inviteCode ? "border-red-400" : ""}`} data-testid="admin-invite-code" />
                    {accessErrors.inviteCode && <p className="text-red-500 text-xs">{accessErrors.inviteCode}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Organization Name <span className="text-red-500">*</span></Label>
                    <Input name="orgName" placeholder="ACCENTECX Health Systems" value={access.orgName} onChange={handleAccessChange}
                      className={`h-11 ${accessErrors.orgName ? "border-red-400" : ""}`} />
                    {accessErrors.orgName && <p className="text-red-500 text-xs">{accessErrors.orgName}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Organization Type <span className="text-red-500">*</span></Label>
                    <select name="orgType" value={access.orgType} onChange={handleAccessChange}
                      className={`w-full h-11 rounded-md border px-3 text-sm bg-background ${accessErrors.orgType ? "border-red-400" : "border-input"}`}>
                      <option value="">Select type…</option>
                      <option>Clinic Network</option><option>School System</option>
                      <option>Government / LGU</option><option>Healthcare Provider Network</option><option>ACCENTECX Internal</option>
                    </select>
                    {accessErrors.orgType && <p className="text-red-500 text-xs">{accessErrors.orgType}</p>}
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-border bg-muted/30 p-4 text-center space-y-2">
                  <p className="text-sm font-semibold text-foreground">Access Request Submitted</p>
                  <p className="text-xs text-muted-foreground">Our team will review your request and send an invite code to your work email within 1 business day.</p>
                  <p className="text-xs text-muted-foreground">Meanwhile, you can use the demo mode on the login page to explore the admin dashboard.</p>
                </div>
              )}

              <button type="button" onClick={() => setNoCode(!noCode)} className="text-xs text-primary hover:underline">
                {noCode ? "← I have an invite code" : "I don't have an invite code — request access"}
              </button>
            </div>

            <Button type="submit" className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold" data-testid="admin-access-next">
              {noCode ? "Request Admin Access" : "Verify & Continue"} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div key="a2" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-7">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin profile</h1>
            <p className="text-muted-foreground">Your identity and contact details for the platform.</p>
          </div>
          <form onSubmit={submitProfile} className="space-y-5">
            <div className="rounded-2xl border bg-card p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Full Name <span className="text-red-500">*</span></Label>
                <Input name="name" placeholder="Jose Santos" value={adminProfile.name} onChange={handleProfileChange} className={`h-11 ${profileErrors.name ? "border-red-400" : ""}`} data-testid="admin-name" />
                {profileErrors.name && <p className="text-red-500 text-xs">{profileErrors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Work Email <span className="text-red-500">*</span></Label>
                <Input name="email" type="email" placeholder="admin@organization.ph" value={adminProfile.email} onChange={handleProfileChange} className={`h-11 ${profileErrors.email ? "border-red-400" : ""}`} data-testid="admin-email" />
                {profileErrors.email && <p className="text-red-500 text-xs">{profileErrors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Job Title</Label>
                <Input name="title" placeholder="e.g. Health Systems Director" value={adminProfile.title} onChange={handleProfileChange} className="h-11" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="rounded-full px-5 h-12"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
              <Button type="submit" disabled={submitting} className="flex-1 h-12 rounded-full bg-primary text-primary-foreground font-semibold" data-testid="admin-submit">
                {submitting ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Setting up admin access…</span> : <span className="flex items-center gap-2">Complete Setup <ArrowRight className="h-4 w-4" /></span>}
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div key="a3" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className="space-y-7">
          <div className="text-center">
            <div className="flex justify-center mb-5"><div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/20"><CheckCircle2 className="h-10 w-10 text-secondary" /></div></div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin access granted!</h1>
            <p className="text-muted-foreground">Welcome, <strong className="text-foreground">{adminProfile.name}</strong>. You have full platform administrative access.</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <Lock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div><p className="text-sm font-bold text-amber-800">High-privilege access</p><p className="text-xs text-amber-700">You can manage all clinics, schools, users, and view aggregate patient analytics. Use with care and in compliance with RA 10173 (Data Privacy Act).</p></div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold">Quick-start checklist</p>
            {[
              { icon: BarChart3, label: "Review platform analytics", desc: "See summary stats, risk distribution, and activity" },
              { icon: Building2, label: "Manage clinics and schools", desc: "Add, verify, and configure registered organizations" },
              { icon: Users, label: "Monitor user accounts", desc: "Review all parent, doctor, and therapist accounts" },
              { icon: GraduationCap, label: "Configure system settings", desc: "Set thresholds, roles, and data access policies" },
            ].map((item, i) => {
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
          <Button onClick={() => onComplete(adminProfile.name, adminProfile.email)} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-bold" data-testid="onboarding-enter-dashboard">
            Enter Admin Dashboard <ArrowRight className="h-5 w-5 ml-1" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── ROLE META ────────────────────────────────────────────────────────────────

const ROLE_META: Record<UserRole, { label: string; icon: typeof Heart; subtitle: string; badge: string; badgeColor: string }> = {
  parent: { label: "Family Care", icon: Heart, subtitle: "Parent / Guardian onboarding", badge: "B2C", badgeColor: "bg-secondary/15 text-primary" },
  doctor: { label: "Clinic SaaS", icon: Stethoscope, subtitle: "Clinician / Doctor onboarding", badge: "Clinical", badgeColor: "bg-blue-100 text-blue-700" },
  therapist: { label: "Therapy System", icon: ActivitySquare, subtitle: "Therapist / Educator onboarding", badge: "Therapy", badgeColor: "bg-amber-100 text-amber-700" },
  admin: { label: "Admin Dashboard", icon: Settings, subtitle: "Platform Admin onboarding", badge: "Admin", badgeColor: "bg-slate-100 text-slate-700" },
};

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const params = new URLSearchParams(window.location.search);
  const rawRole = params.get("role") ?? "parent";
  const role: UserRole = (["parent", "doctor", "therapist", "admin"].includes(rawRole) ? rawRole : "parent") as UserRole;
  const rawPlan = params.get("plan") ?? "care-plus";
  const planKey: PlanKey = rawPlan in FAMILY_PLANS ? (rawPlan as PlanKey) : "care-plus";

  const meta = ROLE_META[role];
  const Icon = meta.icon;

  const ROLE_STEP_LABELS: Record<UserRole, [string, string, string]> = {
    parent: ["Review Plan", "Account Setup", "Welcome"],
    doctor: ["Clinic Info", "Your Details", "Welcome"],
    therapist: ["Join Method", "Your Details", "Welcome"],
    admin: ["Access Code", "Admin Profile", "Welcome"],
  };

  function handleComplete(name: string, email: string, tier?: string) {
    const ROLE_DEFAULT_ROUTES: Record<UserRole, string> = {
      parent: "/parent", doctor: "/doctor", therapist: "/therapist", admin: "/admin",
    };
    login({ name: name || `${meta.label} User`, email: email || `user@accentecx.ph`, role, tier });
    setLocation(ROLE_DEFAULT_ROUTES[role]);
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
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${meta.badgeColor}`}>
            <Icon className="h-3.5 w-3.5" />
            {meta.label}
          </div>
          <div className="text-muted-foreground text-xs">|</div>
          <div className="hidden sm:flex items-center gap-1.5">
            {ROLE_STEP_LABELS[role].map((label, i) => (
              <div key={label} className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">{label}</span>
                {i < 2 && <span className="text-muted-foreground/30 text-xs">›</span>}
              </div>
            ))}
          </div>
        </div>
        <a href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Sign in</a>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        {role === "parent" && (
          <ParentOnboarding
            planKey={planKey}
            onComplete={(name, email, tier) => handleComplete(name, email, tier)}
          />
        )}
        {role === "doctor" && (
          <DoctorOnboarding
            onComplete={(name, email) => handleComplete(name, email)}
          />
        )}
        {role === "therapist" && (
          <TherapistOnboarding
            onComplete={(name, email) => handleComplete(name, email)}
          />
        )}
        {role === "admin" && (
          <AdminOnboarding
            onComplete={(name, email) => handleComplete(name, email)}
          />
        )}
      </main>
    </div>
  );
}
