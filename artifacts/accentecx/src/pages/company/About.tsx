import { Link } from "wouter";
import { motion } from "framer-motion";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import {
  HeartPulse, ArrowRight, AlertTriangle, Clock, Users, TrendingUp,
  Target, Globe, Brain, School, Building2, Stethoscope, Heart,
  CheckCircle, Flag, Zap, Shield, ChevronRight, BarChart3
} from "lucide-react";
import { BrainSvg } from "@/components/ui/NeoBrainLogo";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.08, ease: "easeOut" as const } }),
};

const CRISIS_STATS = [
  { value: "22M+", label: "Children under 15 in the Philippines", sub: "~3.5 million have a developmental concern" },
  { value: "278", label: "Licensed developmental pediatricians", sub: "For 110 million Filipinos — Philippine Pediatric Society, 2025" },
  { value: "1:370K", label: "Specialist-to-child ratio", sub: "WHO recommends 1:5,000" },
  { value: "88%", label: "Children who need help never get it", sub: "Only 12% ever access any form of intervention" },
];

const TIMELINE = [
  {
    year: "2000s",
    title: "Invisible crisis",
    desc: "Developmental delays went almost entirely untracked. Families relied on word of mouth, charitable organizations, and underfunded public hospitals. No national registry. No coordinated system.",
    color: "border-red-400",
  },
  {
    year: "2010",
    title: "First cracks of awareness",
    desc: "The Department of Education introduced Special Education (SPED) centers in select public schools — but without universal screening, most children never entered the system. Diagnosis still averaged 5–7 years of age.",
    color: "border-orange-400",
  },
  {
    year: "2015",
    title: "DOH sounds the alarm",
    desc: "The Department of Health estimated over 1 million Filipino children had unmet developmental needs. No functional tracking system existed. Referral chains between families, schools, and clinicians were completely broken.",
    color: "border-yellow-400",
  },
  {
    year: "2020",
    title: "Pandemic widens the gap",
    desc: "School closures cut the last thread for millions of children — teachers who noticed delays could no longer see their students. Telehealth adoption surged 400% nationally, but developmental pediatrics remained offline and inaccessible.",
    color: "border-amber-400",
  },
  {
    year: "2022",
    title: "A system still failing",
    desc: "Only 278 physicians were registered with the Philippine Pediatric Society's developmental section. Wait times for a single developmental evaluation reached 8–14 months in Metro Manila. Outside NCR: 18–24 months, or never.",
    color: "border-[#0038A8]/40",
  },
  {
    year: "2026",
    title: "NEOBRAIN is founded — and scaling",
    desc: "ACCENTECX AI launches NEOBRAIN — AI-assisted infrastructure built specifically for the Philippine healthcare system. In our founding year, we are already live in Metro Manila, Cebu, and Davao, with 500+ clinicians, 50 schools, and the first LGU partnerships underway. The DOH data-sharing pilot begins. The mission: 10 million children by 2028.",
    color: "border-[#FCD116]",
    highlight: true,
  },
];

const MISSION_PILLARS = [
  {
    icon: Brain,
    title: "AI-powered early detection",
    desc: "Replace the 8-month waitlist with a 12-second AI screening available to every Filipino parent with a smartphone. Flag developmental concerns at 18 months, not at 6 years.",
  },
  {
    icon: Globe,
    title: "Reach every region",
    desc: "Telehealth appointments, asynchronous video assessments, and LGU-integrated dashboards mean a family in Cotabato or Samar accesses the same clinical quality as Makati.",
  },
  {
    icon: School,
    title: "Embed into schools",
    desc: "Teachers are the first to see delays. NEOBRAIN integrates with public and private schools so teacher observations feed directly into a child's developmental record — creating the loop that never existed.",
  },
  {
    icon: Stethoscope,
    title: "Empower every clinician",
    desc: "278 developmental pediatricians cannot see 3.5 million children. NEOBRAIN multiplies each specialist's reach with AI pre-screening, structured clinical intake, automated reports, and coordinated referral chains.",
  },
  {
    icon: Building2,
    title: "Partner with government",
    desc: "National data dashboards for DOH, DSWD, and DepEd — so policy decisions are backed by real prevalence data, not 10-year-old estimates. LGU integration brings Barangay Health Centers into the system.",
  },
  {
    icon: Shield,
    title: "Keep it affordable",
    desc: "₱200/month family plans. Free school-level screening tools. Government-subsidized access for indigent families through LGU partnerships. Quality developmental care cannot remain a Metro Manila privilege.",
  },
];

