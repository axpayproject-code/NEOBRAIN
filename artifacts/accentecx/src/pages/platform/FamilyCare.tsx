import { Link } from "wouter";
import { motion } from "framer-motion";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import {
  Users, Brain, Video, Calendar, BarChart3, FileText, Shield, Heart,
  CheckCircle2, ArrowRight, Star, Smartphone, Bell, MessageSquare
} from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const FEATURES = [
  { icon: Users, title: "Child Developmental Profiles", desc: "Create detailed digital twins for each child — tracking milestones, history, domain scores, and developmental trajectories over time." },
  { icon: Brain, title: "AI Screening Engine", desc: "Adaptive 5-domain questionnaires covering Communication, Motor Skills, Social Interaction, Attention, and Emotional Regulation." },
  { icon: Video, title: "Video Behavioral Analysis", desc: "Upload 5-minute behavioral recordings. Our AI analyzes gaze, motion, gesture frequency, and speech markers." },
  { icon: Calendar, title: "Specialist Appointment Booking", desc: "Book telehealth or in-person sessions with developmental pediatricians, OTs, speech therapists, and behavioral specialists." },
  { icon: BarChart3, title: "Progress & Milestone Tracking", desc: "Visual dashboards showing domain scores over time, completed therapy tasks, and AI-computed developmental trajectories." },
  { icon: FileText, title: "AI-Generated Reports", desc: "Plain-language summaries for parents and structured clinical reports for doctors — all generated automatically after each screening." },
  { icon: MessageSquare, title: "Specialist Messaging", desc: "Secure direct messaging with assigned therapists and doctors between sessions for questions and quick updates." },
  { icon: Bell, title: "Smart Reminders", desc: "Automated reminders for therapy exercises, appointments, screening schedules, and milestone check-ins." },
];

const PLANS = [
  { name: "Starter Care", price: "₱200/mo", features: ["1 child profile", "Basic screenings 2×/year", "AI text summary", "Email support"], href: "/onboarding?role=family&plan=starter-care" },
  { name: "Care Plus", price: "₱799/mo", highlight: true, features: ["4 child profiles", "Unlimited screenings", "Video analysis 3×/mo", "Therapy tracking", "Specialist messaging"], href: "/onboarding?role=family&plan=care-plus" },
  { name: "Care Family Pro", price: "₱1,999/mo", features: ["Up to 6 children", "Priority AI processing", "Full video analytics", "Dedicated support manager"], href: "/onboarding?role=family&plan=care-family-pro" },
];

export default function FamilyCare() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-20 px-6 md:px-12 bg-gradient-to-b from-secondary/10 to-background">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary/20 px-4 py-1.5 mb-6">
              <Heart className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Family Care System</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Your child's development,<br />guided by AI.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              The ACCENTECX Family Care System gives Filipino parents a complete developmental intelligence platform — from daily screening to specialist booking, all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/onboarding?role=family&plan=care-plus">
                <Button size="lg" className="rounded-full px-10 h-13 text-base bg-primary text-primary-foreground">
                  Start Free — ₱200/mo <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link href="/#pricing">
                <Button size="lg" variant="outline" className="rounded-full px-10 h-13 text-base border-primary/20">
                  See all plans
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-muted/30 py-10 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[["5", "Developmental Domains"], ["10-step", "Clinical Journey"], ["₱200", "Starting Price"], ["AI-powered", "Every Report"]].map(([n, l]) => (
            <div key={l}><p className="text-3xl font-bold text-primary mb-1">{n}</p><p className="text-sm text-muted-foreground">{l}</p></div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-foreground mb-4">Everything your family needs</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Built for Filipino parents navigating developmental healthcare — affordable, comprehensive, and always accessible.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 mb-4">
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

      {/* How it works */}
      <section className="py-20 px-6 md:px-12 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">How it works</h2>
          </div>
          <div className="space-y-4">
            {[
              { step: 1, title: "Create your child's profile", desc: "Input age, language, developmental concerns, and medical history to personalize the system." },
              { step: 2, title: "Complete the first screening", desc: "An adaptive 25-question assessment across 5 developmental domains. Takes 10–15 minutes." },
              { step: 3, title: "Get your AI report", desc: "Domain risk levels, milestone comparison, and a plain-language summary ready immediately after screening." },
              { step: 4, title: "Follow your care plan", desc: "Daily guided exercises, therapy tasks, and specialist recommendations based on your child's profile." },
              { step: 5, title: "Track progress over time", desc: "Monthly reassessments show developmental trajectories and respond to your child's growth." },
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

      {/* Plans */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Choose your plan</h2>
            <p className="text-muted-foreground">Start at ₱200/month. No lock-in. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map(p => (
              <div key={p.name} className={`rounded-2xl border p-7 flex flex-col ${p.highlight ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>
                {p.highlight && <div className="flex items-center gap-1 text-xs font-bold text-secondary mb-3"><Star className="h-3 w-3" /> Most Popular</div>}
                <p className={`text-sm font-semibold mb-1 ${p.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{p.name}</p>
                <p className={`text-3xl font-bold mb-5 ${p.highlight ? "text-primary-foreground" : "text-foreground"}`}>{p.price}</p>
                <ul className="space-y-2 flex-1 mb-6">
                  {p.features.map(f => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${p.highlight ? "text-primary-foreground" : "text-foreground"}`}>
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary" />{f}
                    </li>
                  ))}
                </ul>
                <Link href={p.href}>
                  <Button className={`w-full rounded-full ${p.highlight ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"}`}>
                    Get Started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile badge */}
      <section className="py-12 px-6 bg-muted/30 border-t">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shrink-0">
            <Smartphone className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-foreground text-lg mb-1">Works on any device</p>
            <p className="text-muted-foreground text-sm">Access NEOBRAIN from your phone, tablet, or desktop — no app download required. Designed for Filipino families, wherever you are.</p>
          </div>
          <div className="shrink-0">
            <div className="flex items-center gap-1.5 rounded-full bg-secondary/15 px-4 py-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-primary">RA 10173 Compliant</span>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
