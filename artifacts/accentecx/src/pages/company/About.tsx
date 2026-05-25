import { Link } from "wouter";
import { motion } from "framer-motion";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { HeartPulse, Globe, Shield, Brain, Users, Target, ArrowRight } from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const VALUES = [
  { icon: Shield, title: "Privacy First", desc: "Every design decision starts with data protection. We comply with RA 10173, and no clinical data is ever sold, shared, or used for advertising." },
  { icon: Brain, title: "AI as Support, Not Replacement", desc: "Our AI engines enhance clinician judgment — they don't replace it. Every AI output is clearly labeled as clinical decision support." },
  { icon: Users, title: "Built for Filipino Families", desc: "Our pricing, language, regional coverage, and clinical pathways are designed for the Philippine healthcare system — not adapted from foreign platforms." },
  { icon: Globe, title: "Access Beyond Metro Manila", desc: "Developmental care should not be a privilege. Telehealth, affordable family plans, and LGU integration are built to reach every province." },
  { icon: Target, title: "Evidence-Based Standards", desc: "All screening engines, risk scoring models, and clinical reports are grounded in validated international developmental assessment frameworks." },
];

const TEAM = [
  { name: "Dr. Maria Santos", role: "Chief Medical Officer", focus: "Developmental Pediatrics, DOH Clinical Advisor" },
  { name: "Dr. Jose dela Cruz", role: "Chief AI Officer", focus: "Behavioral ML, Computational Psychiatry" },
  { name: "Ana Reyes, MSOT", role: "Head of Therapy Systems", focus: "Occupational Therapy, SPED Integration" },
  { name: "Michael Tan", role: "Head of Engineering", focus: "Health Infrastructure, Privacy Engineering" },
  { name: "Dr. Liza Bautista", role: "Clinical Research Lead", focus: "Longitudinal Developmental Studies" },
  { name: "Carla Mendoza", role: "Head of Government Partnerships", focus: "LGU Integration, DOH Relations" },
];

export default function About() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-20 px-6 md:px-12 bg-gradient-to-b from-secondary/10 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
                <HeartPulse className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              A healthcare infrastructure<br />built for the Philippines.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              ACCENTECX AI CARE was founded with a single mission: make developmental pediatric care as accessible in Davao and Iloilo as it is in Makati — through technology designed specifically for Filipino families, clinicians, and institutions.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-secondary font-semibold text-sm uppercase tracking-wider mb-3">Our Mission</p>
              <h2 className="text-4xl font-bold text-foreground mb-6">Connect every Filipino child to the developmental care they need.</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Developmental delays and neurodevelopmental conditions — autism, ADHD, cerebral palsy, speech disorders — affect an estimated 15–20% of Filipino children. Most go undiagnosed until school age. By then, the critical early intervention window has passed.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                ACCENTECX was built to change that. We connect parents, teachers, therapists, doctors, and government health units into a single coordinated system — so no child falls through the gaps between institutions.
              </p>
              <Link href="/family-care">
                <Button className="rounded-full bg-primary text-primary-foreground">
                  Explore the Platform <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[["15–20%", "of Filipino children have a developmental concern"], ["5 years", "average age at first diagnosis — we aim to make it 18 months"], ["₱200/mo", "starting price for family AI care"], ["17 regions", "national coverage target by 2026"]].map(([n, l]) => (
                <div key={l} className="rounded-2xl border bg-card p-6">
                  <p className="text-3xl font-bold text-primary mb-2">{n}</p>
                  <p className="text-sm text-muted-foreground leading-snug">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6 md:px-12 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Our values</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div key={v.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                  className="rounded-2xl border bg-card p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 mb-4">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Leadership team</h2>
            <p className="text-muted-foreground">Clinicians, technologists, and public health specialists united around one mission.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEAM.map((m, i) => (
              <motion.div key={m.name} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="rounded-2xl border bg-card p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <span className="text-lg font-bold text-primary">{m.name.charAt(0)}</span>
                </div>
                <p className="font-bold text-foreground">{m.name}</p>
                <p className="text-sm text-primary font-medium mb-2">{m.role}</p>
                <p className="text-xs text-muted-foreground">{m.focus}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 border-t">
        <div className="max-w-3xl mx-auto rounded-2xl bg-primary p-10 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-3">Join the ACCENTECX network</h2>
          <p className="text-primary-foreground/70 mb-7">Whether you're a parent, a clinician, a school, or a government unit — there's a role for you in building a healthier Philippines.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboarding?role=parent&plan=care-plus">
              <Button className="rounded-full bg-secondary text-secondary-foreground px-8 h-12 font-bold">For Families</Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="rounded-full border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 px-8 h-12">
                Talk to Our Team
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