const ROADMAP = [
  {
    phase: "Phase 1",
    period: "2024 – 2025",
    target: "100,000 children",
    goals: [
      "Launched in Metro Manila, Cebu, Davao",
      "500+ licensed clinicians on-platform",
      "50 partner schools integrated",
      "Core AI screening engine live",
    ],
    status: "done",
  },
  {
    phase: "Phase 2",
    period: "2026 – 2027",
    target: "2 million children",
    goals: [
      "Expanding to all 17 regions",
      "5,000 clinicians and therapists",
      "500 schools and 50 LGUs",
      "DOH data-sharing pilot underway",
    ],
    status: "active",
  },
  {
    phase: "Phase 3",
    period: "2028",
    target: "10 million children",
    goals: [
      "National coverage — every province",
      "Full DOH and DepEd integration",
      "10,000+ certified practitioners",
      "Government reimbursement framework",
    ],
    status: "mission",
  },
];

const HOW_TO_HELP = [
  {
    icon: Heart,
    audience: "For Families",
    color: "bg-rose-50 border-rose-200",
    iconColor: "text-rose-600",
    badgeColor: "bg-rose-100 text-rose-700",
    title: "Start with your child today",
    desc: "Early screening changes everything. Create a free account, build your child's developmental profile, and get AI-powered insights reviewed by real clinicians — in days, not months.",
    cta: "Start Free Assessment",
    href: "/onboarding?role=family",
  },
  {
    icon: Stethoscope,
    audience: "For Clinicians",
    color: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-600",
    badgeColor: "bg-blue-100 text-blue-700",
    title: "Multiply your clinical reach",
    desc: "Join NEOBRAIN as a licensed developmental pediatrician, psychologist, speech therapist, or OT. AI pre-screening lets you focus your expertise where it matters most — and see more children than ever before.",
    cta: "Join as Clinician",
    href: "/onboarding?role=doctor",
  },
  {
    icon: School,
    audience: "For Schools",
    color: "bg-purple-50 border-purple-200",
    iconColor: "text-purple-600",
    badgeColor: "bg-purple-100 text-purple-700",
    title: "Become an early detection hub",
    desc: "Integrate NEOBRAIN into your school's health workflow. Teachers can log observations, principals get aggregate developmental data, and at-risk children are flagged before they fall behind.",
    cta: "Partner with Us",
    href: "/contact?type=school",
  },
  {
    icon: Building2,
    audience: "For Government",
    color: "bg-green-50 border-green-200",
    iconColor: "text-[#0038A8]",
    badgeColor: "bg-[#FCD116]/30 text-[#0038A8]",
    title: "Build the national system",
    desc: "LGUs and national agencies get real-time prevalence dashboards, Barangay Health Center integration, and subsidy management tools. Help us build the developmental health infrastructure the Philippines never had.",
    cta: "Government Inquiry",
    href: "/for-government",
  },
  {
    icon: TrendingUp,
    audience: "For Investors",
    color: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-700",
    badgeColor: "bg-amber-100 text-amber-700",
    title: "Fund a national health transformation",
    desc: "NEOBRAIN is not a startup — it's infrastructure. We are building the developmental health layer for a 110-million person nation with virtually zero existing digital health coverage in this domain. The opportunity is generational.",
    cta: "Investor Relations",
    href: "/contact?type=investor",
  },
  {
    icon: Zap,
    audience: "For Tech Partners",
    color: "bg-indigo-50 border-indigo-200",
    iconColor: "text-indigo-600",
    badgeColor: "bg-indigo-100 text-indigo-700",
    title: "Build on NEOBRAIN",
    desc: "We offer API access for EMR systems, hospital networks, insurance providers, and health tech companies. Join a platform already wired into schools, clinics, and government systems nationwide.",
    cta: "Partner API Access",
    href: "/contact?type=tech",
  },
];

