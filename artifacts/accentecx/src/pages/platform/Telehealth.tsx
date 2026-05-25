import { Link } from "wouter";
import { motion } from "framer-motion";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import {
  Video, Calendar, MessageSquare, Shield, MapPin, Clock,
  ArrowRight, CheckCircle2, Stethoscope, Wifi, FileText
} from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const FEATURES = [
  { icon: Video, title: "Secure Video Consultations", desc: "End-to-end encrypted video sessions between parents and specialists. No third-party video apps — fully integrated within the platform." },
  { icon: Calendar, title: "Integrated Scheduling", desc: "Parents book directly from the family app into specialist calendars. Automated reminders reduce no-shows. Reschedule with one tap." },
  { icon: MessageSquare, title: "Asynchronous Specialist Messaging", desc: "Send questions, progress photos, and session notes to your doctor or therapist between live appointments. Responses within 24 hours." },
  { icon: FileText, title: "Session Notes & Follow-ups", desc: "Doctors and therapists document session notes directly in the platform. Follow-up tasks automatically appear in the parent's dashboard." },
  { icon: Shield, title: "HIPAA-aligned Security", desc: "All telehealth sessions are encrypted, access-controlled, and logged for audit. Patient data never leaves Philippine servers." },
  { icon: Clock, title: "Follow-up Automation", desc: "After each telehealth session, automated follow-up prompts, assessment reminders, and next-session prep are pushed to patients." },
];

const SPECIALISTS = [
  "Developmental Pediatrician", "Child & Adolescent Psychiatrist", "Pediatric Neurologist",
  "Occupational Therapist (OT)", "Speech-Language Pathologist", "Behavioral Therapist",
  "Clinical Psychologist", "Physical Therapist", "Special Education Specialist"
];

export default function Telehealth() {
  return (
    <PublicLayout>
      <section className="py-20 px-6 md:px-12 bg-gradient-to-b from-violet-50 to-background">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 mb-6">
              <Video className="h-4 w-4 text-violet-700" />
              <span className="text-sm font-semibold text-violet-700">Telehealth System</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Expert care, anywhere<br />in the Philippines.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              NEOBRAIN Telehealth brings developmental pediatricians, therapists, and behavioral specialists to families in Mindanao, the Visayas, and beyond — no travel required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/onboarding?role=parent&plan=care-plus">
                <Button size="lg" className="rounded-full px-10 h-13 text-base bg-primary text-primary-foreground">
                  Book a Telehealth Session <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link href="/clinical-system">
                <Button size="lg" variant="outline" className="rounded-full px-10 h-13 text-base border-primary/20">
                  For Clinicians
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/30 py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm font-semibold text-muted-foreground mb-4">Accessible to families across all regions</p>
          <div className="flex flex-wrap justify-center gap-3">
            {["Metro Manila", "Luzon", "Visayas", "Mindanao", "BARMM", "Cordillera", "MIMAROPA", "Caraga"].map(r => (
              <div key={r} className="flex items-center gap-1.5 rounded-full bg-muted border px-4 py-1.5 text-sm text-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" />{r}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-foreground mb-4">Complete telehealth infrastructure</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Not just a video call — a complete care delivery system with scheduling, documentation, and follow-up built in.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                  className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 mb-4">
                    <Icon className="h-5 w-5 text-violet-700" />
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
            <h2 className="text-4xl font-bold text-foreground mb-4">Specialists available on the platform</h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {SPECIALISTS.map(s => (
              <div key={s} className="flex items-center gap-3 rounded-xl border bg-card p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Stethoscope className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 border-t">
        <div className="max-w-3xl mx-auto rounded-2xl bg-primary p-10 text-center">
          <div className="flex justify-center mb-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/20">
              <Wifi className="h-7 w-7 text-secondary" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-primary-foreground mb-3">Works on low-bandwidth connections</h2>
          <p className="text-primary-foreground/70 mb-7">Designed for Philippine internet realities — NEOBRAIN telehealth is optimized for 4G and even 3G connections, with adaptive video quality.</p>
          <Link href="/onboarding?role=parent&plan=care-plus">
            <Button className="rounded-full bg-secondary text-secondary-foreground px-8 h-12 font-bold">
              Try it Free <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
