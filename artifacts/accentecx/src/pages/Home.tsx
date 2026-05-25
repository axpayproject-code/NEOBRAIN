import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, HeartPulse, Activity, ShieldCheck, Users, GraduationCap,
  Building2, Stethoscope, Brain, Video, BarChart3, Check, X,
  MessageSquare, ClipboardList, Calendar, LineChart, Globe, Lock,
  ChevronRight, Zap, Star
} from "lucide-react";
import { motion } from "framer-motion";
import ContactSalesModal, { type SalesAudience } from "@/components/sales/ContactSalesModal";
import LandingLiveDemo from "@/components/landing/LandingLiveDemo";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.08, ease: "easeOut" as const } }),
};

const SYSTEMS = [
  {
    num: "01",
    title: "Family Care System",
    badge: "B2C Core",
    icon: Users,
    color: "bg-secondary/15 border-secondary/30",
    desc: "Daily parental engagement through child tracking, behavioral monitoring, therapy tasks, and AI-generated progress reports accessible from any device.",
    features: ["Child developmental profiles", "Daily activity guidance", "Therapy compliance tracking", "Appointment booking", "Progress visualization"]
  },
  {
    num: "02",
    title: "Clinical System",
    badge: "Doctors",
    icon: Stethoscope,
    color: "bg-primary/5 border-primary/15",
    desc: "Structured clinical tools that give practitioners AI-generated summaries, behavioral video reviews, and longitudinal tracking — not replacing judgment, enhancing it.",
    features: ["AI intake summaries", "Structured behavioral reports", "Video analysis review", "Patient queue system", "Therapy planning tools"]
  },
  {
    num: "03",
    title: "Therapy System",
    badge: "Therapists",
    icon: Activity,
    color: "bg-secondary/15 border-secondary/30",
    desc: "End-to-end therapy management — from goal-setting and session tracking to home exercise assignments and real-time progress analytics.",
    features: ["Therapy plan creation", "Session tracking", "Goal monitoring", "Parent assignments", "Progress analytics"]
  },
  {
    num: "04",
    title: "School Integration System",
    badge: "Educators",
    icon: GraduationCap,
    color: "bg-primary/5 border-primary/15",
    desc: "Teacher observation tools integrated directly with clinical records — enabling coordinated behavioral monitoring across classroom and clinic.",
    features: ["Teacher observation forms", "Classroom behavioral scoring", "Referral triggers", "SPED tracking", "Parent-school coordination"]
  },
  {
    num: "05",
    title: "Telehealth System",
    badge: "Remote Care",
    icon: Video,
    color: "bg-secondary/15 border-secondary/30",
    desc: "Secure video consultations, asynchronous specialist messaging, and follow-up management — making expert care accessible beyond Metro Manila.",
    features: ["Video consultations", "Secure scheduling", "Session notes", "Follow-up automation", "Specialist messaging"]
  },
  {
    num: "06",
    title: "National Analytics Layer",
    badge: "DOH / LGUs",
    icon: Globe,
    color: "bg-primary/5 border-primary/15",
    desc: "Anonymized population-level intelligence enabling government health units to map regional risk clusters and allocate early intervention resources.",
    features: ["Anonymized population data", "Regional risk mapping", "Developmental trend analysis", "Intervention forecasting", "Healthcare resource planning"]
  }
];

const JOURNEY_STEPS = [
  { step: 1, icon: Users, title: "Account Creation", desc: "Parent registers and creates their household account." },
  { step: 2, icon: ClipboardList, title: "Child Profile", desc: "Input age, language, developmental concerns, and medical history." },
  { step: 3, icon: Brain, title: "Structured Screening", desc: "Adaptive questionnaire across 6 developmental domains." },
  { step: 4, icon: Video, title: "Video Assessment", desc: "Guided structured behavioral tasks recorded and uploaded." },
  { step: 5, icon: Activity, title: "AI Processing", desc: "Domain scoring, behavioral cluster detection, risk classification." },
  { step: 6, icon: ClipboardList, title: "Report Generation", desc: "Clinical summary + parent-friendly explanation delivered." },
  { step: 7, icon: Stethoscope, title: "Specialist Matching", desc: "Smart referral engine assigns the right specialist type." },
  { step: 8, icon: Calendar, title: "Consultation", desc: "Doctor reviews full AI intake, video, and history." },
  { step: 9, icon: HeartPulse, title: "Therapy Plan", desc: "Therapist sets goals, exercises, and tracking schedule." },
  { step: 10, icon: LineChart, title: "Long-term Tracking", desc: "Monthly AI reassessment, milestone monitoring, plan updates." }
];