export default function About() {
  return (
    <PublicLayout>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative py-24 px-6 md:px-12 bg-gradient-to-br from-[#0038A8] to-[#001A70] overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "radial-gradient(circle at 20% 60%, #FCD116 0%, transparent 50%), radial-gradient(circle at 80% 20%, #FCD116 0%, transparent 40%)"
        }} />
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FCD116]/30 bg-[#FCD116]/10 px-4 py-1.5 text-sm font-semibold text-[#FCD116] mb-8">
              <HeartPulse className="h-4 w-4" />
              Our Story
            </div>
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} initial="hidden" animate="visible"
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tighter mb-7"
          >
            3.5 million Filipino children are waiting.<br />
            <span className="text-[#FCD116]">We refused to look away.</span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} initial="hidden" animate="visible"
            className="text-xl text-white/65 max-w-2xl mx-auto leading-relaxed"
          >
            NEOBRAIN was not born in a boardroom. It was born from a question we could not stop asking: why does one of the fastest-growing economies in Southeast Asia have almost no developmental healthcare infrastructure for its children?
          </motion.p>
        </div>
      </section>

      {/* ── CRISIS STATS ─────────────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-12 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#0038A8] font-semibold text-sm uppercase tracking-wider mb-3">The Scale of the Problem</p>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
              The numbers that made us act.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              These are not projections or estimates from a foreign study. This is the Philippine developmental healthcare system — today.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CRISIS_STATS.map((s, i) => (
              <motion.div key={s.value} variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="rounded-2xl border-2 border-[#0038A8]/10 bg-card p-7 text-center"
              >
                <p className="text-4xl md:text-5xl font-bold text-[#0038A8] mb-3">{s.value}</p>
                <p className="text-sm font-semibold text-foreground mb-1.5">{s.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Extra context */}
          <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-7 grid md:grid-cols-3 gap-6">
            {[
              { icon: Clock, label: "8–14 months", desc: "Average wait time for a developmental evaluation in Metro Manila. Outside NCR: 18–24 months — if available at all." },
              { icon: AlertTriangle, label: "5–7 years old", desc: "The average age at first diagnosis for autism and ADHD in the Philippines. The critical intervention window is 0–3 years." },
              { icon: BarChart3, label: "3% of facilities", desc: "Only 3% of PSA-registered healthcare facilities in the Philippines offer developmental pediatric services." },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 shrink-0">
                  <Icon className="h-5 w-5 text-red-700" />
                </div>
                <div>
                  <p className="font-bold text-red-900 mb-1">{label}</p>
                  <p className="text-sm text-red-800/70 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIMELINE ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-12 bg-muted/20 border-y">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#0038A8] font-semibold text-sm uppercase tracking-wider mb-3">How We Got Here</p>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
              A crisis two decades in the making.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Understanding why NEOBRAIN exists means understanding the timeline of a system that was never built.
            </p>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border hidden md:block" />

            <div className="space-y-8">
              {TIMELINE.map((item, i) => (
                <motion.div key={item.year} variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  className="flex gap-6"
                >
                  {/* Year node */}
                  <div className="shrink-0 flex flex-col items-center">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${item.highlight ? "bg-[#0038A8] border-[#FCD116] text-[#FCD116]" : "bg-background border-border text-muted-foreground"} text-xs font-bold shrink-0`}>
                      {item.highlight ? <Flag className="h-4 w-4" /> : <span>{item.year.slice(-2)}</span>}
                    </div>
                  </div>
                  {/* Content */}
                  <div className={`flex-1 rounded-2xl border-l-4 ${item.color} ${item.highlight ? "bg-[#0038A8]/5 border border-[#0038A8]/20" : "bg-card border border-border"} p-6 -mt-1`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.highlight ? "bg-[#FCD116]/20 text-[#0038A8]" : "bg-muted text-muted-foreground"}`}>
                        {item.year}
                      </span>
                      <h3 className="font-bold text-foreground">{item.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MISSION 10M ──────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12 bg-gradient-to-br from-[#0038A8] to-[#001A70] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "radial-gradient(circle at 70% 30%, #FCD116 0%, transparent 50%)"
        }} />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FCD116]/30 bg-[#FCD116]/10 px-4 py-1.5 text-sm font-semibold text-[#FCD116] mb-6">
              <Target className="h-4 w-4" />
              Our Mission
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-6">
              10 million children.<br />
              <span className="text-[#FCD116]">By 2028.</span>
            </h2>
            <p className="text-xl text-white/65 max-w-2xl mx-auto leading-relaxed">
              Not screened. Not enrolled. Not just reached. <strong className="text-white">Actually helped</strong> — with structured developmental support, coordinated care, and a digital record that follows them through school, therapy, and beyond.
            </p>
          </div>

          {/* Roadmap phases */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {ROADMAP.map((phase, i) => (
              <motion.div key={phase.phase} variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className={`rounded-2xl border p-7 ${phase.status === "active" ? "border-[#FCD116]/50 bg-[#FCD116]/10" : phase.status === "mission" ? "border-white/20 bg-white/5" : "border-white/10 bg-white/5"}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    phase.status === "active" ? "bg-[#FCD116] text-[#0038A8]" :
                    phase.status === "done" ? "bg-white/15 text-white/80" :
                    phase.status === "mission" ? "bg-white/20 text-white" :
                    "bg-white/10 text-white/60"
                  }`}>
                    {phase.status === "active" ? "● Live Now" : phase.status === "done" ? "✓ Completed" : phase.status === "mission" ? "🎯 Mission Goal" : "Planned"}
                  </span>
                  <span className="text-xs text-white/50">{phase.period}</span>
                </div>
                <p className="text-sm font-semibold text-white/60 mb-1">{phase.phase}</p>
                <p className="text-3xl font-bold text-[#FCD116] mb-4">{phase.target}</p>
                <ul className="space-y-2">
                  {phase.goals.map(goal => (
                    <li key={goal} className="flex items-start gap-2 text-sm text-white/70">
                      <CheckCircle className="h-4 w-4 text-[#FCD116] shrink-0 mt-0.5" />
                      {goal}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* How we get there — 6 pillars */}
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-white mb-2">How we reach 10 million</h3>
            <p className="text-white/55 max-w-xl mx-auto text-sm">Six interconnected systems that together create the developmental health infrastructure the Philippines has never had.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MISSION_PILLARS.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div key={p.title} variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  className="rounded-xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FCD116]/15 mb-4">
                    <Icon className="h-5 w-5 text-[#FCD116]" />
                  </div>
                  <h4 className="font-bold text-white mb-2 text-sm">{p.title}</h4>
                  <p className="text-xs text-white/55 leading-relaxed">{p.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WHAT WE NEED FROM EVERYONE ───────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#0038A8] font-semibold text-sm uppercase tracking-wider mb-3">Join the Mission</p>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-5">
              10 million children requires everyone.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              No single team, government agency, or technology platform can fix a crisis this deep. This mission belongs to families, clinicians, schools, local governments, and every Filipino who believes every child deserves a chance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {HOW_TO_HELP.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div key={card.audience} variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  className={`rounded-2xl border-2 p-7 flex flex-col ${card.color}`}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white/80`}>
                      <Icon className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${card.badgeColor}`}>{card.audience}</span>
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-5">{card.desc}</p>
                  <Link href={card.href}>
                    <Button size="sm" className="w-full rounded-full gap-1.5 bg-[#0038A8] text-white hover:bg-[#1e4a00]">
                      {card.cta} <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CLOSING CONVICTION ───────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12 border-t bg-muted/10">
        <div className="max-w-3xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center"
          >
            <BrainSvg className="h-14 w-14 text-[#FCD116] mx-auto mb-8" />
            <blockquote className="text-3xl md:text-4xl font-bold text-foreground leading-snug mb-8 tracking-tight">
              "Every week we do not build this, 10,000 more Filipino children miss the window that changes everything."
            </blockquote>
            <p className="text-muted-foreground mb-3 text-sm font-medium">— The founding team, NEOBRAIN by ACCENTECX</p>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-12">
              We are not waiting for a government mandate, a foreign philanthropist, or perfect conditions. We are building now — for every child already in the wait queue, every parent who doesn't know who to call, every teacher who suspects something but has no system to report to.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/onboarding?role=family">
                <Button size="lg" className="rounded-full px-10 h-13 gap-2 bg-[#0038A8] text-white hover:bg-[#1e4a00]">
                  Join the Mission <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="rounded-full px-10 h-13 gap-2 border-[#0038A8]/20">
                  Talk to Our Team
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </PublicLayout>
  );
}
