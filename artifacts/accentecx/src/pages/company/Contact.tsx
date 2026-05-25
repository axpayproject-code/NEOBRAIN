import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail, Phone, MapPin, Clock, CheckCircle2, Loader2,
  Stethoscope, GraduationCap, Globe, Users, Building2, HeartPulse
} from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const CONTACT_TYPES = [
  { id: "family", icon: Users, label: "Family / Parent", desc: "Questions about the family plan or your child's care" },
  { id: "clinic", icon: Stethoscope, label: "Clinic / Doctor", desc: "Sales, onboarding, or clinical partnership inquiries" },
  { id: "school", icon: GraduationCap, label: "School / Institution", desc: "School licensing, SPED integration, or demo requests" },
  { id: "government", icon: Globe, label: "Government / LGU", desc: "LGU deployment, DOH integration, or policy questions" },
  { id: "other", icon: Building2, label: "Other", desc: "Press, research, partnerships, or general inquiries" },
];

const CHANNELS = [
  { icon: Mail, label: "Email", value: "hello@accentecx.ph", detail: "We respond within 1 business day" },
  { icon: Phone, label: "Phone / Viber", value: "+63 2 8XXX XXXX", detail: "Mon–Fri, 8AM–6PM PHT" },
  { icon: MapPin, label: "Office", value: "Manila, Philippines", detail: "BGC, Taguig City (by appointment)" },
  { icon: Clock, label: "Support Hours", value: "Mon–Fri 8AM–6PM", detail: "Emergency support for enterprise clients: 24/7" },
];

const PROVINCES = [
  "Metro Manila", "Cebu", "Davao", "Laguna", "Batangas", "Rizal", "Bulacan", "Pampanga",
  "Cavite", "Zambales", "Iloilo", "Cagayan de Oro", "Zamboanga", "Palawan", "Benguet",
  "Negros Occidental", "Leyte", "Albay", "Pangasinan", "Nueva Ecija", "Other Province",
];

type ContactType = typeof CONTACT_TYPES[number]["id"];

