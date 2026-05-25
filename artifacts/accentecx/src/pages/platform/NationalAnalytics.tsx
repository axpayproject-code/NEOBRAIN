import { Link } from "wouter";
import { motion } from "framer-motion";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import {
  Globe, BarChart3, MapPin, Shield, Brain, FileText, ArrowRight,
  TrendingUp, Database, Lock, Users, Building2
} from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const FEATURES = [
  { icon: MapPin, title: "Regional Risk Mapping", desc: "Heatmaps of developmental risk levels by province, municipality, and barangay — enabling targeted early intervention resource allocation." },
  { icon: TrendingUp, title: "Developmental Trend Analysis", desc: "Track how developmental outcomes change over time across regions. Identify improving areas and deteriorating risk clusters." },
  { icon: Brain, title: "AI Intervention Forecasting", desc: "Predictive models estimate future specialist demand, therapy capacity needs, and screening volume by region — 6 months ahead." },
  { icon: Database, title: "Healthcare Resource Planning", desc: "Match developmental risk distribution to existing pediatric infrastructure — clinics, therapists, SPED classrooms — to identify service gaps." },
  { icon: Shield, title: "Fully Anonymized Data", desc: "No individual patient data is included in government-facing analytics. All outputs are aggregate-only, privacy-preserving, and RA 10173 compliant." },
  { icon: FileText, title: "DOH-Ready Reporting", desc: "Export formatted reports in DOH standard formats for national health plan submissions, LGU health assessments, and Congressional reporting." },
];

const DOMAINS = [
  { name: "Communication & Language", pct: 78 },
  { name: "Social Interaction", pct: 64 },
  { name: "Attention & Focus", pct: 52 },
  { name: "Motor Development", pct: 85 },
  { name: "Emotional Regulation", pct: 59 },
];

export default function NationalAnalytics() {
  return (
    <PublicLayout>
      <section className="py-20 px-6 md:px-12 bg-gradient-to-b from-slate-100 to-background">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-4 py-1.5 mb-6">
              <Globe className="h-4 w-4 text-slate-700" />
              <span className="text-sm font-semibold text-slate-700">National Analytics Layer</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Population-level intelligence<br />for national health planning.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              The ACCENTECX National Analytics Layer gives the DOH, LGUs, and research institutions anonymized, real-time developmental health data across the Philippines — without accessing individual patient records.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/for-government">
                <Button size="lg" className="rounded-full px-10 h-13 text-base bg-primary text-primary-foreground">
                  Government Solutions <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="rounded-full px-10 h-13 text-base border-primary/20">
                  Contact Analytics Team
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/30 py-10 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[["17 regions", "Covered"], ["5 domains", "Tracked"], ["100%", "Anonymized"], ["Real-time", "Updates"]].map(([n, l]) => (
            <div key={l}><p className="text-2xl font-bold text-primary mb-1">{n}</p><p className="text-sm text-muted-foreground">{l}</p></div>
          ))}
        </div>
      </section>

      <section className="py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-foreground mb-4">National-scale developmental intelligence</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Built for health planners, researchers, and LGU administrators who need data to make decisions — not individual patient records.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                  className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 mb-4">
                    <Icon className="h-5 w-5 text-slate-700" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 md:px-12 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-4">What the dashboard shows</h2>
            <p className="text-muted-foreground">A live view of developmental health across all regions — example domain risk scores below.</p>
          </div>
          <div className="rounded-2xl border bg-card p-7 space-y-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-foreground">National Average — Developmental Domain Risk Levels</p>
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-3 py-1">Anonymized</span>
            </div>
            {DOMAINS.map(d => (
              <div key={d.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground font-medium">{d.name}</span>
                  <span className="text-muted-foreground">{d.pct}% within normal range</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${d.pct}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full rounded-full bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 border-t">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border bg-card p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-4">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">For LGU Health Officers</h3>
              <p className="text-sm text-muted-foreground mb-5">View municipal and barangay-level risk distributions. Allocate RHU resources based on real developmental data, not estimates.</p>
              <Link href="/for-government"><Button className="rounded-full bg-primary text-primary-foreground">Learn More</Button></Link>
            </div>
            <div className="rounded-2xl border bg-card p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-4">
                <Lock className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">Privacy-first architecture</h3>
              <p className="text-sm text-muted-foreground mb-5">Government access is limited to aggregated, anonymized datasets only. No government body can access individual child or family records through this layer.</p>
              <Link href="/privacy"><Button variant="outline" className="rounded-full border-primary/30">Privacy Policy</Button></Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
