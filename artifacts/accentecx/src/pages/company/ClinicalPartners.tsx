import { Link } from "wouter";
import { motion } from "framer-motion";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import {
  Stethoscope, GraduationCap, ActivitySquare, Building2, CheckCircle2,
  ArrowRight, BarChart3, Users, Globe, Star, Shield
} from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const PARTNER_TYPES = [
  {
    icon: Stethoscope,
    title: "Developmental Pediatric Clinics",
    desc: "Solo practices to multi-doctor centers. Join the network to receive AI-assisted intake, patient referrals from the parent portal, and telehealth infrastructure.",
    benefits: ["Patient referrals from family portal", "AI-generated intake summaries", "Telehealth infrastructure", "Clinic-level analytics"],
    cta: "Register Clinic",
    href: "/onboarding?role=doctor",
  },
  {
    icon: ActivitySquare,
    title: "Therapy Centers",
    desc: "OT, speech, behavioral, and physical therapy centers. Receive referrals from partner clinics and manage your caseload through the Therapy System.",
    benefits: ["Referrals from clinic network", "Full therapy plan system", "Parent home program assignments", "Progress analytics"],
    cta: "Join as Therapy Partner",
    href: "/onboarding?role=therapist",
  },
  {
    icon: GraduationCap,
    title: "Schools & SPED Centers",
    desc: "Regular schools and Special Education centers. Integrate teacher observations with clinical records and receive real-time referral support.",
    benefits: ["Teacher observation tools", "Direct clinical referrals", "SPED tracking system", "School-level risk reports"],
    cta: "School Partnership",
    href: "/contact",
  },
  {
    icon: Building2,
    title: "Hospitals & Health Systems",
    desc: "For hospitals with pediatric, child psychiatry, or rehabilitation departments. Enterprise integration with existing HIS and DOH reporting.",
    benefits: ["Enterprise HIS integration", "Multi-department setup", "DOH reporting compliance", "Custom analytics", "Dedicated support"],
    cta: "Enterprise Contact",
    href: "/contact",
  },
];

const NETWORK_BENEFITS = [
  { icon: Users, title: "Cross-referral Network", desc: "Partner clinics and therapists appear in the family portal — parents can book directly into your calendar from any region." },
  { icon: BarChart3, title: "Shared Patient Intelligence", desc: "When a patient has both a clinic and a therapy partner, both see the same developmental timeline, screening results, and AI reports." },
  { icon: Globe, title: "National Reach", desc: "Telehealth partnerships allow your clinic to serve patients across the Philippines — not just your barangay." },
  { icon: Star, title: "Preferred Partner Listing", desc: "Verified clinical partners are listed as Preferred Providers in the ACCENTECX family portal, increasing patient discovery." },
  { icon: Shield, title: "Compliance Support", desc: "We provide PhilHealth coordination guidance, DOH compliance templates, and data governance documentation for all partners." },
];

export default function ClinicalPartners() {
  return (
    <PublicLayout>
      <section className="py-20 px-6 md:px-12 bg-gradient-to-b from-secondary/10 to-background">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary/20 px-4 py-1.5 mb-6">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Clinical Partners Program</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Join the national network<br />of developmental care.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Clinics, therapy centers, schools, and hospitals across the Philippines are building a coordinated developmental healthcare system on ACCENTECX. Here's how to join.
            </p>
            <Link href="/contact">
              <Button size="lg" className="rounded-full px-10 h-13 text-base bg-primary text-primary-foreground">
                Apply to Partner Program <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/30 py-10 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[["Clinics", "Partner Type"], ["Therapy Centers", "Partner Type"], ["Schools", "Partner Type"], ["Hospitals", "Partner Type"]].map(([n, l]) => (
            <div key={n}><p className="text-xl font-bold text-primary mb-1">{n}</p><p className="text-sm text-muted-foreground">{l}</p></div>
          ))}
        </div>
      </section>

      <section className="py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Partnership types</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Each type of clinical partner has a dedicated onboarding path and set of platform tools.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {PARTNER_TYPES.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div key={p.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="rounded-2xl border bg-card p-7">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 mb-5">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">{p.desc}</p>
                  <ul className="space-y-2 mb-6">
                    {p.benefits.map(b => (
                      <li key={b} className="flex items-center gap-2 text-sm text-foreground">
                        <CheckCircle2 className="h-4 w-4 text-secondary shrink-0" />{b}
                      </li>
                    ))}
                  </ul>
                  <Link href={p.href}>
                    <Button className="rounded-full bg-primary text-primary-foreground">{p.cta} <ArrowRight className="h-4 w-4 ml-1" /></Button>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 md:px-12 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Why join the ACCENTECX partner network?</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {NETWORK_BENEFITS.map((b, i) => {
              const Icon = b.icon;
              return (
                <motion.div key={b.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                  className="rounded-2xl border bg-card p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 mb-4">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 border-t">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to join?</h2>
          <p className="text-muted-foreground mb-8">Fill out a partnership application and our clinical partnerships team will be in touch within 2 business days.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboarding?role=doctor">
              <Button className="rounded-full bg-primary text-primary-foreground px-8 h-12 font-bold">Register as a Clinic</Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="rounded-full border-primary/30 px-8 h-12">Talk to Partnerships Team</Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