export default function Contact() {
  const [contactType, setContactType] = useState<ContactType>("family");
  const [form, setForm] = useState({ name: "", email: "", organization: "", phone: "", province: "", message: "" });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(err => ({ ...err, [e.target.name]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Partial<typeof form> = {};
    if (!form.name.trim()) errs.name = "Required";
    if (!form.email.includes("@")) errs.email = "Valid email required";
    if (!form.message.trim()) errs.message = "Please tell us a bit about your inquiry";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1400));
    setSubmitting(false);
    setSubmitted(true);
  }

  const selected = CONTACT_TYPES.find(t => t.id === contactType);

  return (
    <PublicLayout>
      <section className="py-16 px-6 md:px-12 border-b bg-muted/20">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <div className="flex justify-center mb-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
                <HeartPulse className="h-7 w-7 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Get in touch</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">Whether you're a parent with questions, a clinic ready to onboard, or a government agency exploring a pilot — we'd love to hear from you.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-6 md:px-12">
        <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-10">
          {/* Contact form */}
          <div className="md:col-span-3">
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form key="form" variants={fadeUp} initial="hidden" animate="visible" onSubmit={handleSubmit} className="space-y-6">
                  {/* Contact type */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">I am a…</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {CONTACT_TYPES.map(t => {
                        const Icon = t.icon;
                        const active = contactType === t.id;
                        return (
                          <button key={t.id} type="button" onClick={() => setContactType(t.id)}
                            className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition-all ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                            <Icon className={`h-4 w-4 mb-0.5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                            <span className={`text-xs font-bold ${active ? "text-primary" : "text-foreground"}`}>{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {selected && <p className="text-xs text-muted-foreground">{selected.desc}</p>}
                  </div>

                  <div className="rounded-2xl border bg-card p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Full Name <span className="text-red-500">*</span></Label>
                        <Input name="name" placeholder="Your full name" value={form.name} onChange={handleChange} className={`h-11 ${errors.name ? "border-red-400" : ""}`} />
                        {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Email Address <span className="text-red-500">*</span></Label>
                        <Input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} className={`h-11 ${errors.email ? "border-red-400" : ""}`} />
                        {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                      </div>
                    </div>

                    {(contactType === "clinic" || contactType === "school" || contactType === "government") && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Organization Name</Label>
                        <Input name="organization" placeholder="Your clinic, school, or agency name" value={form.organization} onChange={handleChange} className="h-11" />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Phone / Viber (optional)</Label>
                        <Input name="phone" placeholder="+63 9XX XXX XXXX" value={form.phone} onChange={handleChange} className="h-11" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Province / Region (optional)</Label>
                        <select name="province" value={form.province} onChange={handleChange} className="w-full h-11 rounded-md border border-input px-3 text-sm bg-background">
                          <option value="">Select…</option>
                          {PROVINCES.map(p => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Message <span className="text-red-500">*</span></Label>
                      <textarea name="message" value={form.message} onChange={handleChange} rows={5}
                        placeholder={
                          contactType === "family" ? "What questions do you have about the family plan or your child's care?"
                          : contactType === "clinic" ? "Tell us about your clinic — size, specialty, and what you're looking for."
                          : contactType === "school" ? "Tell us about your school — grade levels, number of students, and what you need."
                          : contactType === "government" ? "What region or LGU are you from, and what program are you exploring?"
                          : "How can we help?"
                        }
                        className={`w-full rounded-md border border-input px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary ${errors.message ? "border-red-400" : ""}`} />
                      {errors.message && <p className="text-red-500 text-xs">{errors.message}</p>}
                    </div>
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-bold">
                    {submitting ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Sending…</span> : "Send Message"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">We respond to all inquiries within 1 business day. Your data is protected under RA 10173.</p>
                </motion.form>
              ) : (
                <motion.div key="success" variants={fadeUp} initial="hidden" animate="visible" className="text-center py-12 space-y-5">
                  <div className="flex justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/20">
                      <CheckCircle2 className="h-10 w-10 text-secondary" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Message received!</h2>
                    <p className="text-muted-foreground">Thanks, <strong className="text-foreground">{form.name}</strong>. We'll be in touch at <strong className="text-foreground">{form.email}</strong> within 1 business day.</p>
                  </div>
                  <div className="rounded-xl border bg-card p-5 text-left space-y-2">
                    <p className="text-sm font-semibold text-foreground">What happens next</p>
                    {[
                      "Our team reviews your inquiry",
                      contactType === "family" ? "A support specialist replies to your questions" : "A solutions consultant reaches out",
                      contactType === "family" ? "You can also start a free trial right now" : "We schedule a demo or discovery call at your convenience",
                    ].map((s, i) => (
                      <div key={s} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 text-xs font-bold">{i + 1}</div>
                        {s}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", organization: "", phone: "", province: "", message: "" }); }}
                    className="text-sm text-primary hover:underline">Send another message</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Contact info */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Contact details</h2>
              <div className="space-y-4">
                {CHANNELS.map(c => {
                  const Icon = c.icon;
                  return (
                    <div key={c.label} className="flex items-start gap-3 rounded-xl border bg-card p-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-0.5">{c.label}</p>
                        <p className="text-sm font-bold text-foreground">{c.value}</p>
                        <p className="text-xs text-muted-foreground">{c.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border bg-primary p-6 text-center">
              <p className="text-primary-foreground font-bold mb-2">Need it faster?</p>
              <p className="text-primary-foreground/70 text-sm mb-4">For families, create a free account and start your first screening today — no sales call needed.</p>
              <a href="/onboarding?role=parent&plan=starter-care">
                <Button className="rounded-full bg-secondary text-secondary-foreground w-full font-bold">Start Free — ₱200/mo</Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
