import { Link } from "wouter";
import { motion } from "framer-motion";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import {
  GraduationCap, ClipboardList, Users, BarChart3, Bell, FileText,
  ArrowRight, CheckCircle2, BookOpen, ArrowUpRight, Shield
} from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const FEATURES = [
  { icon: ClipboardList, title: "Teacher Observation Forms", desc: "Structured digital forms covering attention, behavior, social interaction, and learning performance — filled out by teachers during class." },
  { icon: BarChart3, title: "Classroom Behavioral Scoring", desc: "AI-standardized scoring of teacher observations integrates directly with clinical records, enriching the child's developmental profile." },
  { icon: Bell, title: "Automatic Referral Triggers", desc: "When a child's classroom scores cross clinical thresholds, the system flags the case and notifies the clinic and family for follow-up." },
  { icon: BookOpen, title: "SPED Tracking System", desc: "Track students enrolled in Special Education programs — monitor IEP milestones, therapy compliance, and classroom accommodations." },
  { icon: Users, title: "Parent-School Coordination", desc: "Parents see teacher observations in their family dashboard. Schools see parent-provided screening results. Full 360° view." },
  { icon: FileText, title: "Aggregate School Reports", desc: "Principals and guidance counselors can view anonymized class-wide and school-wide developmental risk distributions without accessing individual records." },
];

export default function SchoolIntegration() {
  return (
    <PublicLayout>
      <section className="py-20 px-6 md:px-12 bg-gradient-to-b from-green-50 to-background">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 mb-6">
              <GraduationCap className="h-4 w-4 text-green-700" />
              <span className="text-sm font-semibold text-green-700">School Integration System</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Classroom intelligence<br />meets clinical care.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              ACCENTECX connects teacher observations directly to clinical records — so developmental concerns spotted in the classroom automatically reach the right care team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="rounded-full px-10 h-13 text-base bg-primary text-primary-foreground">
                  Get School Pricing <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link href="/clinical-partners">
                <Button size="lg" variant="outline" className="rounded-full px-10 h-13 text-base border-primary/20">
                  Partner Program
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/30 py-10 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[["₱10–₱50", "Per student/year"], ["K–12", "All grade levels"], ["SPED", "Compliant tracking"], ["Real-time", "Clinical referral"]].map(([n, l]) => (
            <div key={l}><p className="text-2xl font-bold text-primary mb-1">{n}</p><p className="text-sm text-muted-foreground">{l}</p></div>
          ))}
        </div>
      </section>

      <section className="py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-foreground mb-4">Built for Filipino schools</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">From public elementary schools to private SPED centers — the School Integration System adapts to your environment.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                  className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 mb-4">
                    <Icon className="h-5 w-5 text-green-700" />
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
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">School licensing tiers</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Small School", size: "Up to 200 students", price: "₱50/student/year", features: ["Teacher observation system", "SPED tracking", "Basic referral engine", "Parent-school portal"] },
              { name: "Medium School", size: "200–1,000 students", price: "₱30/student/year", highlight: true, features: ["All Small features", "Guidance counselor dashboard", "Class-wide analytics", "Automated clinical referrals", "School-wide risk reporting"] },
              { name: "Large Network", size: "1,000+ students", price: "Custom pricing", features: ["All Medium features", "Multi-campus management", "District-level analytics", "DOH data integration", "Dedicated account manager"] },
            ].map((p: any) => (
              <div key={p.name} className={`rounded-2xl border p-7 flex flex-col ${p.highlight ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>
                <p className={`text-xs font-semibold mb-1 ${p.highlight ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{p.size}</p>
                <p className={`text-sm font-bold mb-1 ${p.highlight ? "text-primary-foreground" : "text-foreground"}`}>{p.name}</p>
                <p className={`text-2xl font-bold mb-5 ${p.highlight ? "text-secondary" : "text-primary"}`}>{p.price}</p>
                <ul className="space-y-2 flex-1 mb-6">
                  {p.features.map((f: string) => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${p.highlight ? "text-primary-foreground" : "text-foreground"}`}>
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary" />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/contact">
                  <Button className={`w-full rounded-full ${p.highlight ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"}`}>
                    {p.price === "Custom pricing" ? "Contact Sales" : "Get Started"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-6 border-t">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shrink-0">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-foreground text-lg mb-1">Student data is protected</p>
            <p className="text-sm text-muted-foreground">All student records are stored in compliance with RA 10173 (Philippine Data Privacy Act). Schools maintain data ownership. Teachers never access clinical records; clinics never access academic records.</p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
