import { Link } from "wouter";
import { motion } from "framer-motion";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import {
  Stethoscope, Brain, Video, BarChart3, FileText, Users, ShieldCheck,
  ArrowRight, CheckCircle2, Calendar, ClipboardList, Activity
} from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const FEATURES = [
  { icon: Brain, title: "AI Clinical Intake Summaries", desc: "Every patient arrives with an AI-generated summary of their screening results, behavioral flags, and risk-level across 5 developmental domains." },
  { icon: Video, title: "Video Review with AI Flags", desc: "Watch uploaded behavioral recordings with AI-overlaid timestamps marking gaze anomalies, motor delays, speech gaps, and interaction flags." },
  { icon: BarChart3, title: "Patient Risk Triage Queue", desc: "Real-time queue sorted by computed risk level. High-priority cases surface automatically so critical patients are never buried under volume." },
  { icon: ClipboardList, title: "Structured Clinical Reporting", desc: "Generate DSM-aligned, structured clinical reports from patient data — ready for download, referral, or upload to regional registries." },
  { icon: Users, title: "Multi-Doctor Role System", desc: "Add nurses, residents, and co-doctors to your clinic with separate access controls. Each role sees exactly what they need." },
  { icon: Calendar, title: "Appointment & Telehealth Management", desc: "Schedule in-person and video consultations. Integrate with the family portal so parents book directly into your clinic calendar." },
  { icon: Activity, title: "Longitudinal Patient Tracking", desc: "View a patient's full developmental timeline — every screening, appointment, therapy session, and milestone — in one scrollable view." },
  { icon: ShieldCheck, title: "Clinical Decision Support", desc: "AI outputs are always framed as clinical decision support — never diagnostic. All risk flags include source data and confidence levels." },
];

export default function ClinicalSystem() {
  return (
    <PublicLayout>
      <section className="py-20 px-6 md:px-12 bg-gradient-to-b from-blue-50 to-background">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 mb-6">
              <Stethoscope className="h-4 w-4 text-blue-700" />
              <span className="text-sm font-semibold text-blue-700">Clinical System</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              AI-enhanced clinical tools<br />for every practitioner.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              The ACCENTECX Clinical System gives developmental pediatricians, child psychiatrists, and clinical teams the intelligence layer they need — without replacing their judgment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/onboarding?role=doctor">
                <Button size="lg" className="rounded-full px-10 h-13 text-base bg-primary text-primary-foreground">
                  Register Your Clinic <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="rounded-full px-10 h-13 text-base border-primary/20">
                  Talk to Sales
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/30 py-10 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[["5-domain", "AI Risk Scoring"], ["Multi-role", "Clinic Access"], ["Real-time", "Triage Queue"], ["DSM-aligned", "Clinical Reports"]].map(([n, l]) => (
            <div key={l}><p className="text-2xl font-bold text-primary mb-1">{n}</p><p className="text-sm text-muted-foreground">{l}</p></div>
          ))}
        </div>
      </section>

      <section className="py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-foreground mb-4">Purpose-built for clinical practice</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Not a generic EHR — a specialized developmental intelligence system designed around how Filipino pediatric clinics actually work.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-4">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2 text-sm">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 md:px-12 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">What happens on your first day</h2>
          </div>
          <div className="space-y-4">
            {[
              { step: 1, title: "Register your clinic", desc: "Enter your clinic name, type, province, and add your PRC license. Takes under 5 minutes." },
              { step: 2, title: "Invite your team", desc: "Add nurses, residents, or co-doctors. Assign roles and access levels per staff member." },
              { step: 3, title: "Receive your first patient", desc: "Connect your clinic to the parent portal. Families book directly into your calendar." },
              { step: 4, title: "Review the AI intake", desc: "Before the appointment, read the AI-generated summary, risk scores, and behavioral video flags." },
              { step: 5, title: "Consult with full context", desc: "Walk in knowing the patient's screening history, risk level, teacher reports, and timeline." },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-4 rounded-xl border bg-card p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary shrink-0">
                  <span className="text-xs font-bold text-primary-foreground">{s.step}</span>
                </div>
                <div><p className="font-semibold text-foreground">{s.title}</p><p className="text-sm text-muted-foreground mt-0.5">{s.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Solo Practice", price: "₱4,999/mo", features: ["1 doctor", "Full clinical system", "Telehealth", "50 patients/month", "AI intake reports"] },
              { name: "Small Clinic", price: "₱9,999/mo", highlight: true, features: ["Up to 5 doctors", "Multi-role access", "Telehealth", "200 patients/month", "Priority AI processing", "Clinic analytics"] },
              { name: "Hospital / Large", price: "Custom", features: ["Unlimited doctors", "Enterprise integration", "Custom analytics", "Dedicated support", "API access", "DOH reporting"] },
            ].map(p => (
              <div key={p.name} className={`rounded-2xl border p-7 flex flex-col ${(p as any).highlight ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>
                <p className={`text-sm font-semibold mb-1 ${(p as any).highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{p.name}</p>
                <p className={`text-3xl font-bold mb-5 ${(p as any).highlight ? "text-primary-foreground" : "text-foreground"}`}>{p.price}</p>
                <ul className="space-y-2 flex-1 mb-6">
                  {p.features.map(f => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${(p as any).highlight ? "text-primary-foreground" : "text-foreground"}`}>
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary" />{f}
                    </li>
                  ))}
                </ul>
                <Link href={p.price === "Custom" ? "/contact" : "/onboarding?role=doctor"}>
                  <Button className={`w-full rounded-full ${(p as any).highlight ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"}`}>
                    {p.price === "Custom" ? "Contact Sales" : "Register Clinic"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
