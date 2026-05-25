import { Link } from "wouter";
import { motion } from "framer-motion";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import {
  ActivitySquare, ClipboardList, BarChart3, Calendar, Users, FileText,
  ArrowRight, CheckCircle2, Target, Brain, MessageSquare, Repeat
} from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const THERAPY_TYPES = [
  { name: "Speech-Language Therapy", color: "bg-blue-100 text-blue-700" },
  { name: "Occupational Therapy (OT)", color: "bg-amber-100 text-amber-700" },
  { name: "Behavioral Therapy (ABA)", color: "bg-green-100 text-green-700" },
  { name: "Physical Therapy", color: "bg-purple-100 text-purple-700" },
  { name: "Cognitive Behavioral Therapy", color: "bg-red-100 text-red-700" },
  { name: "Play Therapy", color: "bg-pink-100 text-pink-700" },
  { name: "Special Education", color: "bg-teal-100 text-teal-700" },
];

const FEATURES = [
  { icon: Target, title: "Structured Therapy Plans", desc: "Build goal-based therapy programs with weekly targets, session tracking, and auto-adjusted difficulty based on patient progress." },
  { icon: ClipboardList, title: "Session Documentation", desc: "Log session notes, completed exercises, and behavioral observations quickly — structured templates keep documentation consistent." },
  { icon: BarChart3, title: "Progress Analytics", desc: "Visual dashboards showing goal achievement rates, domain improvement over time, and clinician-set milestones." },
  { icon: Users, title: "Parent Assignment System", desc: "Push home exercise programs directly to the parent app. Track completion rates and receive parent feedback between sessions." },
  { icon: Calendar, title: "Session Scheduling", desc: "Set recurring therapy schedules. Patients receive automated reminders. Rescheduling updates both therapist and parent instantly." },
  { icon: Brain, title: "AI Progress Summaries", desc: "Monthly AI-generated summaries of each patient's therapy progress, ready to share with referring doctors or schools." },
  { icon: MessageSquare, title: "Clinic & Family Communication", desc: "Secure messaging with parents and doctors. Share session summaries, flag concerns, and receive updated screening data." },
  { icon: Repeat, title: "Caseload Management", desc: "View your full caseload sorted by priority, session frequency, and risk level. Never miss a follow-up or lapsed patient." },
];

export default function TherapySystem() {
  return (
    <PublicLayout>
      <section className="py-20 px-6 md:px-12 bg-gradient-to-b from-amber-50 to-background">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 mb-6">
              <ActivitySquare className="h-4 w-4 text-amber-700" />
              <span className="text-sm font-semibold text-amber-700">Therapy System</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              End-to-end therapy<br />management, simplified.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              NEOBRAIN gives therapists a complete workspace — from structured care plans and session documentation to parent home programs and AI progress reporting.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/onboarding?role=therapist">
                <Button size="lg" className="rounded-full px-10 h-13 text-base bg-primary text-primary-foreground">
                  Register as Therapist <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link href="/clinical-partners">
                <Button size="lg" variant="outline" className="rounded-full px-10 h-13 text-base border-primary/20">
                  Join a Clinic Network
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/30 py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm font-semibold text-muted-foreground mb-4">Specialty types supported</p>
          <div className="flex flex-wrap justify-center gap-2">
            {THERAPY_TYPES.map(t => (
              <span key={t.name} className={`rounded-full px-4 py-1.5 text-xs font-semibold ${t.color}`}>{t.name}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-foreground mb-4">Your complete therapy workspace</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Everything from first intake to discharge summary — built for the workflow of Filipino therapists working in clinics, schools, and homes.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 mb-4">
                    <Icon className="h-5 w-5 text-amber-700" />
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
            <h2 className="text-4xl font-bold text-foreground mb-4">Join as an independent therapist or through a clinic</h2>
            <p className="text-muted-foreground">Both paths give you full access to the Therapy System workspace.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border bg-card p-7">
              <p className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">Join a Clinic</p>
              <h3 className="text-xl font-bold text-foreground mb-3">Enter your clinic's access code</h3>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">If your clinic is already on NEOBRAIN, ask your admin for the access code. Your account connects automatically, giving you access to shared patients and clinic tools.</p>
              <ul className="space-y-2 mb-6">
                {["Shared patient caseload", "Clinic-managed scheduling", "Admin oversight & reporting", "Clinic-level analytics access"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground"><CheckCircle2 className="h-4 w-4 text-secondary shrink-0" />{f}</li>
                ))}
              </ul>
              <Link href="/onboarding?role=therapist"><Button className="w-full rounded-full bg-primary text-primary-foreground">Join a Clinic</Button></Link>
            </div>
            <div className="rounded-2xl border bg-card p-7">
              <p className="text-sm font-semibold text-amber-600 mb-2 uppercase tracking-wider">Independent</p>
              <h3 className="text-xl font-bold text-foreground mb-3">Register independently</h3>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">Set up your own therapy workspace and accept patient referrals directly. You can connect to clinics later or maintain a fully independent practice.</p>
              <ul className="space-y-2 mb-6">
                {["Your own patient caseload", "Self-managed scheduling", "Full therapy plan system", "Connect to clinics anytime"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground"><CheckCircle2 className="h-4 w-4 text-secondary shrink-0" />{f}</li>
                ))}
              </ul>
              <Link href="/onboarding?role=therapist"><Button variant="outline" className="w-full rounded-full border-primary/30">Register Independently</Button></Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
