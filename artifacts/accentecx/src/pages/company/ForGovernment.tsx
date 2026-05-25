import { Link } from "wouter";
import { motion } from "framer-motion";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import {
  Globe, BarChart3, Shield, MapPin, Building2, FileText,
  ArrowRight, CheckCircle2, TrendingUp, Database, Users, Lock
} from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const TIERS = [
  {
    name: "Barangay / RHU",
    desc: "Community health unit deployment with teacher observation tools and basic screening referral pipeline.",
    features: ["RHU-level screening portal", "Basic risk flagging", "Referral to partner clinics", "Barangay health reporting"],
    price: "Subsidized / DOH Grant",
  },
  {
    name: "Municipal / City",
    highlight: true,
    desc: "Full deployment across all barangays in a municipality or city, with centralized health officer dashboard.",
    features: ["All RHU features", "Municipal risk dashboard", "School integration", "Clinic network access", "Monthly DOH-ready reports"],
    price: "Contact for Pricing",
  },
  {
    name: "Provincial / Regional",
    desc: "Region-wide deployment with aggregate analytics covering all municipalities, schools, and clinics.",
    features: ["All City features", "Regional risk heatmaps", "Intervention forecasting", "LGU budget planning tools", "Research data access"],
    price: "Custom Contract",
  },
  {
    name: "National / DOH Program",
    desc: "Full national infrastructure partnership with the Department of Health for population-level developmental surveillance.",
    features: ["All Provincial features", "National analytics layer", "API integration with existing DOH systems", "Dedicated implementation team", "Research dataset access", "24/7 technical support"],
    price: "DOH Partnership",
  },
];

const USE_CASES = [
  { icon: MapPin, title: "Early Intervention Mapping", desc: "Identify barangays and municipalities with the highest concentration of unmet developmental care needs — enabling targeted allocation of therapists, SPED programs, and clinics." },
  { icon: TrendingUp, title: "Population Health Surveillance", desc: "Track how developmental outcomes trend across regions over time. Monitor the impact of early intervention programs on population-level risk levels." },
  { icon: BarChart3, title: "Budget & Resource Planning", desc: "Forecast specialist demand, therapy session volume, and SPED enrollment growth by region — enabling data-driven LGU and national health budget planning." },
  { icon: Database, title: "Research Data Access", desc: "Anonymized developmental health datasets available for DOH, SUC, and research institutions for evidence-based public health studies." },
  { icon: Shield, title: "DOH Compliance Built In", desc: "All reports, data exports, and analytics are formatted to DOH standards. Direct API integration with existing FHSIS and iClinicSys deployments." },
  { icon: FileText, title: "LGU Health Plan Support", desc: "Generate annual local health plan inputs, developmental health assessments, and congressional reporting data automatically from the platform." },
];

export default function ForGovernment() {
  return (
    <PublicLayout>
      <section className="py-20 px-6 md:px-12 bg-gradient-to-b from-slate-100 to-background">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-4 py-1.5 mb-6">
              <Globe className="h-4 w-4 text-slate-700" />
              <span className="text-sm font-semibold text-slate-700">Government & LGU Solutions</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              National developmental<br />intelligence infrastructure.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              NEOBRAIN gives the DOH, LGUs, and regional health offices the tools to understand, plan for, and respond to developmental health needs across every region of the Philippines.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="rounded-full px-10 h-13 text-base bg-primary text-primary-foreground">
                  Contact Government Sales <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link href="/national-analytics">
                <Button size="lg" variant="outline" className="rounded-full px-10 h-13 text-base border-primary/20">
                  View Analytics Demo
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/30 py-10 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[["17 regions", "National coverage"], ["100%", "Anonymized data"], ["DOH-aligned", "All report formats"], ["RA 10173", "Compliant"]].map(([n, l]) => (
            <div key={l}><p className="text-2xl font-bold text-primary mb-1">{n}</p><p className="text-sm text-muted-foreground">{l}</p></div>
          ))}
        </div>
      </section>

      <section className="py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Government use cases</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">From barangay health workers to DOH national program offices — each level of government has a purpose-built deployment.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {USE_CASES.map((u, i) => {
              const Icon = u.icon;
              return (
                <motion.div key={u.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                  className="rounded-2xl border bg-card p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 mb-4">
                    <Icon className="h-5 w-5 text-slate-700" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{u.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{u.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 md:px-12 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Deployment tiers</h2>
            <p className="text-muted-foreground">From barangay pilot to national program — deployment scales to any level of government.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {TIERS.map((t: any, i) => (
              <motion.div key={t.name} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className={`rounded-2xl border p-7 ${t.highlight ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${t.highlight ? "text-secondary" : "text-primary"}`}>{t.price}</p>
                <h3 className={`text-xl font-bold mb-3 ${t.highlight ? "text-primary-foreground" : "text-foreground"}`}>{t.name}</h3>
                <p className={`text-sm mb-5 leading-relaxed ${t.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{t.desc}</p>
                <ul className="space-y-2">
                  {t.features.map((f: string) => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${t.highlight ? "text-primary-foreground" : "text-foreground"}`}>
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary" />{f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/contact">
              <Button className="rounded-full bg-primary text-primary-foreground px-10 h-12 font-bold">
                Contact Government Sales <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 border-t">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-start gap-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shrink-0">
            <Lock className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">Data sovereignty and privacy commitment</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">All government-facing analytics are fully anonymized. No individual child or family data is ever exposed through the government analytics layer. The Philippine government retains full ownership of aggregated health data generated within its jurisdiction. ACCENTECX AI operates as a data processor, not a data controller, under RA 10173.</p>
            <Link href="/privacy" className="text-primary text-sm font-medium hover:underline">Read our full Privacy Policy →</Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