const AI_LAYERS = [
  { layer: "Layer 1", title: "Data Collection Engine", icon: ClipboardList, desc: "Questionnaires, video uploads, teacher input, therapist entries — all structured and normalized." },
  { layer: "Layer 2", title: "Feature Extraction Engine", icon: Video, desc: "From video: gaze tracking, motion detection, gesture frequency, speech presence, interaction analysis." },
  { layer: "Layer 3", title: "Rule-Based Clinical Engine", icon: ShieldCheck, desc: "DSM-aligned logic, validated screening thresholds, structured scoring systems." },
  { layer: "Layer 4", title: "ML Pattern Engine", icon: Brain, desc: "Behavioral clustering, developmental trajectory modeling, anomaly detection across history." },
  { layer: "Layer 5", title: "Report Generation Engine", icon: MessageSquare, desc: "Clinical documentation, parent-simplified summaries, doctor-ready structured reports." }
];

const B2C_TIERS = [
  {
    name: "Starter Care",
    price: "₱200",
    period: "/month",
    tagline: "For families just getting started",
    highlight: false,
    features: [
      "1 child profile",
      "Basic developmental screening",
      "AI summary report (text only)",
      "Appointment booking",
      "Milestone tracking"
    ],
    excluded: ["Video behavioral analysis", "School input system", "Specialist messaging", "Therapy automation"]
  },
  {
    name: "Care Plus",
    price: "₱799",
    period: "/month",
    tagline: "For active care management",
    highlight: true,
    badge: "Most Popular",
    features: [
      "Up to 4 child profiles",
      "Full screening engine",
      "Video behavioral analysis",
      "Therapy plan tracking",
      "School input system",
      "Specialist messaging"
    ],
    excluded: ["Priority AI processing", "Therapy automation", "Priority specialist access"]
  },
  {
    name: "Care Family Pro",
    price: "₱1,999",
    period: "/month",
    tagline: "For families who need everything",
    highlight: false,
    badge: "Premium",
    features: [
      "Unlimited children",
      "Priority AI processing",
      "Full video analytics suite",
      "Advanced clinical reports",
      "Therapy automation",
      "Priority specialist access"
    ],
    excluded: []
  }
];

const B2B_TIERS = [
  {
    name: "Clinic SaaS",
    price: "₱4,999 – ₱19,999",
    period: "/month",
    tagline: "For clinics and multi-doctor practices",
    icon: Stethoscope,
    features: [
      "Multi-doctor system",
      "AI intake dashboard",
      "Patient queue management",
      "Video review tools",
      "Clinic-level analytics",
      "Integrated telehealth"
    ],
    note: "Pricing scales with number of providers and clinic size"
  },
  {
    name: "School Licensing",
    price: "₱10 – ₱50",
    period: "/student/year",
    tagline: "For schools and SPED programs",
    icon: GraduationCap,
    features: [
      "Student screening system",
      "Teacher behavioral reporting",
      "SPED tracking tools",
      "Referral engine",
      "Parent-school coordination",
      "Aggregate school analytics"
    ],
    note: "Volume pricing available for large school networks"
  },
  {
    name: "Government / LGU",
    price: "Custom",
    period: "pricing",
    tagline: "For DOH, LGUs, and research institutions",
    icon: Globe,
    features: [
      "Regional deployment",
      "Anonymized population analytics",
      "Early intervention forecasting",
      "Healthcare resource mapping",
      "Research data access",
      "Dedicated implementation team"
    ],
    note: "Contract-based. Contact for regional program pricing"
  }
];

const USAGE_FEES = [
  { feature: "Video AI behavioral analysis", cost: "₱20 – ₱50", desc: "Per video session analyzed" },
  { feature: "AI clinical report generation", cost: "₱10 – ₱20", desc: "Per structured report output" },
  { feature: "Advanced behavioral ML model", cost: "₱15", desc: "Per deep pattern analysis run" }
];

const DOMAINS = [
  { name: "Communication", score: 78, color: "bg-chart-1" },
  { name: "Social Interaction", score: 64, color: "bg-chart-3" },
  { name: "Attention", score: 52, color: "bg-chart-4" },
  { name: "Motor Skills", score: 85, color: "bg-secondary" },
  { name: "Emotional Regulation", score: 59, color: "bg-chart-5" }
];

const PRICING_TABS = [
  { id: "families", label: "For Families", icon: Users },
  { id: "clinics", label: "For Clinics", icon: Stethoscope },
  { id: "schools", label: "For Schools", icon: GraduationCap },
  { id: "government", label: "For Government", icon: Globe },
] as const;

type PricingTab = (typeof PRICING_TABS)[number]["id"];

const PLAN_SLUGS: Record<string, string> = {
  "Starter Care": "starter-care",
  "Care Plus": "care-plus",
  "Care Family Pro": "care-family-pro",
};

function PricingSection() {
  const [activeTab, setActiveTab] = useState<PricingTab>("families");
  const [salesModal, setSalesModal] = useState<{ open: boolean; audience: SalesAudience }>({
    open: false, audience: "clinics",
  });

  function openSales(audience: SalesAudience) {
    setSalesModal({ open: true, audience });
  }

  return (
    <section id="pricing" className="py-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-secondary font-semibold text-sm uppercase tracking-wider mb-3">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-5">
            Every family. Every clinic. Every school.
          </h2>
          <p className="text-lg text-muted-foreground">
            Transparent pricing tailored for each role — select your audience below.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-1 rounded-full bg-muted border border-border p-1.5">
            {PRICING_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                data-testid={`pricing-tab-${id}`}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  activeTab === id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── FAMILIES TAB ─────────────────────────────────────────────── */}
        {activeTab === "families" && (
          <div className="space-y-10">
            <div className="grid md:grid-cols-3 gap-6">
              {B2C_TIERS.map((tier, i) => (
                <motion.div
                  key={tier.name}
                  variants={fadeUp} initial="hidden" animate="visible"
                  custom={i * 0.12}
                  className={`relative rounded-2xl border p-7 flex flex-col gap-5 ${
                    tier.highlight
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border"
                  }`}
                  data-testid={`card-pricing-b2c-${i + 1}`}
                >
                  {tier.badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold ${
                      tier.highlight ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
                    }`}>
                      {tier.badge}
                    </div>
                  )}
                  <div>
                    <div className={`text-sm font-semibold mb-1 ${tier.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{tier.name}</div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-bold ${tier.highlight ? "text-primary-foreground" : "text-foreground"}`}>{tier.price}</span>
                      <span className={`text-sm ${tier.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{tier.period}</span>
                    </div>
                    <div className={`text-sm mt-1 ${tier.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{tier.tagline}</div>
                  </div>
                  <ul className="space-y-2.5 flex-1">
                    {tier.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 shrink-0 text-secondary" />
                        <span className={tier.highlight ? "text-primary-foreground" : "text-foreground"}>{f}</span>
                      </li>
                    ))}
                    {tier.excluded.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm opacity-35">
                        <X className="h-4 w-4 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={`/onboarding?plan=${PLAN_SLUGS[tier.name] ?? "care-plus"}`}>
                    <Button
                      className={`w-full rounded-full ${tier.highlight ? "bg-secondary text-secondary-foreground hover:bg-secondary/90" : ""}`}
                      variant={tier.highlight ? "default" : "outline"}
                      data-testid={`button-pricing-b2c-${i + 1}`}
                    >
                      Get Started — {tier.price}/mo
                    </Button>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Feature Comparison Table */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-muted/30">
                <p className="text-sm font-semibold text-foreground">Feature Comparison</p>
                <p className="text-xs text-muted-foreground">See exactly what's included in each plan</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-1/3">Feature</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Starter ₱200</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-primary uppercase tracking-wider bg-primary/5">Care Plus ₱799</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Family Pro ₱1,999</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: "Child profiles", starter: "1 child", plus: "Up to 4", pro: "Unlimited" },
                      { feature: "Developmental screenings", starter: "Basic (2×/yr)", plus: "Full (unlimited)", pro: "Full (unlimited)" },
                      { feature: "AI developmental report", starter: "Text summary", plus: "Full + risk score", pro: "Full + risk score" },
                      { feature: "Video behavioral analysis", starter: false, plus: "Up to 3/month", pro: "Unlimited" },
                      { feature: "Therapy plan tracking", starter: false, plus: true, pro: true },
                      { feature: "School input system", starter: false, plus: true, pro: true },
                      { feature: "Specialist messaging", starter: false, plus: "Standard queue", pro: "Priority queue" },
                      { feature: "Priority AI processing", starter: false, plus: false, pro: true },
                      { feature: "Advanced clinical reports", starter: false, plus: false, pro: true },
                      { feature: "Therapy automation", starter: false, plus: false, pro: true },
                      { feature: "Dedicated support manager", starter: false, plus: false, pro: true },
                    ].map((row, i) => (
                      <tr key={row.feature} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                        <td className="px-6 py-3 text-foreground font-medium">{row.feature}</td>
                        {[row.starter, row.plus, row.pro].map((val, j) => (
                          <td key={j} className={`text-center px-4 py-3 ${j === 1 ? "bg-primary/5" : ""}`}>
                            {val === false ? (
                              <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                            ) : val === true ? (
                              <Check className="h-4 w-4 text-secondary mx-auto" />
                            ) : (
                              <span className="text-xs font-medium text-foreground">{val as string}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Usage-Based Add-Ons — shown under Families */}
            <div className="rounded-2xl border border-border bg-muted/30 p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 shrink-0">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Usage-Based Add-Ons</h3>
                  <p className="text-sm text-muted-foreground">Pay-per-use fees applied on top of any subscription plan for AI-intensive features.</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {USAGE_FEES.map(fee => (
                  <div key={fee.feature} className="rounded-xl bg-background border border-border p-5" data-testid={`card-usage-fee-${fee.feature.toLowerCase().replace(/ /g, "-")}`}>
                    <div className="text-xl font-bold text-foreground mb-1">{fee.cost}</div>
                    <div className="text-sm font-semibold text-foreground mb-1">{fee.feature}</div>
                    <div className="text-xs text-muted-foreground">{fee.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CLINICS TAB ──────────────────────────────────────────────── */}
        {activeTab === "clinics" && (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              {/* Main plan card */}
              <div className="rounded-2xl border border-border bg-card p-8 flex flex-col gap-6" data-testid="card-pricing-b2b-1">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/15">
                    <Stethoscope className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Clinic SaaS</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">₱4,999 – ₱19,999</span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground">For clinics and multi-doctor practices. Pricing scales with number of providers and clinic size.</p>
                <ul className="space-y-3">
                  {[
                    "Multi-doctor system with role access controls",
                    "AI clinical intake dashboard",
                    "Patient queue management with risk triage",
                    "Video review tools with AI behavioral flags",
                    "Clinic-level analytics and reporting",
                    "Integrated telehealth (unlimited sessions)",
                    "Parent portal integration",
                    "EHR export support",
                  ].map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 text-secondary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => openSales("clinics")}
                  className="w-full rounded-full bg-primary text-primary-foreground"
                  data-testid="button-pricing-b2b-1"
                >
                  Request a Demo &amp; Proposal
                </Button>
              </div>

              {/* Right column: tiers breakdown + usage */}
              <div className="space-y-5">
                <div className="rounded-xl border bg-muted/30 p-6">
                  <p className="text-sm font-semibold text-foreground mb-4">Clinic Size Tiers</p>
                  <div className="space-y-3">
                    {[
                      { size: "Solo Practice", docs: "1 doctor", price: "₱4,999/mo" },
                      { size: "Small Clinic", docs: "2–5 doctors", price: "₱9,999/mo" },
                      { size: "Multi-Doctor Center", docs: "6–15 doctors", price: "₱14,999/mo" },
                      { size: "Hospital / Large Network", docs: "15+ doctors", price: "₱19,999+/mo" },
                    ].map(t => (
                      <div key={t.size} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium text-foreground">{t.size}</p>
                          <p className="text-xs text-muted-foreground">{t.docs}</p>
                        </div>
                        <span className="font-semibold text-primary">{t.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">Clinic Usage-Based Add-Ons</p>
                  </div>
                  <div className="space-y-2">
                    {USAGE_FEES.map(fee => (
                      <div key={fee.feature} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{fee.feature}</span>
                        <span className="font-semibold">{fee.cost}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── SCHOOLS TAB ──────────────────────────────────────────────── */}
        {activeTab === "schools" && (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              <div className="rounded-2xl border border-border bg-card p-8 flex flex-col gap-6" data-testid="card-pricing-b2b-2">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/15">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">School Licensing</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">₱10 – ₱50</span>
                      <span className="text-sm text-muted-foreground">/student/year</span>
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground">For schools and SPED programs. Volume pricing available for large school networks.</p>
                <ul className="space-y-3">
                  {[
                    "Student developmental screening system",
                    "Teacher behavioral observation forms",
                    "SPED tracking and IEP alignment",
                    "Referral engine with specialist routing",
                    "Parent-school coordination portal",
                    "Aggregate school analytics dashboard",
                    "Multi-grade and multi-campus support",
                    "DOH / DepEd report templates",
                  ].map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 text-secondary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => openSales("schools")}
                  className="w-full rounded-full bg-primary text-primary-foreground"
                  data-testid="button-pricing-b2b-2"
                >
                  Request a Demo &amp; Proposal
                </Button>
              </div>

              <div className="space-y-5">
                <div className="rounded-xl border bg-muted/30 p-6">
                  <p className="text-sm font-semibold text-foreground mb-4">Student Volume Tiers</p>
                  <div className="space-y-3">
                    {[
                      { range: "Up to 200 students", price: "₱50/student/yr", note: "Small schools" },
                      { range: "201 – 500 students", price: "₱35/student/yr", note: "Medium schools" },
                      { range: "501 – 2,000 students", price: "₱20/student/yr", note: "Large schools" },
                      { range: "2,000+ students / networks", price: "₱10/student/yr", note: "School networks" },
                    ].map(t => (
                      <div key={t.range} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium text-foreground">{t.range}</p>
                          <p className="text-xs text-muted-foreground">{t.note}</p>
                        </div>
                        <span className="font-semibold text-primary">{t.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-[#163300]/20 bg-[#163300]/5 p-5">
                  <p className="text-sm font-semibold text-[#163300] mb-2">Includes for all schools</p>
                  <ul className="space-y-1.5 text-sm text-[#163300]/80">
                    {["Free teacher onboarding training", "Dedicated school success manager", "DepEd-aligned report formats", "Data privacy DPA compliance tools"].map(f => (
                      <li key={f} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-secondary shrink-0" />{f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── GOVERNMENT TAB ───────────────────────────────────────────── */}
        {activeTab === "government" && (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              <div className="rounded-2xl border border-border bg-card p-8 flex flex-col gap-6" data-testid="card-pricing-b2b-3">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/15">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Government / LGU</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">Custom</span>
                      <span className="text-sm text-muted-foreground">pricing</span>
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground">For DOH, LGUs, PhilHealth, research institutions, and DSWD programs. Contract-based with regional implementation support.</p>
                <ul className="space-y-3">
                  {[
                    "Regional or province-wide deployment",
                    "Anonymized population health analytics",
                    "Early intervention forecasting models",
                    "Healthcare resource mapping by barangay",
                    "Research data access (with consent framework)",
                    "Dedicated implementation and training team",
                    "DOH and PhilHealth reporting integration",
                    "Multi-province / national rollout support",
                  ].map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 text-secondary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => openSales("government")}
                  className="w-full rounded-full bg-primary text-primary-foreground"
                  data-testid="button-pricing-b2b-gov"
                >
                  Contact Government Sales
                </Button>
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl border border-primary/20 bg-primary text-primary-foreground p-6">
                  <p className="text-sm font-semibold text-primary-foreground/70 mb-3">Why Government & LGU?</p>
                  <p className="text-primary-foreground/90 text-sm leading-relaxed mb-4">
                    The Philippines has over 1 million children with undiagnosed developmental conditions. NEOBRAIN gives local government units the infrastructure to identify, triage, and refer children in their communities — even in low-connectivity areas.
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Barangay-level health worker screening tools",
                      "Offline-capable data collection",
                      "Province-level risk dashboards for PHO",
                      "Direct integration with RHU workflows",
                    ].map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-primary-foreground/90">
                        <Check className="h-4 w-4 text-secondary shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border bg-muted/30 p-5">
                  <p className="text-sm font-semibold mb-3">Typical Government Engagement</p>
                  <div className="space-y-2 text-sm">
                    {[
                      { phase: "Discovery & Scoping", duration: "2–4 weeks" },
                      { phase: "Pilot Deployment", duration: "1–3 months" },
                      { phase: "Full Rollout", duration: "3–12 months" },
                      { phase: "Ongoing Support & Analytics", duration: "Continuous" },
                    ].map(p => (
                      <div key={p.phase} className="flex justify-between py-1.5 border-b last:border-0">
                        <span className="text-muted-foreground">{p.phase}</span>
                        <span className="font-medium">{p.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <ContactSalesModal
        open={salesModal.open}
        audience={salesModal.audience}
        onClose={() => setSalesModal(m => ({ ...m, open: false }))}
      />
    </section>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex h-16 items-center px-6 md:px-12 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Link href="/" className="flex items-center gap-2 text-primary font-bold text-lg">
          <HeartPulse className="h-7 w-7 text-secondary" />
          <span className="tracking-tight" style={{ fontFamily: "var(--font-display)" }}>NEOBRAIN</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 ml-10 text-sm text-muted-foreground">
          <a href="#systems" className="hover:text-foreground transition-colors">Systems</a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
          <a href="#ai" className="hover:text-foreground transition-colors">AI Engine</a>
          <a href="#live-demo" className="hover:text-foreground transition-colors font-semibold text-[#163300]">Live Demo</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          <Link href="/about" className="hover:text-foreground transition-colors">Our Story</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="hidden sm:flex rounded-full px-5 text-sm" data-testid="link-login-nav">
              Log in
            </Button>
          </Link>
          <Link href="/login">
            <Button className="rounded-full px-5 gap-2 text-sm" data-testid="link-get-started">
              Get Started <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* ── HERO ────────────────────────────────────────────────────────── */}
        <section className="px-6 py-20 md:py-28 md:px-12 max-w-7xl mx-auto grid gap-12 lg:grid-cols-2 items-center">
          <motion.div
            initial="hidden" animate="visible"
            className="flex flex-col gap-6"
          >
            <motion.div variants={fadeUp} custom={0}>
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold text-primary w-fit bg-primary/5 border-primary/10">
                <span className="flex h-2 w-2 rounded-full bg-secondary mr-2 animate-pulse"></span>
                The Philippines' National AI Developmental Health Platform
              </div>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1}
              className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tighter text-foreground"
            >
              Intelligent care for every developmental journey.
            </motion.h1>
            <motion.p variants={fadeUp} custom={2}
              className="text-lg text-muted-foreground leading-relaxed max-w-xl"
            >
              A national-scale AI-assisted infrastructure connecting parents, clinicians, therapists, schools, and government into one continuous developmental intelligence system.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-3 mt-2">
              <Link href="/login">
                <Button size="lg" className="rounded-full px-8 h-13 text-base w-full sm:w-auto gap-2" data-testid="button-join-hero">
                  Join the Ecosystem <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="rounded-full px-8 h-13 text-base w-full sm:w-auto border-primary/20" data-testid="button-clinic-demo">
                Request Clinic Demo
              </Button>
            </motion.div>
            <motion.div variants={fadeUp} custom={4}
              className="flex items-center gap-6 mt-2 text-sm text-muted-foreground"
            >
              {["Never diagnoses", "HIPAA-aligned", "Philippine DOH-ready"].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-secondary" /> {t}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative h-[480px] rounded-2xl overflow-hidden bg-primary/4 border border-primary/10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-primary/10" />
            <div className="absolute inset-5 rounded-xl border border-border bg-card shadow-lg p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary/25 flex items-center justify-center">
                  <HeartPulse className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Isabella Tan, 6 yrs</div>
                  <div className="text-xs text-muted-foreground">Developmental Digital Twin</div>
                </div>
                <Badge className="ml-auto bg-red-100 text-red-700 border-red-200 text-xs">Critical</Badge>
              </div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Domain Scores</div>
              <div className="flex flex-col gap-2.5 flex-1">
                {DOMAINS.map(d => (
                  <div key={d.name} className="flex items-center gap-3">
                    <div className="text-xs text-muted-foreground w-32 shrink-0">{d.name}</div>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${d.score}%` }}
                        transition={{ duration: 1, delay: 0.8 }}
                        className={`h-full rounded-full ${d.color}`}
                      />
                    </div>
                    <div className="text-xs font-mono text-foreground w-6 text-right">{d.score}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                <span className="font-semibold">AI Assessment Note:</span> Clinical indicators consistent with developmental concerns requiring professional evaluation. Referral recommended.
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── TRUST BAR ──────────────────────────────────────────────────── */}
        <div className="border-y bg-muted/30 py-5 px-6">
          <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            {["Multi-tenant SaaS", "Contract-first AI (NOT diagnosis)", "6 Integrated Ecosystems", "National Scale Ready", "Philippines DOH Aligned"].map(t => (
              <span key={t} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-secondary" /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* ── 6 SYSTEMS ──────────────────────────────────────────────────── */}
        <section id="systems" className="py-24 px-6 md:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl mb-14">
              <p className="text-secondary font-semibold text-sm uppercase tracking-wider mb-3">Platform Architecture</p>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-5">
                Six integrated ecosystems. One continuous system.
              </h2>
              <p className="text-lg text-muted-foreground">
                Every stakeholder in a child's developmental journey operates within a purpose-built system — all sharing a unified data layer.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {SYSTEMS.map((sys, i) => (
                <motion.div
                  key={sys.num}
                  variants={fadeUp} initial="hidden" whileInView="visible"
                  viewport={{ once: true }} custom={i * 0.5}
                  className={`border rounded-2xl p-6 ${sys.color} flex flex-col gap-4`}
                  data-testid={`card-system-${i + 1}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background border border-border">
                      <sys.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{sys.num}</span>
                      <Badge variant="outline" className="text-xs">{sys.badge}</Badge>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{sys.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{sys.desc}</p>
                  </div>
                  <ul className="mt-auto space-y-1.5">
                    {sys.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-secondary shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── USER JOURNEY ────────────────────────────────────────────────── */}
        <section id="how-it-works" className="bg-primary py-24 px-6 md:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-secondary font-semibold text-sm uppercase tracking-wider mb-3">Care Journey</p>
              <h2 className="text-4xl md:text-5xl font-bold text-background mb-5">
                From first concern to long-term outcomes.
              </h2>
              <p className="text-lg text-background/70">
                A structured 10-step system that transforms a parent's worry into a coordinated, professionally guided care program.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {JOURNEY_STEPS.map((s, i) => (
                <motion.div
                  key={s.step}
                  variants={fadeUp} initial="hidden" whileInView="visible"
                  viewport={{ once: true }} custom={i * 0.3}
                  className="bg-background/8 border border-background/15 rounded-2xl p-5 flex flex-col gap-3"
                  data-testid={`card-journey-step-${s.step}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary text-xs font-bold">
                      {s.step}
                    </div>
                    <s.icon className="h-4 w-4 text-background/60" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-background mb-1">{s.title}</div>
                    <div className="text-xs text-background/60 leading-relaxed">{s.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── AI ENGINE ───────────────────────────────────────────────────── */}
        <section id="ai" className="py-24 px-6 md:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-secondary font-semibold text-sm uppercase tracking-wider mb-3">AI Architecture</p>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-5">
                  Five-layer behavioral intelligence engine.
                </h2>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  The AI system processes structured questionnaires, video behavioral signals, teacher inputs, and historical data through a pipeline of specialized engines — each designed for one job.
                </p>
                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-amber-900 mb-1">Critical Safety Rule</div>
                      <div className="text-sm text-amber-800 leading-relaxed">
                        The system <strong>never diagnoses</strong>. It never prescribes. It always uses risk language and defers to qualified professionals. All output is framed as:<br /><br />
                        <em>"Clinical indicators consistent with developmental concerns requiring professional evaluation."</em>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {AI_LAYERS.map((layer, i) => (
                  <motion.div
                    key={layer.layer}
                    variants={fadeUp} initial="hidden" whileInView="visible"
                    viewport={{ once: true }} custom={i * 0.4}
                    className="border border-border rounded-xl p-5 flex items-start gap-4 bg-card"
                    data-testid={`card-ai-layer-${i + 1}`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 shrink-0">
                      <layer.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{layer.layer}</span>
                        <span className="text-sm font-bold text-foreground">{layer.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{layer.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── DOMAIN SCORING VISUAL ────────────────────────────────────── */}
        <section className="bg-muted/30 border-y py-20 px-6 md:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-12">
              <p className="text-secondary font-semibold text-sm uppercase tracking-wider mb-3">Assessment Output</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Five developmental domains. One risk score.</h2>
              <p className="text-muted-foreground">Each screening generates quantified scores across 5 domains — surfacing exactly where intervention is needed.</p>
            </div>
            <div className="grid sm:grid-cols-5 gap-4 max-w-4xl mx-auto">
              {[
                { domain: "Communication", score: "0–100", icon: MessageSquare, color: "border-chart-1/30 bg-chart-1/5" },
                { domain: "Social Interaction", score: "0–100", icon: Users, color: "border-chart-3/30 bg-chart-3/5" },
                { domain: "Attention", score: "0–100", icon: Zap, color: "border-chart-4/30 bg-chart-4/5" },
                { domain: "Motor Skills", score: "0–100", icon: Activity, color: "border-secondary/30 bg-secondary/5" },
                { domain: "Emotional Regulation", score: "0–100", icon: HeartPulse, color: "border-chart-5/30 bg-chart-5/5" }
              ].map(d => (
                <div key={d.domain} className={`border rounded-xl p-5 text-center flex flex-col items-center gap-3 ${d.color}`} data-testid={`card-domain-${d.domain.toLowerCase().replace(/ /g, "-")}`}>
                  <d.icon className="h-6 w-6 text-primary" />
                  <div className="text-sm font-semibold text-foreground">{d.domain}</div>
                  <div className="text-xs text-muted-foreground font-mono">{d.score}</div>
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-4 gap-4 max-w-2xl mx-auto mt-6">
              {[
                { level: "Low", color: "bg-green-100 border-green-200 text-green-800" },
                { level: "Moderate", color: "bg-yellow-100 border-yellow-200 text-yellow-800" },
                { level: "High", color: "bg-orange-100 border-orange-200 text-orange-800" },
                { level: "Critical", color: "bg-red-100 border-red-200 text-red-800" }
              ].map(r => (
                <div key={r.level} className={`rounded-lg border px-4 py-3 text-center text-sm font-semibold ${r.color}`} data-testid={`badge-risk-${r.level.toLowerCase()}`}>
                  {r.level} Risk
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── LIVE DEMO ───────────────────────────────────────────────────── */}
        <LandingLiveDemo />

        {/* ── PRICING ─────────────────────────────────────────────────────── */}
        <PricingSection />

        {/* ── SAFETY BLOCK ────────────────────────────────────────────────── */}
        <section className="bg-primary py-20 px-6 md:px-12">
          <div className="max-w-4xl mx-auto text-center">
            <ShieldCheck className="h-12 w-12 text-secondary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-background mb-5">
              Built with clinical responsibility at its core.
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mt-10">
              {[
                { icon: X, label: "Never diagnoses", color: "text-red-400" },
                { icon: X, label: "Never prescribes", color: "text-red-400" },
                { icon: Check, label: "Always uses risk language", color: "text-secondary" },
                { icon: Check, label: "Always defers to professionals", color: "text-secondary" }
              ].map(r => (
                <div key={r.label} className="bg-background/8 border border-background/15 rounded-xl p-5 flex flex-col items-center gap-3" data-testid={`card-safety-${r.label.toLowerCase().replace(/ /g, "-")}`}>
                  <r.icon className={`h-6 w-6 ${r.color}`} />
                  <span className="text-sm font-semibold text-background text-center">{r.label}</span>
                </div>
              ))}
            </div>
            <p className="text-background/60 text-sm mt-8 max-w-2xl mx-auto leading-relaxed">
              All AI outputs are framed as structured developmental risk indicators with referral recommendations. The system is a clinical decision support tool, not a replacement for qualified medical judgment.
            </p>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <section className="py-24 px-6 md:px-12 bg-background">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible"
              viewport={{ once: true }}
              className="flex flex-col items-center gap-6"
            >
              <HeartPulse className="h-12 w-12 text-secondary" />
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Every child deserves early, structured, expert support.
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl">
                Join clinics, families, and schools across the Philippines already using NEOBRAIN to transform developmental healthcare.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <Link href="/login">
                  <Button size="lg" className="rounded-full px-10 h-13 text-base gap-2" data-testid="button-cta-start">
                    Start for Free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="rounded-full px-10 h-13 text-base border-primary/20" data-testid="button-cta-demo">
                  Schedule a Demo
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t bg-muted/20 py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 text-primary font-bold mb-3">
                <HeartPulse className="h-6 w-6 text-secondary" />
                <span style={{ fontFamily: "var(--font-display)" }}>NEOBRAIN</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                A national AI-assisted developmental healthcare infrastructure for the Philippines. Supporting families, clinicians, and schools with structured behavioral intelligence.
              </p>
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground mb-3">Platform</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  { label: "Family Care System", href: "/family-care" },
                  { label: "Clinical System", href: "/clinical-system" },
                  { label: "Therapy System", href: "/therapy-system" },
                  { label: "School Integration", href: "/school-integration" },
                  { label: "Telehealth", href: "/telehealth" },
                  { label: "National Analytics", href: "/national-analytics" },
                ].map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-foreground transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground mb-3">Company</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  { label: "Our Story", href: "/about" },
                  { label: "Clinical Partners", href: "/clinical-partners" },
                  { label: "For Government", href: "/for-government" },
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                  { label: "Contact", href: "/contact" },
                ].map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-foreground transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} ACCENTECX. All rights reserved. Built for the Philippines.</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              <span>This platform does not diagnose. All AI outputs are for clinical decision support only.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
